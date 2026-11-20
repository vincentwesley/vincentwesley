// "Tools I reach for" chip grid. Every chip is evidenced in a public repo (qa-output/stack-evidence.md).
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { chip, esc, frame, svgDoc, THEMES } from "../lib/svg.mjs";


export const ROWS = [
  ["Languages", ["TypeScript", "JavaScript", "Python", "GLSL", "SQL"]],
  ["In the browser", ["WebGL2", "Three.js", "Web Audio", "Web Workers", "Chrome extensions (MV3)"]],
  ["Ship and run", ["Cloudflare Workers", "D1", "Vite", "GitHub Actions", "Playwright"]],
];
const W = 840, PAD = 32, LABEL = 30, SIZE = 24, GAP = 10, ROWGAP = 24; // 840 wide: text stays legible at phone width

const render = async function (t) {
  const c = THEMES[t];
  let y = 8 + 36, body = "";
  for (const [label, chips] of ROWS) {
    body += `<text x="${PAD}" y="${y + LABEL * 0.75}" font-family="'Space Grotesk'" font-weight="700" font-size="${LABEL}" fill="${c.fg}">${esc(label)}</text>`;
    y += LABEL + 14;
    let x = PAD, rowH = 0;
    for (const [i, name] of chips.entries()) {
      let k = await chip(name, { x, y, t, size: SIZE, color: i === 0 ? c.accent : undefined });
      if (x + k.w > W - PAD) { x = PAD; y += k.h + GAP; k = await chip(name, { x, y, t, size: SIZE }); }
      body += k.svg; x += k.w + GAP; rowH = k.h;
    }
    y += rowH + ROWGAP;
  }
  const H = y - ROWGAP + 36 + 8;
  const all = ROWS.flatMap(([l, cs]) => cs);
  return svgDoc({
    w: W, h: H, id: "stack", title: "Tools I reach for", desc: `Tools I reach for: ${all.join(", ")}.`,
    body: `<rect width="${W}" height="${H}" fill="${c.bg}"/>` + frame({ x: 8, y: 8, w: W - 16, h: H - 16, t }) + body,
  });
};
export default render;

/** Headless screenshots of assets/<name>.svg via <img> on #0d1117 (…-dark) or #ffffff (…-light) -> qa-output/<name>.png */
export async function shoot(names, width = 960) {
  mkdirSync("qa-output", { recursive: true });
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: width + 40, height: 400 } });
  for (const n of names) {
    const bg = n.endsWith("dark") ? "#0d1117" : "#ffffff";
    const svg = "data:image/svg+xml;base64," + (await import("node:fs")).readFileSync(`assets/${n}.svg`).toString("base64");
    await p.setContent(`<body style="margin:20px;background:${bg}"><img src="${svg}" style="display:block;width:${width}px">`);
    await p.waitForTimeout(200);
    await p.screenshot({ path: `qa-output/${n}.png`, fullPage: true });
  }
  await b.close();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync("assets", { recursive: true });
  const names = [];
  for (const t of ["dark", "light"]) {
    const svg = await render(t);
    writeFileSync(`assets/stack-${t}.svg`, svg); names.push(`stack-${t}`);
    console.log(t, Buffer.byteLength(svg));
  }
  await shoot(names);
}
