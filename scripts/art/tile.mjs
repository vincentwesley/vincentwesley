// Gallery tile (400x300): 16:9 screenshot on top, surface band with title + tagline, optional live dot. Clean: no dot grid, no chips.
import { THEMES, esc, frame, rect, svgDoc } from "../lib/svg.mjs";
import { measure } from "../lib/fonts.mjs";

const W = 400, H = 300, SHOT_H = 225, PAD = 18, MAXW = W - 2 * PAD;

/** data: {name, title, tag, up, shotHref (data: URI, 16:9)} */
export default async function tile(t, data) {
  const c = THEMES[t];
  const tw = await measure(data.tag, { family: "Inter", weight: 400, size: 22 });
  const tagSize = Math.min(22, Math.floor((22 * MAXW * 10) / Math.max(tw, 1)) / 10); // shrink a long tagline instead of clipping it
  const defs = `<clipPath id="tl-img"><rect x="2" y="2" width="${W - 4}" height="${SHOT_H - 2}"/></clipPath>`;
  const body =
    frame({ x: 2, y: 2, w: W - 4, h: H - 4, t, hairline: false }) +
    `<image href="${data.shotHref}" x="2" y="2" width="${W - 4}" height="${SHOT_H - 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#tl-img)"/>` +
    rect(2, SHOT_H, W - 4, 2, c.borderStrong) +
    [[2, 2], [W - 14, 2]].map(([x, y]) => rect(x, y, 12, 12, c.borderStrong, ' class="stud"')).join("") + // top studs back over the shot
    `<text x="${PAD}" y="${SHOT_H + 36}" font-family="'Space Grotesk'" font-weight="700" font-size="32" fill="${c.fg}">${esc(data.title)}</text>` +
    `<text x="${PAD}" y="${SHOT_H + 62}" font-family="'Inter'" font-size="${tagSize}" fill="${c.muted}">${esc(data.tag)}</text>` +
    (data.up ? `<circle cx="${W - PAD - 6}" cy="${SHOT_H + 25}" r="11" fill="${c.accent}" opacity=".25"/><circle cx="${W - PAD - 6}" cy="${SHOT_H + 25}" r="6" fill="${c.accent}"/>` : "");
  return svgDoc({ w: W, h: H, id: "tl", title: data.title, desc: `${data.title}: ${data.tag}`, defs, body });
}
