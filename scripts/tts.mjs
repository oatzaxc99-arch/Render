// Generate one MP3 per scene with Paxa Labs TTS (OpenAI-compatible endpoint).
// Needs env PAXA_API_KEY (starts with "pxa_"). Results are cached by content hash,
// so re-running only re-synthesizes scenes whose narration/voice/speed changed.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const cfg = JSON.parse(readFileSync("project.json", "utf8"));
const key = process.env.PAXA_API_KEY;
if (!key) {
  console.error("Missing PAXA_API_KEY (create one at https://paxalabs.com/app/keys)");
  process.exit(1);
}

const { baseUrl, model, voice, speed } = cfg.tts;
const outDir = "assets/audio";
mkdirSync(outDir, { recursive: true });

const hashFile = `${outDir}/.hashes.json`;
const hashes = existsSync(hashFile) ? JSON.parse(readFileSync(hashFile, "utf8")) : {};

for (const [i, scene] of cfg.scenes.entries()) {
  const name = `scene-${String(i + 1).padStart(2, "0")}.mp3`;
  const path = `${outDir}/${name}`;
  const sceneVoice = scene.voice ?? voice;
  const sceneSpeed = scene.speed ?? speed;
  const sig = createHash("sha256")
    .update(JSON.stringify([model, sceneVoice, sceneSpeed, scene.narration]))
    .digest("hex");

  if (existsSync(path) && hashes[name] === sig) {
    console.log(`skip  ${name} (unchanged)`);
    continue;
  }

  console.log(`tts   ${name}  voice=${sceneVoice}`);
  const res = await fetch(`${baseUrl}/audio/speech`, {
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

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Paxa TTS failed for ${name}: HTTP ${res.status}\n${body}`);
    process.exit(1);
  }

  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  hashes[name] = sig;
  writeFileSync(hashFile, JSON.stringify(hashes, null, 2));
}

console.log("TTS done.");
