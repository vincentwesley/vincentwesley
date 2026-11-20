// Small SVG string primitives for the profile art. No deps. All text goes through esc().
import { readFileSync } from "node:fs";
import { measure, shape } from "./fonts.mjs";

/** XML-escape and strip control chars (except tab/newline are also stripped: SVG text is single-line). */
export const esc = (s) =>
  String(s ?? "")
    .replace(/[\u0000-\u001f\u007f-\u009f￾￿]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export const THEMES = {
  dark: {
    bg: "#11150e", surface: "#1a2015", fg: "#e9f0df", muted: "#aebb9f",
    accent: "#4fe0a0", accentFg: "#04140b", peach: "#e9a07f", peachText: "#e9a07f",
    lavender: "#a996e0", lavenderText: "#b8a8ea",
    border: "#66795a", borderSoft: "#2f3a26", borderStrong: "#8aa07a",
    firefly: "#9dff6a", fireflyCore: "#eaffb0",
  },
  light: {
    bg: "#eef7f1", surface: "#fbfefc", fg: "#10251a", muted: "#3b5747",
    accent: "#14673a", accentFg: "#ffffff", peach: "#b4532a", peachText: "#9a4320",
    lavender: "#6b55b8", lavenderText: "#573fa6",
    border: "#6a957d", borderSoft: "#c2dbcb", borderStrong: "#3f6b52",
    firefly: "#1a7f46", fireflyCore: "#1f8a4f",
  },
};
const T = (t) => (typeof t === "string" ? THEMES[t] : t);

export const rect = (x, y, w, h, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`;

/** House pixel frame: 2px ring outside the box, surface fill, 4px band, 2px hairline at 4-6px in, 12px studs. */
export function frame({ x, y, w, h, t = "dark", color, hairline = true }) {
  const c = T(t), ring = color ?? c.borderStrong, s = 12;
  return [
    rect(x - 2, y - 2, w + 4, h + 4, ring), // ring
    rect(x, y, w, h, c.surface), // fill (+ 4px band: the surface itself)
    // 2px inner hairline 4px..6px in, drawn as four bars
    ...(hairline ? [
      [x + 4, y + 4, w - 8, 2], [x + 4, y + h - 6, w - 8, 2],
      [x + 4, y + 6, 2, h - 12], [x + w - 6, y + 6, 2, h - 12],
    ] : []).map(([a, b, cw, ch]) => rect(a, b, cw, ch, ring, ' opacity=".85"')),
    // corner studs
    ...[[x, y], [x + w - s, y], [x, y + h - s], [x + w - s, y + h - s]].map(([a, b]) => rect(a, b, s, s, ring, ' class="stud"')),
  ].join("");
}

// mulberry32: tiny seeded PRNG so output is deterministic
export function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Deterministic drifting/blinking fireflies. Returns {defs, css, body}. `id` prefixes the shared filter/classes.
 * `haloScale`: multiplier on the default halo (3x the core radius). `wrap(i, svg)`: per-firefly wrapper hook.
 */
export function fireflies({ count = 12, w, h, seed = 1, t = "dark", id = "ff", haloScale = 1, wrap = (_, s) => s }) {
  const c = T(t), rnd = prng(seed), pick = (a, b) => a + rnd() * (b - a);
  const css = [], dots = [];
  for (let i = 0; i < count; i++) {
    const x = r2(pick(8, w - 8)), y = r2(pick(8, h - 8)), r = r2(pick(1.5, 2.5));
    const dx = r2(pick(20, 40) * (rnd() < 0.5 ? -1 : 1)), dy = r2(pick(20, 40) * (rnd() < 0.5 ? -1 : 1));
    const drift = r2(pick(6, 12)), blink = r2(pick(2.3, 4.2)); // blink period >= 2.3s: far below 3 Hz
    css.push(
      `@keyframes ${id}d${i}{from{transform:translate(0,0)}to{transform:translate(${dx}px,${dy}px)}}` +
      `.${id}${i}{animation:${id}d${i} ${drift}s ease-in-out ${r2(-pick(0, drift))}s infinite alternate}`,
    );
    dots.push(wrap(i,
      `<g class="${id}${i}"><g class="${id}b" style="animation-duration:${blink}s;animation-delay:${r2(-pick(0, blink))}s">` +
      `<circle cx="${x}" cy="${y}" r="${r2(r2(r * 3) * haloScale)}" fill="${c.firefly}" opacity=".55" filter="url(#${id}-glow)"/>` +
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.fireflyCore}"/></g></g>`,
    ));
  }
  css.push(`@keyframes ${id}-blink{0%{opacity:.15}50%{opacity:1}100%{opacity:.3}}.${id}b{animation:${id}-blink 3s ease-in-out infinite alternate}`);
  return {
    defs: `<filter id="${id}-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3"/></filter>`,
    css: css.join(""),
    body: dots.join(""),
  };
}

const SILK = { family: "Silkscreen", weight: 400 };

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

/** Silkscreen uppercase chip with 2px four-sided offset ring. Returns {svg, w, h}. */
export async function chip(text, { x = 0, y = 0, t = "dark", size = 12, color } = {}) {
  const c = T(t), label = String(text).toUpperCase(), ls = 1, padX = 10, h = size + 14;
  const tw = await measure(label, { ...SILK, size, letterSpacing: ls });
  const w = Math.ceil(tw + padX * 2), ring = color ?? c.border;
  const svg =
    `<g transform="translate(${x} ${y})">` +
    rect(0, 0, w, h, ring) + rect(2, 2, w - 4, h - 4, c.surface) + // 2px ring, all four sides
    `<text x="${padX}" y="${h / 2 + size * 0.35}" font-family="'Silkscreen'" font-size="${size}" letter-spacing="${ls}" fill="${c.fg}">${esc(label)}</text></g>`;
  return { svg, w, h };
}

const unesc = (s) => s.replace(/&(lt|gt|quot|apos|amp);/g, (_, k) => ({ lt: "<", gt: ">", quot: '"', apos: "'", amp: "&" })[k]);
const KEEP = ["fill", "opacity", "class", "style", "filter"]; // attrs the <g> inherits from the former <text>

/** Glyph path (absolute M/L/Q/C/Z in font units) -> relative path on a q-unit grid (invisible at text sizes), h/v where possible, repeated letters dropped. */
function compact(d, q) {
  const t = d.match(/[MLQCZ]|-?\d+(?:\.\d+)?/g) ?? [], n = { M: 2, L: 2, Q: 4, C: 6, Z: 0 };
  const segs = [];
  for (let i = 0; i < t.length;) { const c = t[i++], a = t.slice(i, i + n[c]).map((v) => Math.round(+v / q)); i += n[c]; segs.push([c, a]); }
  let cx = 0, cy = 0, sx = 0, sy = 0, prev = "", out = "", prevQ = null;
  const put = (c, nums) => { out += (c === prev ? " " : c) + nums.join(" "); prev = c; };
  segs.forEach(([c, a], i) => {
    if (c === "Z") { out += "z"; prev = "z"; cx = sx; cy = sy; return; }
    if (c === "L" && segs[i + 1]?.[0] === "Z" && a[0] === sx && a[1] === sy) return; // z closes it anyway
    const e = a.slice(-2), rel = a.map((v, j) => v - (j % 2 ? cy : cx));
    if (c === "M") { if (out) put("m", rel); else put("M", a); sx = e[0]; sy = e[1]; }
    else if (c === "L") rel[1] === 0 ? put("h", [rel[0]]) : rel[0] === 0 ? put("v", [rel[1]]) : put("l", rel);
    else if (c === "Q" && prevQ && Math.abs(rel[0] - prevQ[0]) <= 1 && Math.abs(rel[1] - prevQ[1]) <= 1) put("t", rel.slice(2)); // control mirrors the last one (<=1 unit off)
    else put(c.toLowerCase(), rel);
    prevQ = c === "Q" ? [rel[2] - rel[0], rel[3] - rel[1]] : null;
    cx = e[0]; cy = e[1];
  });
  return out.replace(/ -/g, "-");
}

/**
 * Replace every <text> in `body` with outlined glyphs: <path> per distinct glyph in defs, <use> per placement.
 * Each text becomes <g {fill,class,...}><g transform="translate scale(k -k)"><use x=pen/>...</g></g>; the pen
 * (x) is in font units, so only the inner group carries the transform. No font is needed at render time.
 */
async function outline(body, id) {
  const glyphs = new Map(); // "family|weight|gid" -> {n, d}
  let out = "", last = 0;
  for (const m of body.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
    if (m[2].includes("<")) throw new Error("outline: nested markup inside <text> is not supported");
    const a = Object.fromEntries([...m[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map((x) => [x[1], unesc(x[2])]));
    const family = a["font-family"].replace(/'/g, ""), weight = +(a["font-weight"] ?? 400);
    const size = +a["font-size"], ls = +(a["letter-spacing"] ?? 0), text = unesc(m[2]);
    const sh = await shape(text, { family, weight });
    const q = Math.max(1, Math.round(sh.upem / 250)), k = size / sh.upem, total = sh.glyphs.reduce((s, g) => s + g.adv * k + ls, 0);
    const x0 = +a.x - (a["text-anchor"] === "middle" ? total / 2 : a["text-anchor"] === "end" ? total : 0);
    let pen = 0, uses = "";
    for (const g of sh.glyphs) {
      const key = `${family}|${weight}|${g.gid}`;
      if (!glyphs.has(key)) glyphs.set(key, { n: glyphs.size, d: compact(sh.path(g.gid), q) });
      const gl = glyphs.get(key);
      if (gl.d) uses += `<use href="#${id}g${gl.n}" x="${Math.round(pen / q)}"/>`;
      pen += g.adv + ls / k;
    }
    const attrs = KEEP.filter((n) => a[n] != null).map((n) => ` ${n}="${esc(a[n])}"`).join("");
    out += body.slice(last, m.index) +
      `<g${attrs}><g transform="translate(${r2(x0)} ${r2(+a.y)}) scale(${+(k * q).toPrecision(6)} ${-(k * q).toPrecision(6)})">${uses}</g></g>`;
    last = m.index + m[0].length;
  }
  const defs = [...glyphs.values()].filter((g) => g.d).map((g) => `<path id="${id}g${g.n}" d="${g.d}"/>`).join("");
  return { body: out + body.slice(last), defs };
}

/** Root <svg> with title/desc, outlined text and a style block that always includes the reduced-motion kill switch. */
export async function svgDoc({ w, h, title, desc = "", defs = "", css = "", body, id = "svg" }) {
  const o = await outline(body, id);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d">` +
    `<title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>` +
    `<defs>${defs}${o.defs}</defs><style>${css}@media (prefers-reduced-motion: reduce){*{animation:none!important}}</style>${o.body}</svg>`
  );
}

/** File -> base64 data URI (logos stay byte-exact; nested <image> isolates their gradient ids). */
export const embedImage = (path, mime) => `data:${mime};base64,${readFileSync(path).toString("base64")}`;
