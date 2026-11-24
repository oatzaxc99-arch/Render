import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

const cfg = JSON.parse(readFileSync("project.json", "utf8"));
const key = process.env.PAXA_API_KEY;

if (!key) {
  console.error('Missing PAXA_API_KEY (create one at https://paxalabs.com/app/keys)');
  process.exit(1);
}

const { baseUrl, model, voice, speed } = cfg.tts;

const outDir = "assets/audio";
mkdirSync(outDir, { recursive: true });

const hashFile = `${outDir}/.hashes.json`;
const hashes = existsSync(hashFile)
  ? JSON.parse(readFileSync(hashFile, "utf8"))
  : {};

// Paxa limit: 10 requests/minute.
// Use a conservative 7-second interval between successful requests.
const REQUEST_GAP_MS = 7000;
const MAX_RETRIES = 5;

function getRetryDelay(res, retryNumber) {
  const retryAfter = res?.headers?.get("retry-after");

  if (retryAfter) {
    const seconds = Number(retryAfter);

    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.ceil(seconds * 1000);
    }

    const retryDate = Date.parse(retryAfter);

    if (Number.isFinite(retryDate)) {
      return Math.max(0, retryDate - Date.now());
    }
  }

  // 7s, 14s, 28s, 56s, 60s
  return Math.min(REQUEST_GAP_MS * (2 ** (retryNumber - 1)), 60000);
}

async function requestTTS(scene, name, sceneVoice, sceneSpeed) {
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    let res;

    try {
      res = await fetch(`${baseUrl}/audio/speech`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: scene.narration,
          voice: sceneVoice,
          speed: sceneSpeed,
          response_format: "mp3",
        }),
      });
    } catch (error) {
      if (attempt > MAX_RETRIES) {
        throw new Error(
          `Network request failed for ${name} after ${MAX_RETRIES} retries: ${error.message}`
        );
      }

      const delay = Math.min(
        REQUEST_GAP_MS * (2 ** (attempt - 1)),
        60000
      );

      console.warn(
        `Network error for ${name}. Retry ${attempt}/${MAX_RETRIES} in ${Math.ceil(delay / 1000)}s`
      );

      await sleep(delay);
      continue;
    }

    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }

    const body = await res.text().catch(() => "");

    const retryable = res.status === 429 || res.status === 408 ||
      res.status === 425 || res.status >= 500;

    if (!retryable || attempt > MAX_RETRIES) {
      throw new Error(
        `Paxa TTS failed for ${name}: HTTP ${res.status}\n${body}`
      );
    }

    const delay = getRetryDelay(res, attempt);

    console.warn(
      `Paxa HTTP ${res.status} for ${name}. Retry ${attempt}/${MAX_RETRIES} in ${Math.ceil(delay / 1000)}s`
    );

    if (body) {
      console.warn(body);
    }

    await sleep(delay);
  }

  throw new Error(`TTS failed unexpectedly for ${name}`);
}

for (const [i, scene] of cfg.scenes.entries()) {
  const name = `scene-${String(i + 1).padStart(2, "0")}.mp3`;
  const path = `${outDir}/${name}`;

  const sceneVoice = scene.voice ?? voice;
  const sceneSpeed = scene.speed ?? speed;

  const sig = createHash("sha256")
    .update(JSON.stringify([
      model,
      sceneVoice,
      sceneSpeed,
      scene.narration,
    ]))
    .digest("hex");

  if (existsSync(path) && hashes[name] === sig) {
    console.log(`skip  ${name} (unchanged)`);
    continue;
  }

  // Keep a safe interval between requests.
  if (i > 0) {
    console.log("wait  7 seconds (Paxa rate limit)");
    await sleep(REQUEST_GAP_MS);
  }

  console.log(`tts   ${name}  voice=${sceneVoice}`);

  const audio = await requestTTS(
    scene,
    name,
    sceneVoice,
    sceneSpeed
  );

  writeFileSync(path, audio);

  // Update cache only after audio has been successfully saved.
  hashes[name] = sig;
  writeFileSync(hashFile, JSON.stringify(hashes, null, 2));

  console.log(`saved ${name}`);
}

console.log("TTS done.");
