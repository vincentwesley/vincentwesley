// Profile build: DevPulse -> assets/intro-*.svg, assets/tiles/*.svg, assets/shots/*.webp + README GEN blocks.
// Fail safe: any fetch/parse problem (network data only) keeps every committed file as-is and exits 0.
// Deterministic: no timestamps; same inputs give identical bytes.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { esc } from "./lib/svg.mjs";
import { PROJECTS, MORE, OWNER } from "./projects.mjs";
import intro from "./art/intro.mjs";
import tile from "./art/tile.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEVPULSE = "https://devpulse.vwesley.workers.dev";
const NAME_RE = /^[A-Za-z0-9._-]{1,100}$/;
const SHOT_RE = /^\/shot\/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp)(?:\?v=[A-Za-z0-9]{1,20})?$/;
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
    out.push({ name: p.name, url: p.url ? safeUrl(p.url) : null, up: p.up === true, shot: typeof p.shot === "string" && SHOT_RE.test(p.shot) ? p.shot : null, archived: p.archived === true });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
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
async function shotFetch(path) {
  const r = await fetch(DEVPULSE + path, { signal: AbortSignal.timeout(15000) });
  if (!r.ok || !(r.headers.get("content-type") ?? "").startsWith("image/")) throw new Error("bad shot response");
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length >= 3 * 1024 * 1024) throw new Error("shot too large");
  return buf;
}

/** 16:9 crop at 2x tile width. `focus` is a sharp gravity name. */
async function shotWebp(buf, focus = "centre") {
  const sharp = (await import("sharp")).default;
  return sharp(buf).resize({ width: 800, height: 450, fit: "cover", position: focus }).webp({ quality: 72 }).toBuffer();
}

async function collect() {
  const r = await fetch(`${DEVPULSE}/api/projects`, { headers: { "User-Agent": "vincentwesley-profile-build", Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`devpulse ${r.status}`);
  const projects = parseProjects(await r.json());
  if (!projects.length) throw new Error("DevPulse payload empty");
  const by = new Map(projects.map((p) => [p.name, p]));
  const shots = new Map();
  for (const m of PROJECTS) {
    const file = resolve(ROOT, `assets/shots/${m.name}.webp`);
    try {
      if (!by.has(m.name) || by.get(m.name).archived) throw new Error("not in DevPulse");
      const p = by.get(m.name);
      if (m.shotFile) shots.set(m.name, await shotWebp(readFileSync(resolve(ROOT, m.shotFile)), m.focus));
      else if (p.shot) shots.set(m.name, await shotWebp(await shotFetch(p.shot), m.focus));
      else throw new Error("no shot");
    } catch (e) {
      if (!existsSync(file)) throw new Error(`no screenshot for ${m.name}: ${e.message}`);
      console.log(`shot ${m.name}: ${e.message}; keeping committed file`);
    }
  }
  return { by, shots };
}

// ---------- build ----------
const rd = (rel) => (existsSync(resolve(ROOT, rel)) ? readFileSync(resolve(ROOT, rel)) : null);
const repoUrl = (n) => `https://github.com/${OWNER}/${n}`;

const linkOf = (by, n) => (by.get(n)?.up && by.get(n).url ? by.get(n).url : repoUrl(n));

function blocks(by) {
  const b = {};
  b.intro = pic("intro", "Hi, I’m Vin, a software engineer in Singapore. I make small, fast web apps that run in your browser. Vin’s Atelier.", "https://vwesley.dev");
  const shown = PROJECTS.filter((m) => by.has(m.name) && !by.get(m.name).archived);
  const tiles = shown.map((m) => pic(`tiles/${m.name}`, `${m.title}: ${m.line}`, linkOf(by, m.name), "49%"));
  b.built = tiles.every(Boolean)
    ? Array.from({ length: Math.ceil(tiles.length / 2) }, (_, k) => `<p align="center">${tiles.slice(k * 2, k * 2 + 2).join(" ")}</p>`).join("\n\n")
    : null;
  b.also = "Also: " + MORE.filter((m) => by.has(m.name) && !by.get(m.name).archived).map((m) => `[${mdEsc(m.title)}](${linkOf(by, m.name)})`).join(" · ");
  return b;
}

async function main() {
  let by, shots;
  try { ({ by, shots } = await collect()); }
  catch (e) { console.log(`build skipped (fail safe, committed files kept): ${e.message}`); return; }

  const writes = new Map(); // committed code: a render failure is a bug, fail loudly
  for (const t of ["dark", "light"]) writes.set(`assets/intro-${t}.svg`, await intro(t));
  for (const m of PROJECTS) {
    if (!by.has(m.name) || by.get(m.name).archived) continue;
    const buf = shots.get(m.name) ?? readFileSync(resolve(ROOT, `assets/shots/${m.name}.webp`));
    if (shots.has(m.name)) writes.set(`assets/shots/${m.name}.webp`, buf);
    const shotHref = `data:image/webp;base64,${buf.toString("base64")}`;
    for (const t of ["dark", "light"]) writes.set(`assets/tiles/${m.name}-${t}.svg`, await tile(t, { title: m.title, tag: m.tag, up: by.get(m.name).up, shotHref }));
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
