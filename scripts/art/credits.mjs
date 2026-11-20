// Credits card as SVG: mirrors _house/credits (header bar, glow + dot grid, art left, text right).
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import sharp from "sharp";
import { esc, THEMES, frame, fireflies, svgDoc, embedImage } from "../lib/svg.mjs";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const W = 960, H = 340, HEAD = 44;
const COPY = "Copyright 2026 Vin\u2019s Atelier. Designed and built by Vin.";
const CREDIT = "Logo by @portus_workstation / @wason25_pz";
const ART_H = 262;

let artUri;
async function art() {
  if (!artUri) {
    const buf = await sharp(resolve(root, "assets/brand/creator.webp")).resize({ height: ART_H * 2 }).webp({ quality: 80 }).toBuffer();
    artUri = `data:image/webp;base64,${buf.toString("base64")}`;
  }
  return artUri;
}

export default async function art_(t) {
  const c = THEMES[t], bodyY = HEAD + 2, bodyH = H - 2 - bodyY;
  const artW = Math.round((456 / 613) * ART_H), artX = 44, artY = H - 2 - ART_H;
  const tx = 300;
  const logoH = 64, logoW = Math.round((logoH * 1775.7) / 500.3);
  const logo = embedImage(resolve(root, `assets/brand/atelier-${t === "dark" ? "b" : "a"}.svg`), "image/svg+xml");
  const ff = fireflies({ count: 14, w: W - 8, h: bodyH, seed: 7, t, id: "cf" });
  const css = `.nm{animation:cf-glow 3.6s ease-in-out infinite alternate}@keyframes cf-glow{from{opacity:.35}to{opacity:1}}` + ff.css;
  const defs = `${ff.defs}
<clipPath id="cf-clip"><rect x="2" y="${bodyY}" width="${W - 4}" height="${bodyH}"/></clipPath>
<pattern id="cf-dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.2" fill="${c.accent}" opacity=".22"/></pattern>
<radialGradient id="cf-glowg" cx="18%" cy="55%" r="45%"><stop offset="0" stop-color="${c.accent}" stop-opacity=".28"/><stop offset="1" stop-color="${c.accent}" stop-opacity="0"/></radialGradient>
<linearGradient id="cf-fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".72" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<mask id="cf-mask"><rect x="${artX}" y="${artY}" width="${artW}" height="${ART_H}" fill="url(#cf-fade)"/></mask>
<filter id="cf-art" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="9" flood-color="${c.accent}" flood-opacity=".45"/></filter>
<filter id="cf-nm" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>`;
  const line = (y, s, fill) => `<text x="${tx}" y="${y}" font-family="'Inter'" font-size="22" fill="${fill}">${esc(s)}</text>`;
  const name = `font-family="'Space Grotesk'" font-weight="700" font-size="56" fill="${c.accent}"`;
  const body =
    frame({ x: 2, y: 2, w: W - 4, h: H - 4, t }) +
    `<rect x="2" y="${HEAD}" width="${W - 4}" height="2" fill="${c.borderStrong}"/>` +
    `<rect x="26" y="${HEAD / 2 - 2}" width="6" height="6" fill="${c.borderStrong}"/><rect x="24" y="${HEAD / 2 - 4}" width="6" height="6" fill="${c.accent}"/>` +
    `<text x="42" y="${HEAD / 2 + 6}" font-family="'Space Grotesk'" font-weight="700" font-size="18" fill="${c.fg}">CREDITS</text>` +
    `<g clip-path="url(#cf-clip)">` +
    `<rect x="2" y="${bodyY}" width="${W - 4}" height="${bodyH}" fill="url(#cf-glowg)"/>` +
    `<rect x="2" y="${bodyY}" width="${W - 4}" height="${bodyH}" fill="url(#cf-dots)"/>` +
    `<g transform="translate(4 ${bodyY})">${ff.body}</g>` +
    `<g filter="url(#cf-art)" mask="url(#cf-mask)"><image href="${await art()}" x="${artX}" y="${artY}" width="${artW}" height="${ART_H}"/></g>` +
    `</g>` +
    `<text x="${tx}" y="94" font-family="'Silkscreen'" font-size="18" letter-spacing="1.4" fill="${c.muted}">MADE BY</text>` +
    `<text class="nm" x="${tx}" y="148" ${name} filter="url(#cf-nm)">Vin</text>` +
    `<text x="${tx}" y="148" ${name}>Vin</text>` +
    `<image href="${logo}" x="${tx}" y="174" width="${logoW}" height="${logoH}"/>` +
    line(284, COPY, c.fg) + line(318, CREDIT, c.muted);
  return svgDoc({
    w: W, h: H, id: "cr", title: "Credits",
    desc: "Made by Vin, Vin\u2019s Atelier. Logo by Portus Workstation (@portus_workstation, @wason25_pz).",
    defs, css, body,
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const name = "credits", gen = art_;
  const { chromium } = await import("playwright");
  const qa = resolve(root, "qa-output");
  mkdirSync(qa, { recursive: true }); mkdirSync(resolve(root, "assets"), { recursive: true });
  for (const t of ["dark", "light"]) {
    const s = await gen(t);
    writeFileSync(resolve(root, `assets/${name}-${t}.svg`), s);
    console.log(`${name}-${t}.svg ${Buffer.byteLength(s)} bytes`);
  }
  writeFileSync(resolve(qa, `${name}-preview.html`),
    `<!doctype html><meta charset="utf-8"><body style="margin:0"><div style="background:#0d1117;padding:24px"><img src="../assets/${name}-dark.svg" style="width:960px"> <img src="../assets/${name}-dark.svg" style="width:343px"></div><div style="background:#fff;padding:24px"><img src="../assets/${name}-light.svg" style="width:960px"> <img src="../assets/${name}-light.svg" style="width:343px"></div>`);
  const b = await chromium.launch();
  for (const [label, reducedMotion] of [["default", "no-preference"], ["reduced", "reduce"]]) {
    const p = await (await b.newContext({ viewport: { width: 1400, height: 800 }, reducedMotion })).newPage();
    await p.goto("file:///" + resolve(qa, `${name}-preview.html`).replace(/\\/g, "/"));
    await p.waitForTimeout(1500);
    await p.screenshot({ path: resolve(qa, `${name}-${label}.png`), fullPage: true });
  }
  await b.close();
}
