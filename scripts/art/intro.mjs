// Banner (840x320): house credits-card style. Header bar, dot grid, accent glow behind the character, frame + studs, a few fireflies, quiet text.
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import sharp from "sharp";
import { esc, THEMES, frame, fireflies, svgDoc, wrapText } from "../lib/svg.mjs";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const W = 840, H = 320, HEAD = 44, PAD = 40;
const bodyY = HEAD + 2, bodyH = H - 2 - bodyY;
const ART_H = 252, artW = Math.round((456 / 613) * ART_H), artY = H - 2 - ART_H, TX = PAD + artW + 48;
const SUB = { family: "Inter", weight: 400, size: 28 };

let artUri;
async function art() {
  if (!artUri) {
    const buf = await sharp(resolve(root, "assets/brand/creator.webp")).resize({ height: ART_H * 2 }).webp({ quality: 80 }).toBuffer();
    artUri = `data:image/webp;base64,${buf.toString("base64")}`;
  }
  return artUri;
}

export default async function intro(t) {
  const c = THEMES[t];
  const ff = fireflies({ count: 5, w: W - 8, h: bodyH, seed: 11, t, id: "in" });
  const defs = `${ff.defs}
<clipPath id="in-clip"><rect x="2" y="${bodyY}" width="${W - 4}" height="${bodyH}"/></clipPath>
<pattern id="in-dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.2" fill="${c.accent}" opacity=".22"/></pattern>
<radialGradient id="in-glowg" gradientUnits="userSpaceOnUse" cx="${PAD + artW / 2}" cy="${artY + ART_H / 2}" r="230"><stop offset="0" stop-color="${c.accent}" stop-opacity=".26"/><stop offset="1" stop-color="${c.accent}" stop-opacity="0"/></radialGradient>
<linearGradient id="in-fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".78" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<mask id="in-mask"><rect x="${PAD}" y="${artY}" width="${artW}" height="${ART_H}" fill="url(#in-fade)"/></mask>`;
  const sub = (await wrapText("I make small, fast web apps that run in your browser.", W - 2 - PAD - TX, SUB, 2))
    .map((l, i) => `<text x="${TX}" y="${226 + i * 36}" font-family="'Inter'" font-size="28" fill="${c.muted}">${esc(l)}</text>`).join("");
  const body =
    frame({ x: 2, y: 2, w: W - 4, h: H - 4, t }) +
    `<rect x="2" y="${HEAD}" width="${W - 4}" height="2" fill="${c.borderStrong}"/>` +
    `<rect x="26" y="${HEAD / 2 - 2}" width="6" height="6" fill="${c.borderStrong}"/><rect x="24" y="${HEAD / 2 - 4}" width="6" height="6" fill="${c.accent}"/>` +
    `<text x="42" y="${HEAD / 2 + 7}" font-family="'Space Grotesk'" font-weight="700" font-size="22" fill="${c.fg}">Vin’s Atelier</text>` +
    `<g clip-path="url(#in-clip)">` +
    `<rect x="2" y="${bodyY}" width="${W - 4}" height="${bodyH}" fill="url(#in-glowg)"/>` +
    `<rect x="2" y="${bodyY}" width="${W - 4}" height="${bodyH}" fill="url(#in-dots)"/>` +
    `<g transform="translate(4 ${bodyY})">${ff.body}</g>` +
    `<g mask="url(#in-mask)"><image href="${await art()}" x="${PAD}" y="${artY}" width="${artW}" height="${ART_H}"/></g>` +
    `</g>` +
    `<text x="${TX}" y="126" font-family="'Space Grotesk'" font-weight="700" font-size="60" fill="${c.fg}">Hi, I’m Vin</text>` +
    `<text x="${TX}" y="176" font-family="'Inter'" font-size="30" fill="${c.fg}">Software engineer in Singapore.</text>` +
    sub;
  return svgDoc({
    w: W, h: H, id: "in", title: "Hi, I’m Vin",
    desc: "Hi, I’m Vin, a software engineer in Singapore. I make small, fast web apps that run in your browser. Vin’s Atelier.",
    defs, css: ff.css, body,
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { sheet } = await import("../lib/preview.mjs");
  await sheet("intro", intro, { width: 840, vw: 1300 });
}
