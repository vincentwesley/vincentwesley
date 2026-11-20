// Two offset-shadow link buttons as standalone transparent SVGs.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { button, svgDoc, THEMES } from "../lib/svg.mjs";

const LABELS = { site: "vwesley.dev", health: "Project health" };
const PAD = 4;

export async function renderButtons(t) {
  const out = {};
  for (const [name, label] of Object.entries(LABELS)) {
    const b = await button(label, { x: PAD, y: PAD, t, size: 22 });
    out[name] = await svgDoc({
      w: b.w + PAD * 2, h: b.h + PAD * 2, id: `btn-${name}`, title: label,
      body: b.svg,
    });
  }
  return out;
}

const lum = (hex) => {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const contrast = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return (h + 0.05) / (l + 0.05); };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync("assets", { recursive: true });
  const names = [];
  for (const t of ["dark", "light"]) {
    for (const [n, svg] of Object.entries(await renderButtons(t))) {
      writeFileSync(`assets/btn-${n}-${t}.svg`, svg);
      names.push(`btn-${n}-${t}`);
      console.log(n, t, Buffer.byteLength(svg));
    }
    console.log(t, "contrast", contrast(THEMES[t].accentFg, THEMES[t].accent).toFixed(2));
  }
  const { shoot } = await import("../lib/preview.mjs");
  await shoot(names, 300);
}
