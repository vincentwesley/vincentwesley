// Profile build: DevPulse -> assets/intro-{dark,light}.svg + README GEN blocks.
// Fail safe: any fetch/parse problem (network data only) keeps every committed file as-is and exits 0.
// Deterministic: no timestamps; same inputs give identical bytes.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { esc } from "./lib/svg.mjs";
import { PROJECTS, OWNER } from "./projects.mjs";
import intro from "./art/intro.mjs";

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
    out.push({ name: p.name, url: p.url ? safeUrl(p.url) : null, up: p.up === true, archived: p.archived === true });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const hash8 = (f) => createHash("sha256").update(readFileSync(f)).digest("hex").slice(0, 8);

/** Linked <picture> for assets/<name>-{dark,light}.svg with ?v= cache-busting; null if files are missing. */
function pic(name, alt, href) {
  const f = (t) => `assets/${name}-${t}.svg`;
  if (!["dark", "light"].every((t) => existsSync(resolve(ROOT, f(t))))) return null;
  const u = (t) => `${f(t)}?v=${hash8(resolve(ROOT, f(t)))}`;
  return `<a href="${href}"><picture><source media="(prefers-color-scheme: dark)" srcset="${u("dark")}"><source media="(prefers-color-scheme: light)" srcset="${u("light")}"><img src="${u("dark")}" alt="${esc(alt)}" width="100%"></picture></a>`;
}

// ---------- network ----------
async function collect() {
  const r = await fetch(`${DEVPULSE}/api/projects`, { headers: { "User-Agent": "vincentwesley-profile-build", Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`devpulse ${r.status}`);
  const projects = parseProjects(await r.json());
  if (!projects.length) throw new Error("DevPulse payload empty");
  return new Map(projects.map((p) => [p.name, p]));
}

// ---------- build ----------
const rd = (rel) => (existsSync(resolve(ROOT, rel)) ? readFileSync(resolve(ROOT, rel)) : null);
const repoUrl = (n) => `https://github.com/${OWNER}/${n}`;

function blocks(by) {
  const b = {};
  b.intro = pic("intro", "Hi, I’m Vin, a software engineer in Singapore. I make small, fast web apps that run in your browser. Vin’s Atelier.", "https://vwesley.dev");
  b.built = PROJECTS.filter((m) => by.has(m.name) && !by.get(m.name).archived)
    .map((m) => { const p = by.get(m.name); return `- **[${mdEsc(m.title)}](${p.up && p.url ? p.url : repoUrl(m.name)})**: ${mdEsc(m.line)}`; }).join("\n");
  return b;
}

async function main() {
  let by;
  try { by = await collect(); }
  catch (e) { console.log(`build skipped (fail safe, committed files kept): ${e.message}`); return; }

  const writes = new Map(); // committed code: a render failure is a bug, fail loudly
  for (const t of ["dark", "light"]) writes.set(`assets/intro-${t}.svg`, await intro(t));

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
