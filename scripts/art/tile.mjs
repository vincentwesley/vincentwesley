// Gallery tile (400x301): 16:9 screenshot on top, slim surface band with title + tagline. Clean: no dot grid, no chips.
import { THEMES, esc, frame, rect, svgDoc } from "../lib/svg.mjs";
import { measure } from "../lib/fonts.mjs";

const BAND = 76, PAD = 18; // tall enough for type that stays legible when a tile is ~170px wide on phones

/** data: {title, tag, shotHref (data: URI)} */
export default async function tile(t, data) {
  const c = THEMES[t];
  const W = 400, SHOT_H = 225, H = SHOT_H + BAND, MAXW = W - 2 * PAD, TAG = 23, TITLE = 31;
  const tw = await measure(data.tag, { family: "Inter", weight: 400, size: TAG });
  const tagSize = Math.min(TAG, Math.floor((TAG * MAXW * 10) / Math.max(tw, 1)) / 10); // shrink a long tagline instead of clipping it
  const defs = `<clipPath id="tl-img"><rect x="2" y="2" width="${W - 4}" height="${SHOT_H - 2}"/></clipPath>`;
  const body =
    frame({ x: 2, y: 2, w: W - 4, h: H - 4, t, hairline: false }) +
    `<image href="${data.shotHref}" x="2" y="2" width="${W - 4}" height="${SHOT_H - 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#tl-img)"/>` +
    rect(2, SHOT_H, W - 4, 2, c.borderStrong) +
    [[2, 2], [W - 14, 2]].map(([x, y]) => rect(x, y, 12, 12, c.borderStrong, ' class="stud"')).join("") + // top studs back over the shot
    `<text x="${PAD}" y="${SHOT_H + 36}" font-family="'Space Grotesk'" font-weight="700" font-size="${TITLE}" fill="${c.fg}">${esc(data.title)}</text>` +
    `<text x="${PAD}" y="${SHOT_H + 64}" font-family="'Inter'" font-size="${tagSize}" fill="${c.muted}">${esc(data.tag)}</text>`;
  return svgDoc({ w: W, h: H, id: "tl", title: data.title, desc: `${data.title}: ${data.tag}`, defs, body });
}
