// Build index.html (a HyperFrames composition) from project.json + assets/audio/*.mp3.
// - Scene length follows the real narration length (ffprobe), so audio never drifts.
// - Fits the result to video.duration: if narration is too long it is gently
//   time-stretched (up to MAX_SPEEDUP); if too short the slack is spread as pauses.
// This script does NOT render anything.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { bgSvg } from "./bg.mjs";
import { oatSvg, oatTweens, OAT_CSS } from "./oat.mjs";

const cfg = JSON.parse(readFileSync("project.json", "utf8"));
const { width, height } = cfg.video;
const st = cfg.style;
const target = cfg.video.duration;

const LEAD = 0.25; // silence before narration starts inside a scene
const TAIL = 0.35; // base hold after narration ends
const FADE = 0.3; // cross-fade overlap between scenes
const MAX_SPEEDUP = 1.15; // never speed speech up more than this
const MAX_EXTRA_TAIL = 1.0; // max extra pause added per scene

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stripTags = (s) => s.replace(/\[[^\]]*\]\s*/g, "").trim();

function probe(file) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  const d = parseFloat(out.trim());
  if (!Number.isFinite(d)) throw new Error(`Cannot read duration of ${file}`);
  return d;
}

// 1) measure narration
const items = cfg.scenes.map((scene, i) => {
  const src = `assets/audio/scene-${String(i + 1).padStart(2, "0")}.mp3`;
  if (!existsSync(src)) throw new Error(`Missing ${src}. Run: npm run tts`);
  return { scene, src, audio: src, d: probe(src) };
});

// 2) fit to target length
const n = items.length;
const sumD = () => items.reduce((a, b) => a + b.d, 0);
// total = sum(LEAD + d + TAIL) - (n-1)*FADE
const baseTotal = () => sumD() + n * (LEAD + TAIL) - (n - 1) * FADE;

let report = `narration ${sumD().toFixed(1)}s, base timeline ${baseTotal().toFixed(1)}s`;
if (target && baseTotal() > target) {
  const need = baseTotal() - target;
  const factor = sumD() / (sumD() - need);
  if (factor > MAX_SPEEDUP) {
    throw new Error(
      `Narration too long: timeline ${baseTotal().toFixed(1)}s vs target ${target}s ` +
        `(would need ${factor.toFixed(2)}x speed-up, max ${MAX_SPEEDUP}x). Shorten the narration.`,
    );
  }
  mkdirSync("assets/audio/fit", { recursive: true });
  for (const it of items) {
    const dst = it.src.replace("assets/audio/", "assets/audio/fit/");
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-i", it.src,
      "-filter:a", `atempo=${factor.toFixed(4)}`, dst,
    ]);
    it.audio = dst;
    it.d = probe(dst);
  }
  report += `; sped up x${factor.toFixed(3)}`;
}

let extraTail = 0;
if (target && baseTotal() < target) {
  extraTail = Math.min(MAX_EXTRA_TAIL, (target - baseTotal()) / n);
  report += `; +${extraTail.toFixed(2)}s pause per scene`;
}

// 3) layout
let cursor = 0;
const scenes = items.map((it, i) => {
  const start = cursor;
  const len = LEAD + it.d + TAIL + extraTail;
  cursor = start + len - FADE;
  return { id: `s${i + 1}`, ...it, start, len, track: 1 + (i % 2) };
});
const naturalTotal = scenes.at(-1).start + scenes.at(-1).len;
if (target) scenes.at(-1).len += Math.max(0, target - naturalTotal); // hold last frame
const total = target ? target : +naturalTotal.toFixed(3);
report += `; total ${total}s`;

// 4) html
const dots = (active) =>
  `<div class="dots">${scenes
    .map((_, k) => `<i class="${k === active ? "on" : ""}"></i>`)
    .join("")}</div>`;

const sceneHtml = scenes
  .map(({ id, scene, start, len, track }, i) => {
    const accent = scene.accent ?? st.accent;
    const m = scene.meter;
    return `
    <section id="${id}" class="clip scene" data-start="${start.toFixed(3)}" data-duration="${len.toFixed(3)}" data-track-index="${track}"
      style="--accent:${accent};">
      ${bgSvg(scene.place)}<div class="scrim"></div>
      ${dots(i)}
      <div class="card">
        ${scene.icon ? `<div class="icon">${scene.icon}</div>` : ""}
        <h1 class="cap">${esc(scene.caption ?? stripTags(scene.narration))}</h1>
        ${scene.sub ? `<p class="sub">${esc(scene.sub)}</p>` : ""}
        ${
          m
            ? `<div class="meter"><div class="ml">${esc(m.label)}</div><div class="track"><div class="fill" style="background:${m.color}; width:${m.from}%"></div></div></div>`
            : ""
        }
        ${scene.badge ? `<div class="badge">${esc(scene.badge)}</div>` : ""}
      </div>
      ${oatSvg(scene, i)}
    </section>`;
  })
  .join("\n");

const audioHtml = scenes
  .map(
    ({ audio, d, start }, i) =>
      `    <audio id="audio-s${i + 1}" src="${audio}" data-start="${(start + LEAD).toFixed(3)}" data-duration="${d.toFixed(3)}" data-track-index="10" data-volume="1"></audio>`,
  )
  .join("\n");

const music =
  cfg.music && existsSync(cfg.music.file)
    ? `    <audio src="${cfg.music.file}" data-start="0" data-duration="${total}" data-track-index="11" data-volume="${cfg.music.volume ?? 0.15}"></audio>`
    : "";

const t3 = (x) => x.toFixed(3);
const tweens = scenes
  .map(({ id, scene, start, len, d }, i) => {
    const L = [];
    if (scene.icon)
      L.push(`    tl.from("#${id} .icon", { opacity: 0, scale: 0.4, duration: 0.6, ease: "back.out(2)" }, ${t3(start)});`);
    L.push(`    tl.from("#${id} .cap", { opacity: 0, y: 70, duration: 0.55, ease: "power3.out" }, ${t3(start + 0.1)});`);
    if (scene.sub)
      L.push(`    tl.from("#${id} .sub", { opacity: 0, y: 40, duration: 0.5, ease: "power2.out" }, ${t3(start + 0.35)});`);
    if (scene.meter)
      L.push(
        `    tl.from("#${id} .meter", { opacity: 0, y: 30, duration: 0.4 }, ${t3(start + 0.6)});`,
        `    tl.to("#${id} .fill", { width: "${scene.meter.to}%", duration: ${Math.max(1.2, d - 0.8).toFixed(2)}, ease: "power2.inOut" }, ${t3(start + 0.9)});`,
      );
    if (scene.badge)
      L.push(`    tl.from("#${id} .badge", { opacity: 0, scale: 0.6, duration: 0.5, ease: "back.out(2)" }, ${t3(start + LEAD + Math.max(0.8, d - 1.8))});`);
    // slow push-in keeps still frames alive
    L.push(`    tl.fromTo("#${id} .card", { scale: 1 }, { scale: 1.04, duration: ${len.toFixed(2)}, ease: "none" }, ${t3(start)});`);
    // keep the final scene on screen to the end (no fade-out)
    if (i < scenes.length - 1)
      L.push(`    tl.to("#${id} .card", { opacity: 0, duration: ${FADE}, ease: "power1.in" }, ${t3(start + len - FADE)});`);
    L.push(`    tl.fromTo("#${id} .bg", { scale: 1 }, { scale: 1.06, duration: ${len.toFixed(2)}, ease: "none" }, ${t3(start)});`);
    L.push(oatTweens({ id, scene, start, len, d, last: i === scenes.length - 1, LEAD, FADE }));
    return L.join("\n");
  })
  .join("\n");

const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=${width}, height=${height}" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;800&family=Sarabun:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${width}px; height: ${height}px; background: #000; overflow: hidden; }
    #stage { position: relative; width: ${width}px; height: ${height}px; font-family: ${st.font}; color: ${st.textColor}; }
    .scene { position: absolute; inset: 0; display: flex; align-items: flex-start; justify-content: center; background: #000; overflow: hidden; }
    .bg { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
    .scrim { position: absolute; inset: 0; z-index: 1; background: linear-gradient(180deg, rgba(8,12,30,.62) 0%, rgba(8,12,30,.40) 40%, rgba(8,12,30,0) 66%); }
    .dots { z-index: 3; position: absolute; top: 120px; left: 0; right: 0; display: flex; gap: 18px; justify-content: center; }
    .dots i { width: 18px; height: 18px; border-radius: 50%; background: rgba(255,255,255,.28); }
    .dots i.on { background: var(--accent); width: 54px; border-radius: 9px; }
    .card { position: relative; z-index: 2; width: 90%; margin-top: 230px; text-align: center; }
    .icon { font-size: 220px; line-height: 1.15; margin-bottom: 24px; }
    .cap { white-space: pre-line; font-size: 120px; line-height: 1.35; font-weight: 800; text-shadow: 0 6px 30px rgba(0,0,0,.45); }
    .sub { display: inline-block; padding: 6px 38px; border-radius: 999px; background: rgba(8,12,30,.66); margin-top: 44px; font-size: 58px; line-height: 1.5; font-weight: 500; color: var(--accent); }
    .meter { margin: 72px auto 0; width: 84%; text-align: left; }
    .ml { font-size: 48px; margin-bottom: 16px; opacity: .9; }
    .track { height: 44px; border-radius: 22px; background: rgba(255,255,255,.16); overflow: hidden; }
    .fill { height: 100%; border-radius: 22px; }
    ${OAT_CSS}
    .badge { display: inline-block; margin-top: 64px; padding: 24px 60px; border-radius: 999px; background: var(--accent); color: #0b1220; font-size: 64px; font-weight: 800; }
  </style>
</head>
<body>
  <div id="stage" data-composition-id="main" data-start="0" data-width="${width}" data-height="${height}" data-duration="${total}">
${sceneHtml}

${audioHtml}
${music}

    <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
    <script>
    const tl = gsap.timeline({ paused: true });
${tweens}
    window.__timelines = window.__timelines || {};
    window.__timelines["main"] = tl;
    </script>
  </div>
</body>
</html>
`;

writeFileSync("index.html", html);
console.log(`index.html written: ${scenes.length} scenes | ${report}`);
