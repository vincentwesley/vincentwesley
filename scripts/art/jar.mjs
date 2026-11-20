// Pixel-art firefly jar. Fireflies leave through the ajar lid over a 7s loop; static = jar full of fireflies.
import { fileURLToPath } from "node:url";
import { esc, THEMES, frame, svgDoc, rect } from "../lib/svg.mjs";

const W = 480, H = 380, LOOP = 7;
const TEXT = "Thanks for looking around.";
// [x, y, leaves?] inside the glass (interior x 168..308, y 148..296)
const FLIES = [
  [196, 176, 1], [262, 164, 1], [286, 214, 1], [182, 240, 1], [240, 262, 1], [214, 208, 1], [270, 280, 1], [300, 170, 1],
  [178, 290, 0], [236, 226, 0], [296, 256, 0], [190, 200, 0], [250, 190, 0], [208, 272, 0],
];

export default async function art_(t) {
  const c = THEMES[t], r = rect;
  const css =
    `.f{animation:jf ${LOOP}s ease-in-out infinite}.g{animation:jb 2.6s ease-in-out infinite alternate}` +
    `@keyframes jf{0%{transform:translate(0,0);opacity:0}10%{opacity:1}45%{transform:translate(var(--mx),var(--my));opacity:1}100%{transform:translate(var(--ex),var(--ey));opacity:0}}` +
    `@keyframes jb{from{opacity:.55}to{opacity:1}}` +
    `.lid{animation:jl 7s ease-in-out infinite}@keyframes jl{0%,100%{transform:translate(0,0)}50%{transform:translate(4px,-4px)}}`;
  const stars = [[40, 40], [120, 70], [60, 150], [400, 52], [440, 120], [380, 180], [90, 250], [430, 240], [344, 84], [28, 300]]
    .map(([x, y], i) => r(x, y, i % 3 ? 2 : 4, i % 3 ? 2 : 4, c.fg, ` opacity="${i % 2 ? 0.35 : 0.55}"`)).join("");
  const jar =
    r(168, 124, 140, 16, c.accent, ' opacity=".06"') + r(160, 140, 156, 164, c.accent, ' opacity=".06"') +
    r(164, 120, 4, 20, c.borderStrong) + r(308, 120, 4, 20, c.borderStrong) +
    r(156, 140, 8, 4, c.borderStrong) + r(312, 140, 8, 4, c.borderStrong) +
    r(156, 144, 4, 152, c.borderStrong) + r(316, 144, 4, 152, c.borderStrong) +
    r(160, 296, 4, 8, c.borderStrong) + r(312, 296, 4, 8, c.borderStrong) +
    r(168, 304, 140, 4, c.borderStrong) +
    r(296, 148, 4, 144, c.fg, ' opacity=".15"') + r(172, 156, 4, 96, c.fg, ' opacity=".4"') + r(172, 260, 4, 8, c.fg, ' opacity=".4"') + r(180, 148, 4, 4, c.fg, ' opacity=".4"');
  // lid slid right and tilted up on the left: five 32px steps, each 4px lower, all on the 4px grid
  const lid =
    `<g class="lid">` +
    [0, 1, 2, 3, 4].map((k) => {
      const x = 208 + 32 * k, y = 100 + 4 * k;
      return r(x, y, 32, 12, c.peach) + r(x, y + 8, 32, 4, c.peachText, ' opacity=".55"') + r(x + 12, y + 2, 4, 6, c.bg, ' opacity=".28"');
    }).join("") + `</g>`;
  const ff = FLIES.map(([x, y, go], i) => {
    const dot = `<circle cx="${x}" cy="${y}" r="13" fill="${c.firefly}" opacity=".6" filter="url(#jg)"/>` +
      r(x - 3, y - 3, 6, 6, c.fireflyCore) + r(x - 1, y - 1, 2, 2, "#fff", ' opacity=".8"');
    const wrap = `<g class="g" style="animation-duration:${(2.4 + (i % 4) * 0.5).toFixed(1)}s;animation-delay:-${(i * 0.7).toFixed(1)}s">${dot}</g>`;
    if (!go) return wrap;
    const mx = 188 - x + ((i % 3) - 1) * 8, my = 100 - y, ex = mx + (i % 2 ? 60 : -50) + i * 6, ey = my - 70 - (i % 4) * 14;
    return `<g class="f" style="--mx:${mx}px;--my:${my}px;--ex:${ex}px;--ey:${ey}px;animation-delay:-${((i * LOOP) / 8).toFixed(2)}s">${wrap}</g>`;
  }).join("");
  const body =
    frame({ x: 2, y: 2, w: W - 4, h: H - 4, t }) + r(8, 8, W - 16, H - 16, c.bg) + stars +
    `<ellipse cx="240" cy="310" rx="96" ry="8" fill="${c.accent}" opacity=".14"/>` +
    jar + ff + lid +
    `<text x="${W / 2}" y="360" text-anchor="middle" font-family="'Inter'" font-size="22" fill="${c.muted}">${esc(TEXT)}</text>`;
  return svgDoc({
    w: W, h: H, id: "jr", title: "A jar of fireflies", desc: "Pixel-art jar; fireflies drift out of it.",
    defs: `<filter id="jg" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>`,
    css, body,
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { sheet } = await import("../lib/preview.mjs");
  await sheet("jar", art_, { width: 480, vw: 1000 });
}
