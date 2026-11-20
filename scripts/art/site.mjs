// vwesley.dev card (840x340): the studio's morphing logo plays </> -> </in> -> </Atelier> once, then holds the long form.
// A README can't run JS, so no dragging; the static frame (no animation / reduced motion) is the long form.
// Logo markup: scripts/art/atelier-logo.frag.svg = geometry byte-identical to _house/brand/logo/signoff.html, gradient stops = the six commissioned hexes.
// Morph maths = _house/brand/logo/logo.css at each --logo-x, sampled into plain keyframes (no @property, no JS).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { THEMES, esc, frame, fireflies, svgDoc, r2 } from "../lib/svg.mjs";

const W = 840, H = 340, LOGO_H = 110, LOGO_W = (LOGO_H * 1707.4) / 432, LX = (W - LOGO_W) / 2, LY = 60, K = LOGO_H / 432;
const LOGO = readFileSync(new URL("./atelier-logo.frag.svg", import.meta.url), "utf8").trimEnd();

// x(t): short(540) -> middle(734) in 0.5s, hold 0.6s, -> long(1491.4) in 1.3s; ease-out inside each move; starts 0.6s after load.
const DUR = 2.4, DELAY = 0.6, easeOut = (u) => 1 - (1 - u) ** 3;
const frames = [];
for (let i = 0; i <= 8; i++) frames.push([(i / 8) * 0.5, 540 + 194 * easeOut(i / 8)]);
frames.push([1.1, 734]);
for (let i = 1; i <= 26; i++) frames.push([1.1 + (i / 26) * 1.3, 734 + 757.4 * easeOut(i / 26)]);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const kf = (name, fn) => `@keyframes ${name}{${frames.map(([s, x]) => `${r2((s / DUR) * 100)}%{${fn(x)}}`).join("")}}`;
const anim = (n) => `animation:${n} ${DUR}s linear ${DELAY}s both`;
const inClip = (x) => `clip-path:inset(0 ${r2(Math.max(0, (734 - x) * 1.39176))}px 0 0) fill-box`;
const atClip = (x) => `clip-path:inset(0 ${r2(Math.max(0, 1491.4 - x))}px 0 0) fill-box`;

function css(c) {
  return (
    `.bl-in,.bl-atelier{fill:${c.letters}}` +
    // static = the final long form
    `.bl-right{transform:translateX(1491.4px)}.bl-in{opacity:0;clip-path:inset(0 0 0 0) fill-box}.bl-atelier{opacity:1;clip-path:inset(0 0 0 0) fill-box}` +
    `@media (prefers-reduced-motion:no-preference){.bl-right{${anim("site-r")}}.bl-in{${anim("site-i")}}.bl-atelier{${anim("site-a")}}.site-pan{${anim("site-p")}}}` +
    kf("site-r", (x) => `transform:translateX(${r2(x)}px)`) +
    kf("site-i", (x) => `${inClip(x)};opacity:${r2(clamp01((790 - x) / 56))}`) +
    kf("site-a", (x) => `${atClip(x)};opacity:${r2(clamp01((x - 790) / 110))}`) +
    kf("site-p", (x) => `transform:translateX(${r2(((1491.4 - x) / 2) * K)}px)`) // keeps the visible logo centred while it grows
  );
}

export default async function site(t, { title, tag }) {
  const c = { ...THEMES[t], letters: t === "dark" ? "#ffffff" : "#333333" };
  const ff = fireflies({ count: 4, w: W - 8, h: H - 8, seed: 23, t, id: "sf" });
  const cx = W / 2, cy = LY + LOGO_H / 2;
  const defs = `${ff.defs}
<clipPath id="site-clip"><rect x="2" y="2" width="${W - 4}" height="${H - 4}"/></clipPath>
<pattern id="site-dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.2" fill="${c.accent}" opacity=".22"/></pattern>
<radialGradient id="site-glow" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="270"><stop offset="0" stop-color="${c.accent}" stop-opacity=".22"/><stop offset="1" stop-color="${c.accent}" stop-opacity="0"/></radialGradient>`;
  const body =
    frame({ x: 2, y: 2, w: W - 4, h: H - 4, t }) +
    `<g clip-path="url(#site-clip)">` +
    `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="url(#site-glow)"/>` +
    `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="url(#site-dots)"/>` +
    `<g transform="translate(4 4)">${ff.body}</g></g>` +
    `<g class="site-pan"><svg x="${r2(LX)}" y="${LY}" width="${r2(LOGO_W)}" height="${LOGO_H}" viewBox="0 324 1707.4 432" focusable="false">\n${LOGO}\n</svg></g>` +
    `<text x="${W / 2}" y="${LY + LOGO_H + 55 + 22}" text-anchor="middle" font-family="'Space Grotesk'" font-weight="700" font-size="30" fill="${c.fg}">${esc(title)}</text>` +
    `<text x="${W / 2}" y="${LY + LOGO_H + 55 + 58}" text-anchor="middle" font-family="'Inter'" font-size="22" fill="${c.muted}">${esc(tag)}</text>`;
  return svgDoc({
    w: W, h: H, id: "site", title: "Vin’s Atelier · vwesley.dev",
    desc: "The Vin’s Atelier logo stretching from </> to </Atelier>, linking to vwesley.dev.",
    defs, css: ff.css + css(c), body,
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { sheet } = await import("../lib/preview.mjs");
  const { SITE } = await import("../projects.mjs");
  await sheet("site", (t) => site(t, SITE), { width: 840, vw: 1300 });
}