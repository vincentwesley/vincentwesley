// Banner (840x280): flat surface, house frame (ring + studs), one soft glow behind the character, quiet text.
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import sharp from "sharp";
import { esc, THEMES, frame, fireflies, svgDoc, embedImage, wrapText } from "../lib/svg.mjs";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const W = 840, H = 280, ART_H = 240, PAD = 36;
const artW = Math.round((456 / 613) * ART_H), artY = H - 2 - ART_H, TX = PAD + artW + 44;
const SUB = { family: "Inter", weight: 400, size: 26 };

let artUri;
async function art() {
  if (!artUri) {
    const buf = await sharp(resolve(root, "assets/brand/creator.webp")).resize({ height: ART_H * 2 }).webp({ quality: 80 }).toBuffer();
    artUri = `data:image/webp;base64,${buf.toString("base64")}`;
  }
  return artUri;
}

export default async function intro(t) {
  const c = THEMES[t], bodyH = H - 4;
  const logoH = 36, logoW = Math.round((logoH * 1775.7) / 500.3);
  const logo = embedImage(resolve(root, `assets/brand/atelier-${t === "dark" ? "b" : "a"}.svg`), "image/svg+xml");
  const ff = fireflies({ count: 4, w: W - 8, h: bodyH, seed: 5, t, id: "in" });
  const defs = `${ff.defs}
<clipPath id="in-clip"><rect x="2" y="2" width="${W - 4}" height="${bodyH}"/></clipPath>
<radialGradient id="in-glowg" gradientUnits="userSpaceOnUse" cx="${PAD + artW / 2}" cy="${artY + ART_H / 2}" r="190"><stop offset="0" stop-color="${c.accent}" stop-opacity=".12"/><stop offset="1" stop-color="${c.accent}" stop-opacity="0"/></radialGradient>`;
  const sub = (await wrapText("I make small, fast web apps that run in your browser.", 430, SUB, 2))
    .map((l, i) => `<text x="${TX}" y="${190 + i * 34}" font-family="'Inter'" font-size="26" fill="${c.muted}">${esc(l)}</text>`).join("");
  const body =
    frame({ x: 2, y: 2, w: W - 4, h: H - 4, t, hairline: false }) +
    `<g clip-path="url(#in-clip)">` +
    `<rect x="2" y="2" width="${W - 4}" height="${bodyH}" fill="url(#in-glowg)"/>` +
    `<g transform="translate(4 2)">${ff.body}</g>` +
    `<image href="${await art()}" x="${PAD}" y="${artY}" width="${artW}" height="${ART_H}"/>` +
    `</g>` +
    `<text x="${TX}" y="96" font-family="'Space Grotesk'" font-weight="700" font-size="60" fill="${c.fg}">Hi, I’m Vin</text>` +
    `<text x="${TX}" y="144" font-family="'Inter'" font-size="28" fill="${c.fg}">Software engineer in Singapore.</text>` +
    sub +
    `<image href="${logo}" x="${W - 2 - PAD - logoW}" y="${H - 2 - PAD + 8 - logoH}" width="${logoW}" height="${logoH}"/>`;
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
