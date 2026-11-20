// Profile build: DevPulse (live/up, links) + committed captures (assets/shots-src, refresh: scripts/art/capture.mjs) -> assets/intro-*.svg, assets/tiles/*.svg, README GEN blocks.
// Fail safe: any fetch/parse problem (network data only) keeps every committed file as-is and exits 0.
// Deterministic: no timestamps; same inputs give identical bytes.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { esc } from "./lib/svg.mjs";
import { PROJECTS, MORE, OWNER, SITE } from "./projects.mjs";
import intro from "./art/intro.mjs";
import tile from "./art/tile.mjs";
import site from "./art/site.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEVPULSE = "https://devpulse.vwesley.workers.dev";
const NAME_RE = /^[A-Za-z0-9._-]{1,100}$/;
const HOSTS = new Set(["vincentwesley.github.io", "metalensvgc.pages.dev", "devpulse.vwesley.workers.dev", "vwesley.dev", "github.com"]);

// ---------- pure helpers (unit-tested) ----------
export const mdEsc = (s) => String(s ?? "").replace(/[\\[\]()<>`*_|]/g, "\\$&");

/** https only, exact allow-listed host, no credentials. Returns normalised href or null. */
export function safeUrl(u) {
  try {
    const x = new URL(String(u));
    const ok = x.protocol === "https:" && !x.username && !x.password && HOSTS.has(x.hostname);
    return ok ? x.href.replace(/\(/g, "%28").replace(/\)/g, "%29") : null;
  } catch { return null; }
}

/** Replace the text between GEN markers. Returns null when markers are missing. */
export function replaceBlock(text, id, content) {
  const a = `<!-- GEN:${id}:START -->`, b = `<!-- GEN:${id}:END -->`;
  const i = text.indexOf(a), j = text.indexOf(b);
  if (i < 0 || j < i) return null;
  return `${text.slice(0, i + a.length)}\n${content}\n${text.slice(j)}`;
}

/** Validate the DevPulse payload at the trust boundary. Junk in -> []. */
export function parseProjects(payload) {
  if (!Array.isArray(payload)) return [];
  const out = [];
  for (const p of payload) {
    if (!p || typeof p !== "object" || typeof p.name !== "string" || !NAME_RE.test(p.name)) continue;
    if (p.repo !== `${OWNER}/${p.name}`) continue;
    const pushed = Date.parse(p.pushedAt);
    out.push({ name: p.name, url: p.url ? safeUrl(p.url) : null, up: p.up === true, archived: p.archived === true, pushed: Number.isNaN(pushed) ? 0 : pushed });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Most recently pushed, non-archived entry among the curated lists (ties: list order). Null if none. */
export function pickNow(by, entries) {
  let best = null;
  for (const m of entries) {
    const p = by.get(m.name);
    if (p && !p.archived && p.pushed > 0 && (!best || p.pushed > by.get(best.name).pushed)) best = m;
  }
  return best;
}

const hash8 = (f) => createHash("sha256").update(readFileSync(f)).digest("hex").slice(0, 8);

/** Linked <picture> for assets/<name>-{dark,light}.svg with ?v= cache-busting; null if files are missing. */
function pic(name, alt, href, width = "100%") {
  const f = (t) => `assets/${name}-${t}.svg`;
  if (!["dark", "light"].every((t) => existsSync(resolve(ROOT, f(t))))) return null;
  const u = (t) => `${f(t)}?v=${hash8(resolve(ROOT, f(t)))}`;
  return `<a href="${href}"><picture><source media="(prefers-color-scheme: dark)" srcset="${u("dark")}"><source media="(prefers-color-scheme: light)" srcset="${u("light")}"><img src="${u("dark")}" alt="${esc(alt)}" width="${width}"></picture></a>`;
}

// ---------- network ----------
/** Committed capture (scripts/art/capture.mjs) for a project in one theme. */
export const shotFile = (m, t) => `assets/shots-src/${m.name}-${t}.webp`;

/** Crop at 2x tile width (16:9).`focus` is a sharp gravity name. */
export async function shotWebp(buf, focus = "centre", w = 800, h = 450) {
  const sharp = (await import("sharp")).default;
  return sharp(buf).resize({ width: w, height: h, fit: "cover", position: focus }).webp({ quality: 72 }).toBuffer();
}

async function collect() {
  const r = await fetch(`${DEVPULSE}/api/projects`, { headers: { "User-Agent": "vincentwesley-profile-build", Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`devpulse ${r.status}`);
  const projects = parseProjects(await r.json());
  if (!projects.length) throw new Error("DevPulse payload empty");
  const by = new Map(projects.map((p) => [p.name, p]));
  return { by };
}

// ---------- build ----------
const rd = (rel) => (existsSync(resolve(ROOT, rel)) ? readFileSync(resolve(ROOT, rel)) : null);
const repoUrl = (n) => `https://github.com/${OWNER}/${n}`;

/** Shown unless DevPulse lacks it or it is archived. */
export const isShown = (by, m) => by.has(m.name) && !by.get(m.name).archived;
/** Live URL if up, else the repo. */
export const linkOf = (by, m) => (by.get(m.name)?.up && by.get(m.name).url ? by.get(m.name).url : repoUrl(m.name));
const nbsp = (s) => s.replace(/ /g, "&nbsp;");

function blocks(by) {
  const b = {};
  b.intro = pic("intro", "Hi, I’m Vin, a software engineer in Singapore. I make small, fast web apps that run in your browser. Vin’s Atelier.", "https://vwesley.dev");
  b.site = pic(SITE.name, SITE.alt, SITE.link); // not in DevPulse: always shown, full width
  const tiles = PROJECTS.filter((m) => isShown(by, m)).map((m) => pic(`tiles/${m.name}`, `${m.title}: ${m.line}`, linkOf(by, m), "49.3%")); // 2 x 49.3% + the joining space still fits one row at 375px, and sits ~4px inside the banner at 1280
  const now = pickNow(by, [...PROJECTS, ...MORE]);
  b.now = now ? `**Now:** working on [${mdEsc(now.title)}](${linkOf(by, now)})${now.line ? `, ${now.line}` : ""}.` : null;
  b.built = tiles.every(Boolean)
    ? Array.from({ length: Math.ceil(tiles.length / 2) }, (_, k) => `<p align="center">${tiles.slice(k * 2, k * 2 + 2).join(" ")}</p>`).join("\n\n")
    : null;
  b.also = "Also: " + MORE.filter((m) => by.has(m.name) && !by.get(m.name).archived).map((m) => `[${nbsp(mdEsc(m.title))}](${linkOf(by, m)})`).join(" · ");
  return b;
}

async function main() {
  let by;
  try { ({ by } = await collect()); }
  catch (e) { console.log(`build skipped (fail safe, committed files kept): ${e.message}`); return; }

  const writes = new Map(); // committed code: a render failure is a bug, fail loudly
  for (const t of ["dark", "light"]) writes.set(`assets/intro-${t}.svg`, await intro(t));
  for (const t of ["dark", "light"]) writes.set(`assets/${SITE.name}-${t}.svg`, await site(t, SITE));
  for (const m of PROJECTS) {
    if (!isShown(by, m)) continue;
    for (const t of ["dark", "light"]) {
      const buf = await shotWebp(readFileSync(resolve(ROOT, shotFile(m, t))), m.focus); // theme-matched capture: dark tile gets the dark shot
      writes.set(`assets/tiles/${m.name}-${t}.svg`, await tile(t, { title: m.title, tag: m.tag, shotHref: `data:image/webp;base64,${buf.toString("base64")}` }));
    }
  }

  // Check every README marker before touching disk, so assets and README never go out of sync.
  const md0 = readFileSync(resolve(ROOT, "README.md"), "utf8");
  const missing = Object.keys(blocks(by)).filter((id) => replaceBlock(md0, id, "") == null);
  if (missing.length) { console.log(`markers missing (${missing.join(", ")}); nothing written`); return; }

  let changed = 0;
  const write = (rel, data) => {
    const old = rd(rel), buf = Buffer.from(data);
    if (old && old.equals(buf)) return;
    mkdirSync(dirname(resolve(ROOT, rel)), { recursive: true });
    writeFileSync(resolve(ROOT, rel), buf); changed++;
  };
  for (const [rel, data] of writes) write(rel, data);

  // README is assembled after the assets are on disk so ?v= hashes match the files.
  let md = md0;
  for (const [id, content] of Object.entries(blocks(by))) {
    if (content == null) { console.log(`block ${id}: assets missing, kept as committed`); continue; }
    md = replaceBlock(md, id, content);
  }
  write("README.md", md);
  console.log(`build ok: ${writes.size} generated files, ${changed} changed`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
