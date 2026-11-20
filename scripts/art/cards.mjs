// One featured-project card (960x320): screenshot left, title / line / chips / live status right.
// Static styles are the final state; the only motion is a slow 2.4s glow pulse on the status dot.
import { THEMES, esc, frame, chip, svgDoc } from "../lib/svg.mjs";
import { measure } from "../lib/fonts.mjs";

const W = 960, H = 320, COLX = 496, COLW = 436;
const px = (x, y, w, h, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`;
const LINE = { family: "Inter", weight: 400, size: 28 };

/** Greedy word wrap using real glyph advances; the last allowed line is ellipsised if text remains. */
export async function wrapText(text, maxW, font, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean), lines = [];
  let cur = "";
  for (let i = 0; i < words.length; i++) {
    const next = cur ? `${cur} ${words[i]}` : words[i];
    if (!cur || (await measure(next, { ...font })) <= maxW) { cur = next; continue; }
    if (lines.length === maxLines - 1) { cur = [cur, ...words.slice(i)].join(" "); break; }
    lines.push(cur); cur = words[i];
  }
  if (cur) lines.push(cur);
  const last = lines.length - 1;
  while (lines[last] && (await measure(lines[last], font)) > maxW) lines[last] = lines[last].slice(0, -2).trimEnd() + "…";
  return lines;
}

export const statusText = (d) =>
  d.up === true && Number.isFinite(d.uptime30d)
    ? `Live \u00b7 ${d.uptime30d >= 100 ? 100 : Math.round(d.uptime30d * 10) / 10}% uptime (30 days)`
    : "";

/** data: {title, line, chips[], up, uptime30d, shotHref (data: URI)} */
export default async function card(t, data) {
  const c = THEMES[t], status = statusText(data);
  const lines = await wrapText(data.line, COLX + COLW - COLX, LINE, 2);

  // chips wrap onto a second row if needed
  let cx = 0, cy = 0, chipSvg = "";
  const chipTop = 132 + (lines.length - 1) * 34 + 24;
  for (const label of data.chips) {
    const probe = await chip(label, { t, size: 20 });
    if (cx && cx + probe.w > COLW) { cx = 0; cy += probe.h + 8; }
    chipSvg += (await chip(label, { x: COLX + cx, y: chipTop + cy, t, size: 20 })).svg;
    cx += probe.w + 10;
  }

  const defs =
    `<linearGradient id="cd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.bg}"/><stop offset="1" stop-color="${c.surface}"/></linearGradient>` +
    `<pattern id="cd-dots" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="${c.borderSoft}" opacity=".7"/></pattern>` +
    `<clipPath id="cd-img"><rect x="30" y="42" width="428" height="236"/></clipPath>`;
  const css = `.pulse{opacity:.5;animation:cd-p 2.4s ease-in-out infinite both}
@keyframes cd-p{0%,100%{opacity:.18}50%{opacity:.7}}`;

  const body =
    px(0, 0, W, H, c.bg) + frame({ x: 4, y: 4, w: W - 8, h: H - 8, t }) +
    px(10, 10, 940, 300, "url(#cd-sky)") + px(10, 10, 940, 300, "url(#cd-dots)", ' opacity=".5"') +
    [[4, 4], [W - 16, 4], [4, H - 16], [W - 16, H - 16]].map(([x, y]) => px(x, y, 12, 12, c.borderStrong)).join("") +
    frame({ x: 24, y: 36, w: 440, h: 248, t }) +
    `<image href="${data.shotHref}" x="30" y="42" width="428" height="236" preserveAspectRatio="xMidYMid slice" clip-path="url(#cd-img)"/>` +
    `<text x="${COLX}" y="86" font-family="'Space Grotesk'" font-weight="700" font-size="52" fill="${c.fg}">${esc(data.title)}</text>` +
    lines.map((l, i) => `<text x="${COLX}" y="${132 + i * 34}" font-family="Inter" font-weight="400" font-size="28" fill="${c.muted}">${esc(l)}</text>`).join("") +
    chipSvg +
    (status
      ? `<circle class="pulse" cx="${COLX + 9}" cy="285" r="13" fill="${c.accent}"/><circle cx="${COLX + 9}" cy="285" r="6" fill="${c.accent}"/>` +
        `<text x="${COLX + 28}" y="294" font-family="Inter" font-weight="400" font-size="24" fill="${c.fg}">${esc(status)}</text>`
      : "");

  return svgDoc({ w: W, h: H, id: "cd", title: data.title, desc: `${data.title}: ${data.line}`, defs, css, body });
}
