// Generate one MP3 per scene with ElevenLabs TTS (multilingual, supports Thai).
// Needs env ELEVENLABS_API_KEY.
// Results are cached by content hash — re-running only re-synthesises scenes
// whose narration, voice_id, or model changed.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const cfg = JSON.parse(readFileSync("project.json", "utf8"));
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("Missing ELEVENLABS_API_KEY (create one at https://elevenlabs.io/app/settings/api-keys)");
  process.exit(1);
}

const { voiceId, modelId, stability, similarityBoost } = cfg.tts;
const outDir = "assets/audio";
mkdirSync(outDir, { recursive: true });

const hashFile = `${outDir}/.hashes.json`;
const hashes = existsSync(hashFile)
  ? JSON.parse(readFileSync(hashFile, "utf8"))
  : {};

for (const [i, scene] of cfg.scenes.entries()) {
  const name = `scene-${String(i + 1).padStart(2, "0")}.mp3`;
  const path = `${outDir}/${name}`;

  const sceneVoiceId = scene.voiceId ?? voiceId;
  const sceneModel   = scene.modelId ?? modelId;
  // Send narration as-is — ElevenLabs reads [cheerful], [short pause], [sighs] etc.
  // as emotion/prosody hints natively. Keep them in the text.
  const text = scene.narration.trim();

  const sig = createHash("sha256")
    .update(JSON.stringify([sceneVoiceId, sceneModel, text]))
    .digest("hex");

  if (existsSync(path) && hashes[name] === sig) {
    console.log(`skip  ${name} (unchanged)`);
    continue;
  }

  console.log(`tts   ${name}  voice=${sceneVoiceId}  model=${sceneModel}`);

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${sceneVoiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: sceneModel,
        voice_settings: {
          stability:        stability        ?? 0.5,
          similarity_boost: similarityBoost  ?? 0.75,
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`ElevenLabs TTS failed for ${name}: HTTP ${res.status}\n${body}`);
    process.exit(1);
  }

  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  hashes[name] = sig;
  writeFileSync(hashFile, JSON.stringify(hashes, null, 2));
}

console.log("TTS done.");
