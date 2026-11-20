// 1280x640 social-preview PNGs for the pinned repos. Run: node scripts/art/social.mjs [repo...]
// Writes assets/social/<repo>.png (GitHub has no API for these; they are uploaded by hand).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { chromium } from "playwright";
import { THEMES, esc, frame, fireflies, chip, svgDoc, embedImage } from "../lib/svg.mjs";
import { measure } from "../lib/fonts.mjs";
import { wrapText } from "./cards.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const W = 1280, H = 640, c = THEMES.dark;
const COLX = 64, COLW = 480, FX = 584, FY = 128, FW = 664, FH = 384; // shot frame
const SHOT = (r) => `${root}qa-output/${r}.webp`;

const REPOS = {
  "black-hole": { title: "Black Hole", line: "A black hole you can fly around in the browser. Every pixel is a traced ray of light.", chips: ["WebGL2", "GLSL", "Ray tracing"], shot: `${root}assets/shots/black-hole.webp` },
  "sdf-forge": { title: "SDF Forge", line: "Build 3D shapes in the browser by connecting nodes, then 3D-print them.", chips: ["React", "WebGL", "3D printing"], shot: `${root}assets/shots/sdf-forge.webp` },
  MetaLensVGC: { title: "MetaLens VGC", line: "A metagame dashboard for Pokémon Champions VGC, built from real tournament data.", chips: ["Dashboard", "Cross-filter", "VGC 2026"], shot: "C:/Coding Projects/portfolio/src/assets/work/metalens-vgc-cover.webp", note: "Fan project, not affiliated with Nintendo, Game Freak or The Pokémon Company." },
  "safe-regex": { title: "safe-regex", line: "A JavaScript-compatible regex engine that runs in linear time, so ReDoS can't happen.", chips: ["TypeScript", "Zero deps", "Linear time"], shot: `${root}assets/shots/safe-regex.webp` },
  "glass-compiler": { title: "Glass Compiler", line: "A compiler you can see through: tokens, syntax tree, bytecode and a stepping VM, all linked.", chips: ["Compiler", "VM", "TypeScript"], shot: SHOT("glass-compiler") },
  "sg-time-machine": { title: "SG Time Machine", line: "A growing archive of Singapore's live open-data feeds, browsable on a time-slider map.", chips: ["Open data", "MapLibre", "Singapore"], shot: SHOT("sg-time-machine") },
};

const rect = (x, y, w, h, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`;
const logo = embedImage(`${root}assets/brand/mark-b.svg`, "image/svg+xml");

async function render(repo, d) {
  const T = { family: "Space Grotesk", weight: 700 };
  let ts = 64;
  while ((await measure(d.title, { ...T, size: ts })) > COLW) ts -= 2;
  const lines = await wrapText(d.line, COLW, { family: "Inter", weight: 400, size: 30 }, 3);
  const noteLines = d.note ? await wrapText(d.note, COLW, { family: "Inter", weight: 400, size: 18 }, 2) : [];
  const ff = fireflies({ count: 14, w: W, h: H, seed: repo.length * 7 + 3, id: "ff" });

  const titleY = 150, lineY0 = titleY + 56, lineStep = 40;
  const chipY = lineY0 + (lines.length - 1) * lineStep + 40;
  let cx = 0, chipSvg = "";
  for (const label of d.chips) {
    const ch = await chip(label, { x: COLX + cx, y: chipY, size: 16 });
    chipSvg += ch.svg; cx += ch.w + 10;
  }
  const noteY = chipY + 30 + 36;
  const defs =
    `<linearGradient id="so-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.bg}"/><stop offset="1" stop-color="${c.surface}"/></linearGradient>` +
    `<pattern id="so-dots" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="${c.borderSoft}" opacity=".7"/></pattern>` +
    `<clipPath id="so-img"><rect x="${FX + 6}" y="${FY + 6}" width="${FW - 12}" height="${FH - 12}"/></clipPath>` + ff.defs;
  const css = ff.css;
  const body =
    rect(0, 0, W, H, c.bg) + frame({ x: 4, y: 4, w: W - 8, h: H - 8 }) +
    rect(10, 10, W - 20, H - 20, "url(#so-sky)") + rect(10, 10, W - 20, H - 20, "url(#so-dots)", ' opacity=".5"') +
    ff.body +
    [[4, 4], [W - 16, 4], [4, H - 16], [W - 16, H - 16]].map(([x, y]) => rect(x, y, 12, 12, c.borderStrong)).join("") +
    frame({ x: FX, y: FY, w: FW, h: FH }) +
    `<image href="${embedImage(d.shot, "image/webp")}" x="${FX + 6}" y="${FY + 6}" width="${FW - 12}" height="${FH - 12}" preserveAspectRatio="xMidYMid slice" clip-path="url(#so-img)"/>` +
    `<text x="${COLX}" y="${titleY}" font-family="'Space Grotesk'" font-weight="700" font-size="${ts}" fill="${c.fg}">${esc(d.title)}</text>` +
    lines.map((l, i) => `<text x="${COLX}" y="${lineY0 + i * lineStep}" font-family="Inter" font-size="30" fill="${c.muted}">${esc(l)}</text>`).join("") +
    chipSvg +
    noteLines.map((l, i) => `<text x="${COLX}" y="${noteY + i * 24}" font-family="Inter" font-size="18" fill="${c.muted}" opacity=".85">${esc(l)}</text>`).join("") +
    `<image href="${logo}" x="${COLX}" y="${H - 40 - 56}" width="68" height="40"/>` +
    `<text x="${COLX + 68 + 16}" y="${H - 40 - 56 + 28}" font-family="'Space Grotesk'" font-weight="700" font-size="26" fill="${c.fg}">Vin’s Atelier</text>`;
  return svgDoc({ w: W, h: H, id: "so", title: d.title, desc: d.line, defs, css, body });
}

const only = process.argv.slice(2);
mkdirSync(`${root}assets/social`, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1, reducedMotion: "reduce" });
for (const [repo, d] of Object.entries(REPOS)) {
  if (only.length && !only.includes(repo)) continue;
  const svg = await render(repo, d);
  writeFileSync(`${root}qa-output/social-${repo}.svg`, svg);
  await page.setContent(`<body style="margin:0;background:#11150e"><img width="${W}" height="${H}" style="display:block" src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}"></body>`);
  await page.waitForFunction(() => document.images[0].complete);
  const raw = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: W, height: H } });
  const out = await sharp(raw).png({ palette: true, quality: 90, colours: 128, effort: 10 }).toBuffer();
  writeFileSync(`${root}assets/social/${repo}.png`, out);
  console.log(repo, out.length);
}
await browser.close();
