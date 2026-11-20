// Animated studio header ("the atelier at night"). Static styles are the FINAL state;
// every entrance uses animation-fill-mode:both, so reduced-motion / Safari fallbacks look finished.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { THEMES, esc, frame, fireflies, svgDoc, embedImage } from "../lib/svg.mjs";
import { measure } from "../lib/fonts.mjs";

const W = 960, H = 400, X = 64;
const TITLE = "Vin’s Atelier", TAG = "A one-person software studio in Singapore.";
const PROMPT = "vin@sg:~$", CMD = "ls ~/atelier";
const OUT = "black-hole  sdf-forge  metalens-vgc  safe-regex  …";
const INK = { x: 10, y: 10, w: 940, h: 380 }; // inside the frame hairline
const r = (n) => Math.round(n * 100) / 100;

function rng(seed) { // mulberry32, deterministic
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const px = (x, y, w, h, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`;

const BASE = INK.y + INK.h;
const clearOfStud = (x) => x >= 16 && x + 8 <= W - 16; // bottom studs sit at x 4..16 and W-16..W-4

// far rolling hills: low-opacity stepped silhouette
function hills(c) {
  const out = [];
  for (let i = 0; i < INK.w / 8; i++) {
    if (!clearOfStud(INK.x + i * 8)) continue;
    const h = 28 + 4 * Math.round(4 + 3 * Math.sin(i / 11 + 0.5) + 1.5 * Math.sin(i / 4.3));
    out.push(px(INK.x + i * 8, BASE - h, 8, h, c.borderSoft));
  }
  return `<g opacity=".55">${out.join("")}</g>`;
}

// near grass + reeds, denser and taller; kept low under the terminal text (x < 690)
function grass(c) {
  const rnd = rng(11), out = [], blooms = [];
  const bloomCols = [c.accent, c.peach, c.lavender], cols = INK.w / 8;
  let bi = 0;
  for (let i = 0; i < cols; i++) {
    const x = INK.x + i * 8, low = x < 690;
    if (!clearOfStud(x)) continue;
    const h = 12 + 4 * Math.round(2 + 1.6 * Math.sin(i / 7) + 1.2 * Math.sin(i / 2.7 + 1) + rnd() * 1.6);
    out.push(px(x, BASE - h, 8, h, c.borderSoft));
    if (i % 3 !== 1) out.push(px(x, BASE - h, 8, 4, c.border, ' opacity=".4"'));
    for (const dx of [0, 4]) if (rnd() < 0.3) { // reed: 4px stalk with a bent tip
      const rh = 8 + 4 * Math.floor(rnd() * (low ? 4 : 8)), ry = BASE - h - rh, lean = rnd() < 0.5 ? -4 : 4;
      out.push(px(x + dx, ry, 4, rh, c.borderSoft), px(x + dx + lean, ry - 4, 4, 4, c.borderSoft));
      if (rnd() < 0.3) blooms.push(px(x + dx + lean, ry - 8, 4, 4, bloomCols[bi++ % 3]));
    }
  }
  [[218, 0], [402, 1], [610, 2], [700, 0], [912, 1]].forEach(([bx, k]) => blooms.push(px(bx, BASE - 24 - k * 4, 4, 4, bloomCols[k])));
  return out.join("") + blooms.join("");
}

// pixel studio cabin on a 4px grid (~1.25x the first cut). Returns {body, lit}: lit (windows + lantern glow) fades up on load.
function cabin(c0, dark) {
  const wall = dark ? "#28323b" : "#aebdb5", wallDk = dark ? "#1d252c" : "#93a69b";
  const warm = "#e9a07f", c = { ...c0, peach: warm }; // lit windows stay warm peach in both themes
  const body = [], lit = [];
  body.push(px(720, 300, 160, 76, wall), px(720, 372, 160, 4, wallDk), px(720, 300, 160, 4, wallDk)); // walls
  for (let i = 0; i < 9; i++) body.push(px(704 + 8 * i, 296 - 4 * i, 192 - 16 * i, 4, i % 3 === 0 ? c.borderStrong : c.border)); // pitched roof
  body.push(px(704, 296, 192, 4, c.borderStrong, ' opacity=".5"'));
  body.push(px(848, 264, 16, 32, wallDk), px(844, 260, 24, 4, c.border)); // chimney
  body.push(px(788, 332, 24, 44, wallDk), px(804, 352, 4, 4, c.peach)); // door
  const win = (x) => { lit.push(px(x, 324, 36, 32, c.peach), px(x + 16, 324, 4, 32, wall), px(x, 340, 36, 4, wall)); body.push(px(x - 4, 320, 44, 40, wallDk)); };
  win(732); win(832);
  const glow = (x, y, r, o) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.peach}" opacity="${o}" filter="url(#hd-glow)"/>`;
  const lantern = [px(891, 322, 2, 10, c.borderStrong), px(886, 332, 12, 16, c.firefly), px(888, 334, 8, 12, c.fireflyCore)];
  return {
    body: body.join(""),
    lit: glow(750, 340, 42, dark ? 0.5 : 0.35) + glow(850, 340, 42, dark ? 0.5 : 0.35) + lit.join("") +
      `<circle cx="892" cy="340" r="20" fill="${c.firefly}" opacity=".5" filter="url(#hd-glow)"/>` + lantern.join(""),
  };
}

function stars() {
  const rnd = rng(23), out = [];
  while (out.length < 13) {
    const x = Math.round(300 + rnd() * 640), y = Math.round(16 + rnd() * 150);
    if (Math.hypot(x - 866, y - 78) < 80) continue;
    out.push(px(x - (x % 2), y - (y % 2), 2, 2, "#8aa07a", ` opacity="${r(0.25 + rnd() * 0.3)}"`));
  }
  return out.join("");
}

function moon(c, t) {
  const cx = 866, cy = 78, s = 6, cells = [];
  for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) {
    if (Math.hypot(i, j) <= 5.4 && Math.hypot(i - 2.6, j + 1.6) > 4.5) cells.push(px(cx + i * s, cy + j * s, s, s, c.lavender));
  }
  return `<circle cx="${cx - 6}" cy="${cy + 6}" r="52" fill="${c.lavender}" opacity="${t === "dark" ? 0.22 : 0.16}" filter="url(#hd-moon)"/>${cells.join("")}`;
}

// firefly groups: [count, seed, id, region x,y,w,h]; fireflies() spawns in 8..w-8 so shift by (x,y)
const GROUPS = [
  [7, 5, "fa", 640, 24, 310, 200], // moon side
  [6, 9, "fb", 680, 200, 270, 130], // around the cabin
  [3, 14, "fc", 740, 296, 140, 50], // by the lit windows
];

export default async function header(t = "dark") {
  const c = THEMES[t], dark = t === "dark";
  const logo = embedImage(new URL(`../../assets/brand/name-${dark ? "b" : "a"}.svg`, import.meta.url), "image/svg+xml");

  const mono = { family: "JetBrains Mono", weight: 500, size: 22 };
  const promptW = await measure(PROMPT + " ", mono), cmdW = await measure(CMD, mono);
  const cmdX = r(X + promptW), caretX = r(cmdX + cmdW + 2);

  const defs = [`<linearGradient id="hd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.bg}"/><stop offset="1" stop-color="${c.surface}"/></linearGradient>`,
    `<filter id="hd-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="8"/></filter>`,
    `<filter id="hd-moon" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="14"/></filter>`,
    `<pattern id="hd-dots" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="${c.borderSoft}" opacity=".7"/></pattern>`,
    `<clipPath id="hd-clip"><rect x="${INK.x}" y="${INK.y}" width="${INK.w}" height="${INK.h}"/></clipPath>`,
    `<clipPath id="hd-type"><rect x="${cmdX}" y="250" width="${r(cmdW + 4)}" height="34"/></clipPath>`];

  let ffCss = "", ffBody = "", n = 0;
  for (const [count, seed, id, gx, gy, gw, gh] of GROUPS) {
    const f = fireflies({ count, w: gw, h: gh, seed, t, id });
    defs.push(f.defs); ffCss += f.css;
    f.body = f.body.replace(/r="([\d.]+)"( fill="[^"]+" opacity="\.55")/g, (_, v, rest) => `r="${r(v * 1.3)}"${rest}`); // bigger halos
    const parts = f.body.split(new RegExp(`(?=<g class="${id}\\d+">)`)).filter(Boolean);
    ffBody += `<g transform="translate(${gx} ${gy})">` + parts.map((p) => `<g class="fin" style="animation-delay:${r(3.1 + 0.15 * n++)}s">${p}</g>`).join("") + `</g>`;
  }

  const css = ffCss + `
.type{animation:hd-type 1.2s steps(12,end) .4s both}
@keyframes hd-type{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
.walk{animation:hd-walk 1.2s steps(12,end) .4s both}
@keyframes hd-walk{from{transform:translateX(${-r(cmdW)}px)}to{transform:translateX(0)}}
.caret{animation:hd-caret 1s steps(1,end) 1.6s infinite}
@keyframes hd-caret{0%,100%{opacity:1}50%{opacity:0}}
.out{animation:hd-in .5s ease-out 1.7s both}
.win{animation:hd-in .6s ease-out 2.3s both}
.fin{animation:hd-in .8s ease-out both}
@keyframes hd-in{from{opacity:0}to{opacity:1}}`;

  const cab = cabin(c, dark);
  const studs = [[4, 4], [W - 16, 4], [4, H - 16], [W - 16, H - 16]].map(([x, y]) => px(x, y, 12, 12, c.borderStrong)).join("");
  const body =
    px(0, 0, W, H, c.bg) +
    frame({ x: 4, y: 4, w: W - 8, h: H - 8, t }) +
    `<g clip-path="url(#hd-clip)">` +
    px(INK.x, INK.y, INK.w, INK.h, "url(#hd-sky)") + px(INK.x, INK.y, INK.w, INK.h, "url(#hd-dots)", ' opacity=".5"') +
    (dark ? stars() : "") + moon(c, t) + hills(c) + cab.body + grass(c) + `<g class="win">${cab.lit}</g>` + ffBody + `</g>` + studs +
    `<image href="${logo}" x="${X}" y="28" width="${r(110 * 987.98 / 470)}" height="110" preserveAspectRatio="xMinYMid meet"/>` +
    `<text x="${X}" y="190" font-family="'Space Grotesk'" font-weight="700" font-size="54" fill="${c.fg}">${esc(TITLE)}</text>` +
    `<text x="${X}" y="232" font-family="Inter" font-weight="400" font-size="28" fill="${c.muted}">${esc(TAG)}</text>` +
    `<text x="${X}" y="276" font-family="'JetBrains Mono'" font-weight="500" font-size="22" fill="${c.accent}">${esc(PROMPT)}</text>` +
    `<g clip-path="url(#hd-type)"><text class="type" x="${cmdX}" y="276" font-family="'JetBrains Mono'" font-weight="500" font-size="22" fill="${c.fg}">${esc(CMD)}</text></g>` +
    `<g class="walk"><rect class="caret" x="${caretX}" y="257" width="12" height="24" fill="${c.accent}"/></g>` +
    `<text class="out" x="${X}" y="312" font-family="'JetBrains Mono'" font-weight="500" font-size="20" fill="${c.peachText}">${esc(OUT)}</text>`;

  return svgDoc({ w: W, h: H, id: "hd", title: TITLE, desc: "A one-person software studio in Singapore, run by Vin. Night garden with fireflies and the Vin logo.", defs: defs.join(""), css, body });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync("assets", { recursive: true }); mkdirSync("qa-output", { recursive: true });
  for (const t of ["dark", "light"]) {
    const svg = await header(t);
    writeFileSync(`assets/header-${t}.svg`, svg);
    console.log(`header-${t}.svg`, Buffer.byteLength(svg), "bytes");
  }
  const cell = (t, bg) => `<div style="background:${bg};padding:16px"><img src="../assets/header-${t}.svg" width="960"><br><img src="../assets/header-${t}.svg" width="343"></div>`;
  writeFileSync("qa-output/header-preview.html", `<body style="margin:0">${cell("dark", "#0d1117")}${cell("light", "#ffffff")}`);
  const { chromium } = await import("playwright");
  const br = await chromium.launch();
  const page = await br.newPage({ viewport: { width: 992, height: 1000 } });
  const url = "file:///" + process.cwd().replace(/\\/g, "/") + "/qa-output/header-preview.html";
  const shot = async (name, el) => (el ? page.locator(el) : page).screenshot({ path: `qa-output/${name}.png` });
  await page.goto(url); await page.waitForTimeout(6500);
  await page.locator("div").nth(0).screenshot({ path: "qa-output/header-dark.png" });
  await page.locator("div").nth(1).screenshot({ path: "qa-output/header-light.png" });
  // Chromium doesn't propagate reducedMotion emulation into <img> SVG documents, so load the SVG top-level.
  const rp = await (await br.newContext({ viewport: { width: W, height: H }, reducedMotion: "reduce" })).newPage();
  await rp.goto(url.replace("qa-output/header-preview.html", "assets/header-dark.svg")); await rp.waitForTimeout(300);
  await rp.screenshot({ path: "qa-output/header-reduced.png" });
  await br.close();
}
