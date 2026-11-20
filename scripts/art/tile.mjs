// Gallery tile (400x289): 16:9 screenshot on top, slim surface band with title + tagline, optional "Live" pill. Clean: no dot grid, no chips.
import { THEMES, esc, frame, rect, svgDoc } from "../lib/svg.mjs";
import { measure } from "../lib/fonts.mjs";

const W = 400, SHOT_H = 225, BAND = 64, H = SHOT_H + BAND, PAD = 18, MAXW = W - 2 * PAD, TAG = 19;

/** data: {name, title, tag, up, shotHref (data: URI, 16:9)} */
export default async function tile(t, data) {
  const c = THEMES[t];
  const tw = await measure(data.tag, { family: "Inter", weight: 400, size: TAG });
  const tagSize = Math.min(TAG, Math.floor((TAG * MAXW * 10) / Math.max(tw, 1)) / 10); // shrink a long tagline instead of clipping it
  const defs = `<clipPath id="tl-img"><rect x="2" y="2" width="${W - 4}" height="${SHOT_H - 2}"/></clipPath>`;
  let pill = "";
  if (data.up) {
    const lw = await measure("Live", { family: "Inter", weight: 600, size: 18 });
    const pw = Math.ceil(lw) + 12 + 8 + 8 + 12, ph = 28, px = W - PAD - pw, py = SHOT_H + 6 + 4;
    pill =
      rect(px, py, pw, ph, c.accent) + rect(px + 2, py + 2, pw - 4, ph - 4, c.surface) +
      `<circle cx="${px + 12 + 4}" cy="${py + ph / 2}" r="4" fill="${c.accent}"/>` +
      `<text x="${px + 12 + 8 + 8}" y="${py + ph / 2 + 6.2}" font-family="'Inter'" font-weight="600" font-size="18" fill="${c.fg}">Live</text>`;
  }
  const body =
    frame({ x: 2, y: 2, w: W - 4, h: H - 4, t, hairline: false }) +
    `<image href="${data.shotHref}" x="2" y="2" width="${W - 4}" height="${SHOT_H - 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#tl-img)"/>` +
    rect(2, SHOT_H, W - 4, 2, c.borderStrong) +
    [[2, 2], [W - 14, 2]].map(([x, y]) => rect(x, y, 12, 12, c.borderStrong, ' class="stud"')).join("") + // top studs back over the shot
    `<text x="${PAD}" y="${SHOT_H + 32}" font-family="'Space Grotesk'" font-weight="700" font-size="28" fill="${c.fg}">${esc(data.title)}</text>` +
    `<text x="${PAD}" y="${SHOT_H + 54}" font-family="'Inter'" font-size="${tagSize}" fill="${c.muted}">${esc(data.tag)}</text>` +
    pill;
  return svgDoc({ w: W, h: H, id: "tl", title: data.title, desc: `${data.title}: ${data.tag}`, defs, body });
}
