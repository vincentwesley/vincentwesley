// "On the workbench" panel (840 wide so text stays legible at phone width): the latest commits on the most recently pushed public repos.
import { THEMES, esc, frame, svgDoc } from "../lib/svg.mjs";
import { measure } from "../lib/fonts.mjs";
import { wrapText } from "./cards.mjs";

const W = 840, X = 32, RIGHT = W - 32;
const px = (x, y, w, h, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`;
const SUBJ = { family: "Inter", weight: 400, size: 28 };
const FOOT = { family: "Inter", weight: 400, size: 24 };

async function fit(text, maxW, font) {
  let s = String(text);
  if ((await measure(s, font)) <= maxW) return s;
  while (s.length > 1 && (await measure(s + "…", font)) > maxW) s = s.slice(0, -1);
  return s.trimEnd() + "…";
}

/** data: {rows: [{repo, week, subject}], footer} */
export default async function workbench(t, data) {
  const c = THEMES[t], rows = data.rows.slice(0, 3);
  const subjects = await Promise.all(rows.map((r) => fit(r.subject, RIGHT - X, SUBJ)));
  const foot = await wrapText(data.footer, RIGHT - X, FOOT, 2);
  const divY = 64 + rows.length * 96 - 20, footY = divY + 40, H = footY + (foot.length - 1) * 32 + 36;
  const defs =
    `<linearGradient id="wb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.bg}"/><stop offset="1" stop-color="${c.surface}"/></linearGradient>` +
    `<pattern id="wb-dots" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="${c.borderSoft}" opacity=".7"/></pattern>`;

  const body =
    px(0, 0, W, H, c.bg) + frame({ x: 4, y: 4, w: W - 8, h: H - 8, t }) +
    px(10, 10, W - 20, H - 20, "url(#wb-sky)") + px(10, 10, W - 20, H - 20, "url(#wb-dots)", ' opacity=".5"') +
    [[4, 4], [W - 16, 4], [4, H - 16], [W - 16, H - 16]].map(([x, y]) => px(x, y, 12, 12, c.borderStrong)).join("") +
    rows.map((r, i) => {
      const y = 64 + i * 96;
      return `<text x="${X}" y="${y}" font-family="'JetBrains Mono'" font-weight="500" font-size="30" fill="${c.accent}">${esc(r.repo)}</text>` +
        `<text x="${RIGHT}" y="${y}" text-anchor="end" font-family="Inter" font-weight="400" font-size="24" fill="${c.muted}">${esc(r.week)}</text>` +
        `<text x="${X}" y="${y + 40}" font-family="Inter" font-weight="400" font-size="28" fill="${c.fg}">${esc(subjects[i])}</text>`;
    }).join("") +
    px(X, divY, RIGHT - X, 2, c.borderSoft) +
    foot.map((l, i) => `<text x="${X}" y="${footY + i * 32}" font-family="Inter" font-weight="400" font-size="24" fill="${c.muted}">${esc(l)}</text>`).join("");

  const desc = rows.map((r, i) => `${r.repo} (${r.week}): ${subjects[i]}`).join("; ");
  return svgDoc({ w: W, h: H, id: "wb", title: "On the workbench", desc: `Recently: ${desc}. ${data.footer}`, defs, body });
}
