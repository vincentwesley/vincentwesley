// "Tools I reach for" chip grid. Every chip is evidenced in a public repo (qa-output/stack-evidence.md).
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chip, esc, frame, svgDoc, THEMES } from "../lib/svg.mjs";
import { STACK_ROWS as ROWS } from "../projects.mjs";

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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync("assets", { recursive: true });
  const names = [];
  for (const t of ["dark", "light"]) {
    const svg = await render(t);
    writeFileSync(`assets/stack-${t}.svg`, svg); names.push(`stack-${t}`);
    console.log(t, Buffer.byteLength(svg));
  }
  const { shoot } = await import("../lib/preview.mjs");
  await shoot(names);
}
