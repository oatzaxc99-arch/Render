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
  console.error("Missing PAXA_API_KEY");
  process.exit(1);
}

const { baseUrl, model, voice, speed } = cfg.tts;

const outDir = "assets/audio";
mkdirSync(outDir, { recursive: true });

const hashFile = `${outDir}/.hashes.json`;
const hashes = existsSync(hashFile)
  ? JSON.parse(readFileSync(hashFile, "utf8"))
  : {};

// Conservative Paxa request pacing.
const REQUEST_GAP_MS = 65_000;
const MAX_RETRIES = 5;

let nextRequestAt = 0;

async function waitForRequestSlot() {
  const remaining = nextRequestAt - Date.now();

  if (remaining > 0) {
    console.log(`wait  ${Math.ceil(remaining / 1000)}s before next request`);
    await sleep(remaining);
  }
}

function getRetryAfterMs(res) {
  const value = res.headers.get("retry-after");
  if (!value) return 0;

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 0;
}

async function requestTTS(scene, name, sceneVoice, sceneSpeed) {
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    await waitForRequestSlot();

    // Reserve the next request slot, including retries.
    nextRequestAt = Date.now() + REQUEST_GAP_MS;

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
          `Network error for ${name} after ${MAX_RETRIES} retries: ${error.message}`
        );
      }

      const delay = Math.min(120_000 * attempt, 360_000);
      nextRequestAt = Math.max(nextRequestAt, Date.now() + delay);

      console.warn(
        `Network error. Retry ${attempt}/${MAX_RETRIES} after ${Math.ceil(delay / 1000)}s`
      );
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

    let delay;

    if (res.status === 429) {
      // 120s, 180s, 240s, 300s, 360s.
      const progressiveDelay = 120_000 + (attempt - 1) * 60_000;
      const providerDelay = getRetryAfterMs(res);
      delay = Math.max(progressiveDelay, providerDelay);
    } else {
      delay = Math.min(60_000 * attempt, 300_000);
    }

    nextRequestAt = Math.max(nextRequestAt, Date.now() + delay);

    console.warn(
      `Paxa HTTP ${res.status}. Retry ${attempt}/${MAX_RETRIES} after ${Math.ceil(delay / 1000)}s`
    );

    if (body) console.warn(body);
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

  console.log(`tts   ${name}  voice=${sceneVoice}`);

  const audio = await requestTTS(
    scene,
    name,
    sceneVoice,
    sceneSpeed
  );

  writeFileSync(path, audio);

  hashes[name] = sig;
  writeFileSync(hashFile, JSON.stringify(hashes, null, 2));

  console.log(`saved ${name}`);
}

console.log("TTS done.");
