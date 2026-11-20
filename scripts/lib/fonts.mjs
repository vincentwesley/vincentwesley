// Pinned font instances (one per family+weight) for harfbuzz measuring and glyph outlining.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";
import * as hb from "harfbuzzjs"; // transitive dep of subset-font (hoisted)

const dir = fileURLToPath(new URL("../fonts/", import.meta.url));
export const FONTS = {
  "Space Grotesk": { file: "space-grotesk-latin-wght-normal.woff2", weights: [700] },
  Inter: { file: "inter-latin-wght-normal.woff2", weights: [400, 600] },
  Silkscreen: { file: "silkscreen-latin-400-normal.woff2", weights: [400] }, // static font
  "JetBrains Mono": { file: "jetbrains-mono-latin-wght-normal.woff2", weights: [500] },
};

const srcCache = new Map();
const src = async (family) => {
  if (!FONTS[family]) throw new Error(`unknown font family ${family}`);
  if (!srcCache.has(family)) srcCache.set(family, readFile(dir + FONTS[family].file));
  return srcCache.get(family);
};

// --- text measurement via harfbuzz on the real pinned instance (exact advance widths) ---
let hbFonts = new Map();
async function hbFont(family, weight) {
  const key = family + weight;
  if (!hbFonts.has(key)) {
    // Full-glyph instance (not subset) so any string can be measured.
    const opts = { targetFormat: "truetype", keepAllGlyphs: true };
    if (family !== "Silkscreen") opts.variationAxes = { wght: weight };
    const sfnt = await subsetFont(await src(family), undefined, opts);
    const font = new hb.Font(new hb.Face(new hb.Blob(sfnt)));
    hbFonts.set(key, font);
  }
  return hbFonts.get(key);
}

/** Shape `text` on the pinned instance -> {upem, glyphs: [{gid, adv}], path(gid)} (font units). */
export async function shape(text, { family, weight = 400 }) {
  const font = await hbFont(family, weight);
  const buf = new hb.Buffer();
  buf.addText(text);
  buf.guessSegmentProperties();
  hb.shape(font, buf);
  const pos = buf.getGlyphPositions();
  const glyphs = buf.getGlyphInfos().map((g, i) => ({ gid: g.codepoint, adv: pos[i].xAdvance }));
  buf.destroy?.();
  return { upem: font.face.upem, glyphs, path: (gid) => font.glyphToPath(gid) };
}

/** Width in px of `text` at `size` px (plus optional letterSpacing px per glyph). */
export async function measure(text, { family, weight = 400, size, letterSpacing = 0 }) {
  const { upem, glyphs } = await shape(text, { family, weight });
  return (glyphs.reduce((s, g) => s + g.adv, 0) / upem) * size + letterSpacing * [...text].length;
}
