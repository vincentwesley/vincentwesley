// One-off: assets/avatar.png, 500x500, untouched mark-b centred on #11150e with a faint glow and fireflies.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { abs, browse } from "../lib/preview.mjs";

const S = 500, MW = 300, MH = Math.round((MW * 462.24) / 786.24);
const dots = [[96, 150, 2.2], [410, 120, 2], [150, 372, 1.8], [385, 345, 2.4], [330, 70, 1.6]]
  .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r * 3}" fill="#9dff6a" opacity=".12"/><circle cx="${x}" cy="${y}" r="${r}" fill="#eaffb0" opacity=".75"/>`).join("");
const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><defs><radialGradient id="g"><stop offset="0" stop-color="#4fe0a0" stop-opacity=".09"/><stop offset="1" stop-color="#4fe0a0" stop-opacity="0"/></radialGradient></defs><rect width="${S}" height="${S}" fill="#11150e"/><circle cx="250" cy="250" r="230" fill="url(#g)"/>${dots}</svg>`;

async function render() {
  const mark = await sharp(readFileSync(abs("assets/brand/mark-b.svg")), { density: 72 * (MW / 786.24) * 4 }).resize(MW, MH).png().toBuffer();
  return sharp(Buffer.from(bg)).composite([{ input: mark, left: (S - MW) / 2, top: Math.round((S - MH) / 2) }]).png({ compressionLevel: 9 }).toBuffer();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const png = await render();
  writeFileSync(abs("assets/avatar.png"), png);
  console.log("avatar.png", png.length);
  await browse(async (b) => {
    const p = await b.newPage({ viewport: { width: 540, height: 540 } });
    await p.setContent(`<body style="margin:20px;background:#0d1117"><img src="data:image/png;base64,${png.toString("base64")}" style="display:block;width:500px;border-radius:50%">`);
    await p.screenshot({ path: abs("qa-output/avatar-circle.png") });
  });
}
