// "Oat" (โอ๊ต): original cartoon host drawn as inline SVG, one pose per scene.
// Scene fields used: pose (wave|point|pointL|think|open|cta). All motion is GSAP (seekable).
const SHOULDER = { L: [135, 335], R: [265, 335] };
const POSES = {
  wave:   { L: [112, 415, 118, 478], R: [338, 318, 352, 222], wave: "R", eyes: "happy", brow: 5 },
  point:  { L: [108, 415, 150, 452], R: [348, 295, 338, 200], wave: "R", eyes: "open", brow: 6 },
  pointL: { L: [52, 295, 62, 200], R: [385, 415, 372, 452], wave: "L", eyes: "open", brow: 6 },
  think:  { L: [112, 415, 118, 478], R: [305, 405, 226, 296], wave: null, eyes: "open", brow: 3 },
  open:   { L: [72, 405, 30, 372], R: [328, 405, 370, 372], wave: "R", eyes: "happy", brow: 5 },
  cta:    { L: [62, 305, 48, 205], R: [335, 428, 322, 498], wave: "L", eyes: "happy", brow: 5 },
};
const INK = "#1f2937", SKIN = "#f6c9a0", HAIR = "#2b2118";

// upper arm = sleeve (shirt colour), forearm + hand = skin
const arm = (side, [ex, ey, hx, hy]) => {
  const [sx, sy] = SHOULDER[side];
  return `<g class="arm${side}"><path d="M${sx} ${sy} L${ex} ${ey}" stroke-width="40" stroke-linecap="round" fill="none" style="stroke:var(--accent)"/><path d="M${ex} ${ey} L${hx} ${hy}" stroke-width="28" stroke-linecap="round" fill="none" stroke="${SKIN}"/><circle cx="${hx}" cy="${hy}" r="21" fill="${SKIN}"/></g>`;
};

export const OAT_CSS = `.host { position: absolute; z-index: 2; left: 50%; margin-left: -260px; bottom: 200px; width: 520px; height: 689px; }
    .tagwrap { position: absolute; z-index: 3; left: 0; right: 0; bottom: 120px; text-align: center; }
    .tag { display: inline-block; padding: 10px 38px; border-radius: 999px; background: rgba(15,23,42,.72); font-size: 44px; font-weight: 700; }`;

export function oatSvg(scene, i) {
  const p = POSES[scene.pose ?? "wave"];
  const eyes =
    p.eyes === "happy"
      ? `<path d="M141 190 Q160 162 179 190 M221 190 Q240 162 259 190" stroke="${INK}" stroke-width="9" stroke-linecap="round" fill="none"/>`
      : `<ellipse cx="160" cy="184" rx="17" ry="21" fill="#fff"/><ellipse cx="240" cy="184" rx="17" ry="21" fill="#fff"/><circle cx="162" cy="186" r="10" fill="${INK}"/><circle cx="242" cy="186" r="10" fill="${INK}"/><circle cx="166" cy="180" r="3.5" fill="#fff"/><circle cx="246" cy="180" r="3.5" fill="#fff"/>`;
  const svg = `<svg class="host" viewBox="0 0 400 530" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="200" cy="516" rx="120" ry="12" fill="#000" opacity=".28"/>
    <g class="oat">
    <rect x="150" y="430" width="42" height="80" rx="16" fill="#334155"/><rect x="208" y="430" width="42" height="80" rx="16" fill="#334155"/>
    <ellipse cx="168" cy="512" rx="32" ry="14" fill="#111827"/><ellipse cx="232" cy="512" rx="32" ry="14" fill="#111827"/>
    <rect x="116" y="296" width="168" height="160" rx="54" style="fill:var(--accent)"/>
    <rect x="178" y="250" width="44" height="56" fill="${SKIN}"/><path d="M168 298 L200 342 L232 298 Z" fill="#fff" opacity=".92"/>
    <circle cx="102" cy="188" r="17" fill="${SKIN}"/><circle cx="298" cy="188" r="17" fill="${SKIN}"/>
    <circle cx="200" cy="172" r="98" fill="${SKIN}"/>
    <path d="M96 170 Q90 60 200 56 Q310 60 304 170 Q284 106 236 98 Q196 132 152 102 Q112 120 96 170Z" fill="${HAIR}"/>
    <g class="eyes">${eyes}</g>
    <path d="M136 ${152 - p.brow} L184 146 M216 146 L264 ${152 - p.brow}" stroke="${HAIR}" stroke-width="10" stroke-linecap="round"/>
    <path d="M195 208 Q200 216 205 208" stroke="#d99a6c" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="126" cy="222" r="15" fill="#f9a8a8" opacity=".55"/><circle cx="274" cy="222" r="15" fill="#f9a8a8" opacity=".55"/>
    <path class="mouth" d="M166 228 Q200 272 234 228 Z" fill="#7f1d1d"/>
    ${arm("L", p.L)}${arm("R", p.R)}
  </g></svg>`;
  return svg + (i === 0 ? `<div class="tagwrap"><span class="tag">โอ๊ต · พิธีกร</span></div>` : "");
}

export function oatTweens({ id, scene, start, len, d, last, LEAD, FADE }) {
  const p = POSES[scene.pose ?? "wave"];
  const t = (x) => x.toFixed(3);
  const L = [
    `    tl.from("#${id} .host", { y: 300, opacity: 0, duration: 0.6, ease: "back.out(1.6)" }, ${t(start)});`,
    `    tl.to("#${id} .oat", { y: -10, duration: 0.6, yoyo: true, repeat: ${Math.max(1, Math.floor(len / 0.6) - 1)}, ease: "sine.inOut" }, ${t(start + 0.6)});`,
    // lip-flap while the narration plays
    `    tl.to("#${id} .mouth", { scaleY: 0.25, svgOrigin: "200 228", duration: 0.13, yoyo: true, repeat: ${Math.max(1, Math.floor(d / 0.13) - 1)}, ease: "none" }, ${t(start + LEAD)});`,
    // blink
    `    tl.to("#${id} .eyes", { scaleY: 0.1, svgOrigin: "200 184", duration: 0.07, yoyo: true, repeat: ${Math.max(1, Math.floor(len / 2.4) * 2 - 1)}, repeatDelay: 2.3 }, ${t(start + 1.2)});`,
  ];
  if (p.wave) {
    const [sx, sy] = SHOULDER[p.wave];
    const big = scene.pose === "wave" || scene.pose === "cta";
    L.push(
      `    tl.fromTo("#${id} .arm${p.wave}", { rotation: ${big ? -16 : -5} }, { rotation: ${big ? 14 : 5}, svgOrigin: "${sx} ${sy}", duration: ${big ? 0.35 : 0.7}, yoyo: true, repeat: ${Math.max(1, Math.floor(len / (big ? 0.35 : 0.7)) - 1)}, ease: "sine.inOut" }, ${t(start + 0.5)});`,
    );
  }
  if (!last)
    L.push(`    tl.to("#${id} .host", { opacity: 0, duration: ${FADE}, ease: "power1.in" }, ${t(start + len - FADE)});`);
  return L.join("\n");
}
