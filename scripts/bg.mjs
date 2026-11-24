// Illustrated place backgrounds (flat vector, 1080x1920, ground starts ~y1350 so Oat can stand on it).
// scene.place: street | kitchen | forest | garden | bedroom | beach
const grad = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
const tree = (x, y, s = 1, c = "#2f855a") =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-16" y="-190" width="32" height="190" fill="#6b4423"/><circle cy="-250" r="100" fill="${c}"/><circle cx="-76" cy="-195" r="68" fill="${c}"/><circle cx="76" cy="-195" r="68" fill="${c}"/><circle cx="-30" cy="-285" r="40" fill="#fff" opacity=".1"/></g>`;
const pine = (x, y, s = 1, c = "#1f5f3f") =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-14" y="-60" width="28" height="60" fill="#5b3a21"/><polygon points="0,-400 -150,-40 150,-40" fill="${c}"/><polygon points="0,-400 -100,-150 100,-150" fill="#fff" opacity=".07"/></g>`;
const cloud = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".85"><ellipse rx="90" ry="34"/><ellipse cx="-50" cy="-14" rx="50" ry="34"/><ellipse cx="40" cy="-24" rx="56" ry="40"/></g>`;
const rock = (x, y, s = 1, c = "#8b929c") =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse rx="72" ry="46" fill="${c}"/><ellipse cx="-20" cy="-14" rx="34" ry="16" fill="#fff" opacity=".18"/></g>`;
const leaf = (x, y, r, c) => `<ellipse cx="${x}" cy="${y}" rx="18" ry="8" transform="rotate(${r} ${x} ${y})" fill="${c}"/>`;
const bld = (x, w, h, c) => {
  let s = `<rect x="${x}" y="${1350 - h}" width="${w}" height="${h}" fill="${c}"/>`;
  for (let y = 1350 - h + 36, r = 0; y < 1300; y += 74, r++)
    for (let xx = x + 22, k = 0; xx < x + w - 36; xx += 54, k++)
      s += `<rect x="${xx}" y="${y}" width="28" height="40" fill="${(r + k) % 3 ? "#fef3c7" : "#cfe3f5"}" opacity=".85"/>`;
  return s;
};
const planks = (y0, c, line) => {
  let s = `<rect y="${y0}" width="1080" height="${1920 - y0}" fill="${c}"/>`;
  for (let y = y0 + 80, r = 0; y < 1920; y += 80 + r * 6, r++) {
    s += `<rect y="${y}" width="1080" height="4" fill="${line}"/>`;
    for (let x = (r % 2) * 130 + 60; x < 1080; x += 260) s += `<rect x="${x}" y="${y - 80 - (r - 1) * 6 > y0 ? y - 80 - r * 6 + 6 : y0}" width="4" height="${80 + r * 6}" fill="${line}"/>`;
  }
  return s;
};

const SCENES = {
  street: () => `<defs>${grad("gA", [[0, "#7cc0ee"], [1, "#fde3b5"]])}</defs>
    <rect width="1080" height="1350" fill="url(#gA)"/><circle cx="820" cy="1130" r="130" fill="#fff3c4" opacity=".9"/>
    ${cloud(220, 330, 1.4)}${cloud(760, 520, 1.1)}${cloud(480, 150, 1)}
    ${bld(0, 200, 720, "#8aa0b8")}${bld(190, 170, 560, "#a3b4c8")}${bld(330, 230, 820, "#7b8fa8")}${bld(580, 190, 640, "#9fb0c4")}${bld(760, 160, 520, "#8aa0b8")}${bld(900, 200, 760, "#7b8fa8")}
    <rect y="1350" width="1080" height="115" fill="#cfd6df"/><rect y="1465" width="1080" height="455" fill="#4b5563"/><rect y="1465" width="1080" height="10" fill="#e5e7eb"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${i * 150 - 20}" y="1700" width="90" height="14" fill="#f8fafc"/>`).join("")}
    ${tree(110, 1420, 1.15)}${tree(985, 1420, 1.15, "#3f9b4a")}`,
  kitchen: () => `<defs>${grad("gB", [[0, "#8fd0ff"], [1, "#e6f6ff"]])}</defs>
    <rect width="1080" height="1300" fill="#f6e7d0"/><rect y="760" width="1080" height="14" fill="#e3cfae"/>
    <rect x="0" y="110" width="330" height="330" fill="#a9744a"/><rect x="164" y="110" width="4" height="330" fill="#7a4e2b"/><rect x="130" y="300" width="22" height="60" rx="8" fill="#e5d3a8"/><rect x="186" y="300" width="22" height="60" rx="8" fill="#e5d3a8"/>
    <rect x="620" y="260" width="380" height="460" fill="url(#gB)"/><circle cx="800" cy="600" r="70" fill="#5aa65f"/><circle cx="880" cy="640" r="60" fill="#4f9d5d"/><circle cx="880" cy="340" r="44" fill="#fff3c4"/>
    <rect x="620" y="260" width="380" height="460" fill="none" stroke="#8b5e34" stroke-width="22"/><rect x="805" y="260" width="12" height="460" fill="#8b5e34"/><rect x="620" y="480" width="380" height="12" fill="#8b5e34"/>
    <rect x="30" y="520" width="250" height="790" rx="16" fill="#e5e7eb"/><rect x="30" y="800" width="250" height="8" fill="#9ca3af"/><rect x="236" y="600" width="12" height="130" rx="6" fill="#6b7280"/><rect x="236" y="860" width="12" height="190" rx="6" fill="#6b7280"/>
    <rect x="320" y="1010" width="760" height="290" fill="#c08a5a"/><rect x="310" y="990" width="780" height="30" fill="#e8d5b0"/><rect x="540" y="1070" width="4" height="230" fill="#8b5e34"/><rect x="800" y="1070" width="4" height="230" fill="#8b5e34"/>
    <path d="M420 990 q70 70 140 0z" fill="#fff" stroke="#d1d5db" stroke-width="4"/><circle cx="460" cy="968" r="24" fill="#ef4444"/><circle cx="505" cy="962" r="24" fill="#fbbf24"/><circle cx="545" cy="970" r="22" fill="#f97316"/>
    ${planks(1300, "#b98a57", "#8d6439")}`,
  forest: () => `<defs>${grad("gC", [[0, "#dff3d3"], [1, "#8cc7a4"]])}</defs>
    <rect width="1080" height="1350" fill="url(#gC)"/><circle cx="260" cy="260" r="110" fill="#fffbe0" opacity=".7"/>
    ${[40, 220, 420, 640, 860, 1040].map((x, i) => pine(x, 1340, 0.9 + (i % 2) * 0.15, "#4a9a74")).join("")}
    ${pine(40, 1390, 1.5, "#1f5f3f")}${pine(980, 1380, 1.6, "#1f5f3f")}${pine(880, 1360, 1.05, "#2b7a52")}${pine(210, 1360, 1.05, "#2b7a52")}
    <rect y="1350" width="1080" height="570" fill="#5aa65f"/>
    <polygon points="250,1350 340,1350 600,1920 -140,1920" fill="#5db7ea"/>
    ${[[330, 1450, 400, 1560], [300, 1520, 330, 1640], [420, 1610, 500, 1760], [200, 1700, 260, 1840]].map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#fff" stroke-opacity=".55" stroke-width="7" stroke-linecap="round"/>`).join("")}
    ${rock(150, 1600, 1.3)}${rock(330, 1480, .7, "#7d848f")}${rock(980, 1720, 1.2)}${rock(850, 1540, .75, "#9aa1ab")}
    ${[700, 800, 950, 90, 620].map((x, i) => `<path d="M${x} ${1560 + i * 55} l8 -34 l8 34 l8 -34 l8 34" stroke="#2f7a3a" stroke-width="6" fill="none"/>`).join("")}`,
  garden: () => `<defs>${grad("gD", [[0, "#bde6ff"], [1, "#f1fbff"]])}</defs>
    <rect width="1080" height="1350" fill="url(#gD)"/>${cloud(260, 280, 1.3)}${cloud(780, 430, 1)}
    <rect x="600" y="880" width="420" height="470" fill="#f4cfa3"/><polygon points="570,880 810,690 1050,880" fill="#b4532a"/><rect x="760" y="1120" width="90" height="230" fill="#7c4a2a"/>
    <rect x="640" y="980" width="90" height="90" fill="#bfe3ff" stroke="#8b5e34" stroke-width="10"/><rect x="890" y="980" width="90" height="90" fill="#bfe3ff" stroke="#8b5e34" stroke-width="10"/>
    <rect y="1350" width="1080" height="570" fill="#6bbf59"/>
    <polygon points="470,1350 610,1350 920,1920 150,1920" fill="#8b5a3c"/><polygon points="510,1350 570,1350 700,1920 330,1920" fill="#a06b48" opacity=".6"/>
    ${tree(190, 1400, 1.9, "#3f9b4a")}${[[110, 1090], [250, 1050], [180, 1170], [300, 1150], [90, 1180]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20" fill="#f97316"/>`).join("")}
    ${[[420, 1500, 20, "#f59e0b"], [340, 1620, -30, "#ea580c"], [800, 1560, 40, "#fbbf24"], [920, 1700, 10, "#f97316"], [260, 1760, 60, "#84cc16"], [700, 1450, -15, "#f59e0b"]].map(([x, y, r, c]) => leaf(x, y, r, c)).join("")}
    ${rock(560, 1470, .35, "#c4b5a5")}${rock(640, 1600, .3, "#c4b5a5")}`,
  bedroom: () => `<defs>${grad("gE", [[0, "#1b2550"], [1, "#2e3a78"]])}${grad("gF", [[0, "#0b1235"], [1, "#1c2a63"]])}</defs>
    <rect width="1080" height="1300" fill="url(#gE)"/>
    <rect x="620" y="240" width="380" height="500" fill="url(#gF)"/><circle cx="800" cy="420" r="70" fill="#fff3c4"/><circle cx="830" cy="400" r="62" fill="#1c2a63" opacity=".55"/>
    ${[[680, 320], [940, 300], [700, 600], [930, 560], [860, 680]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff"/>`).join("")}
    <rect x="620" y="240" width="380" height="500" fill="none" stroke="#7a4a28" stroke-width="22"/><rect x="805" y="240" width="12" height="500" fill="#7a4a28"/>
    <rect x="-20" y="620" width="40" height="680" fill="#6a4325"/><rect x="-20" y="900" width="540" height="330" rx="20" fill="#7a4a28"/><rect x="0" y="830" width="500" height="130" rx="30" fill="#e5e7eb"/><rect x="0" y="930" width="500" height="150" rx="24" fill="#6d8bd6"/><ellipse cx="110" cy="840" rx="100" ry="38" fill="#fff"/>
    <rect x="940" y="1060" width="140" height="240" fill="#7a4a28"/><polygon points="960,980 1060,980 1040,1060 980,1060" fill="#fcd34d"/><circle cx="1000" cy="1020" r="150" fill="#fcd34d" opacity=".18"/>
    ${planks(1300, "#6a4325", "#4a2e18")}<ellipse cx="540" cy="1700" rx="380" ry="95" fill="#b04a4a" opacity=".85"/><ellipse cx="540" cy="1700" rx="300" ry="68" fill="none" stroke="#f3c6c6" stroke-width="6" opacity=".6"/>`,
  beach: () => `<defs>${grad("gG", [[0, "#5b6ee1"], [0.55, "#f472b6"], [1, "#fbbf77"]])}${grad("gH", [[0, "#2b6cb0"], [1, "#4a9fd8"]])}</defs>
    <rect width="1080" height="1300" fill="url(#gG)"/><circle cx="540" cy="1270" r="170" fill="#fff1b8"/>${cloud(240, 420, 1.2)}${cloud(850, 700, 1)}
    <path d="M150 520 q25 -26 50 0 q25 -26 50 0 M700 380 q22 -24 44 0 q22 -24 44 0" stroke="#312e81" stroke-width="6" fill="none" stroke-linecap="round"/>
    <rect y="1250" width="1080" height="260" fill="url(#gH)"/>${[1300, 1360, 1420].map((y, i) => `<path d="M${i * 90} ${y} q60 -22 120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0" stroke="#fff" stroke-opacity=".5" stroke-width="5" fill="none"/>`).join("")}
    <path d="M0 1500 Q270 1450 540 1495 T1080 1480 V1920 H0Z" fill="#f2d8a6"/><path d="M0 1500 Q270 1450 540 1495 T1080 1480" stroke="#fff" stroke-width="12" fill="none" opacity=".75"/>
    <path d="M900 1720 Q980 1460 890 1180" stroke="#8a5a35" stroke-width="36" fill="none" stroke-linecap="round"/>
    ${[-30, -75, -120, 20, 60].map((r) => `<ellipse cx="890" cy="1180" rx="170" ry="32" transform="rotate(${r} 890 1180) translate(120 0)" fill="#2f9e5b"/>`).join("")}
    ${rock(150, 1740, 1.1, "#9a8f84")}${rock(330, 1580, .55, "#a89d92")}<ellipse cx="640" cy="1850" rx="26" ry="16" fill="#fda4af"/>`,
};

export const bgSvg = (place = "street") =>
  `<svg class="bg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${(SCENES[place] ?? SCENES.street)()}</svg>`;
