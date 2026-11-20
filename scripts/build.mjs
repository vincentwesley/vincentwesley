// Profile build: DevPulse + GitHub REST -> assets/*.svg + README GEN blocks.
// Fail safe: any fetch/parse problem keeps every committed file as-is and exits 0.
// Deterministic: no timestamps; same inputs give identical bytes.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { esc } from "./lib/svg.mjs";
import { ROWS as STACK_ROWS } from "./art/stack.mjs";
import { FEATURED, MORE, OWNER, PROFILE_REPO, NOT_ON_WORKBENCH } from "./projects.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEVPULSE = "https://devpulse.vwesley.workers.dev";
const NAME_RE = /^[A-Za-z0-9._-]{1,100}$/;
const SHOT_RE = /^\/shot\/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp)(?:\?v=[A-Za-z0-9]{1,20})?$/;
const HOSTS = new Set(["vincentwesley.github.io", "vwesley.dev", "github.com"]);
const HOST_SUFFIX = [".pages.dev", ".vwesley.workers.dev"];

// ---------- pure helpers (unit-tested) ----------
export const mdEsc = (s) => String(s ?? "").replace(/[\\[\]()<>`*_|]/g, "\\$&");

/** https only, allow-listed host, no credentials. Returns normalised href or null. */
export function safeUrl(u) {
  try {
    const x = new URL(String(u));
    const ok = x.protocol === "https:" && !x.username && !x.password &&
      (HOSTS.has(x.hostname) || HOST_SUFFIX.some((s) => x.hostname.endsWith(s)));
    return ok ? x.href.replace(/\(/g, "%28").replace(/\)/g, "%29") : null;
  } catch { return null; }
}

/** First line only, bracket tags and trailers removed, max 64 chars. */
export function cleanSubject(msg) {
  let s = String(msg ?? "").split(/\r?\n/)[0]
    .replace(/\[[^\]]{1,24}\]/g, "").replace(/co-authored-by:.*$/i, "")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, "").replace(/\s+/g, " ").trim();
  s = s.replace(/^[a-z]+(\([^)]*\))?!?:\s*/i, ""); // drop conventional-commit prefix ("chore(house): ")
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!s) s = "Update";
  return [...s].length > 64 ? [...s].slice(0, 63).join("").trimEnd() + "…" : s;
}

export function relWeek(pushedAt, now = Date.now()) {
  const t = Date.parse(pushedAt);
  if (!Number.isFinite(t)) return "recently";
  const w = Math.floor(Math.max(0, now - t) / 864e5 / 7);
  return w === 0 ? "this week" : w === 1 ? "last week" : `${w} weeks ago`;
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
    out.push({
      name: p.name,
      url: p.url ? safeUrl(p.url) : null,
      up: p.up === true,
      uptime30d: typeof p.uptime30d === "number" && p.uptime30d >= 0 && p.uptime30d <= 100 ? p.uptime30d : null,
      shot: typeof p.shot === "string" && SHOT_RE.test(p.shot) ? p.shot : null,
      pushedAt: typeof p.pushedAt === "string" && Number.isFinite(Date.parse(p.pushedAt)) ? p.pushedAt : null,
      commitCount: Number.isInteger(p.commitCount) && p.commitCount >= 0 ? p.commitCount : 0,
      archived: p.archived === true,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function footerText(projects) {
  const pub = projects.filter((p) => !p.archived && p.name !== PROFILE_REPO);
  const live = pub.filter((p) => p.up).length;
  const commits = Math.floor(pub.reduce((s, p) => s + p.commitCount, 0) / 50) * 50;
  return `${live} sites live and up. ${commits}+ commits across ${pub.length} public repos.`;
}

const hash8 = (f) => createHash("sha256").update(readFileSync(f)).digest("hex").slice(0, 8);

/** <picture> for assets/<name>-{dark,light}.svg with ?v= cache-busting; null if files are missing. */
export function pic(name, alt, { height } = {}) {
  const f = (t) => `assets/${name}-${t}.svg`;
  if (!["dark", "light"].every((t) => existsSync(resolve(ROOT, f(t))))) return null;
  const u = (t) => `${f(t)}?v=${hash8(resolve(ROOT, f(t)))}`;
  return `<picture><source media="(prefers-color-scheme: dark)" srcset="${u("dark")}"><source media="(prefers-color-scheme: light)" srcset="${u("light")}"><img src="${u("dark")}" alt="${esc(alt)}"${height ? ` height="${height}"` : ' width="100%"'}></picture>`;
}

// ---------- network ----------
async function getJson(url, headers = {}) {
  const r = await fetch(url, { headers: { "User-Agent": "vincentwesley-profile-build", Accept: "application/json", ...headers }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`${new URL(url).host} ${r.status}`);
  return r.json();
}

async function gh(path) {
  const h = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return getJson(`https://api.github.com${path}`, h);
}

async function shotFetch(path) {
  const r = await fetch(DEVPULSE + path, { signal: AbortSignal.timeout(15000) });
  if (!r.ok || !(r.headers.get("content-type") ?? "").startsWith("image/")) throw new Error("bad shot response");
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length >= 3 * 1024 * 1024) throw new Error("shot too large");
  return buf;
}

async function shotWebp(buf) {
  const sharp = (await import("sharp")).default;
  return sharp(buf).resize({ width: 720 }).webp({ quality: 72 }).toBuffer();
}

async function collect(now) {
  const projects = parseProjects(await getJson(`${DEVPULSE}/api/projects`));
  const by = new Map(projects.map((p) => [p.name, p]));
  const ok = (n) => by.has(n) && !by.get(n).archived;
  if (!projects.length || FEATURED.some((f) => !ok(f.name))) throw new Error("DevPulse payload missing featured projects");

  const shots = new Map();
  for (const f of FEATURED) {
    const file = resolve(ROOT, `assets/shots/${f.name}.webp`);
    try {
      const p = by.get(f.name);
      if (f.shotFile) { shots.set(f.name, await shotWebp(readFileSync(resolve(ROOT, f.shotFile)))); continue; }
      if (!p.shot) throw new Error("no shot");
      shots.set(f.name, await shotWebp(await shotFetch(p.shot)));
    } catch (e) {
      if (!existsSync(file)) throw new Error(`no screenshot for ${f.name}: ${e.message}`);
      console.log(`shot ${f.name}: ${e.message}; keeping committed file`);
    }
  }

  const rows = [];
  const recent = projects.filter((p) => !p.archived && p.name !== PROFILE_REPO && !NOT_ON_WORKBENCH.includes(p.name) && p.pushedAt)
    .sort((a, b) => Date.parse(b.pushedAt) - Date.parse(a.pushedAt) || a.name.localeCompare(b.name));
  for (const p of recent) {
    if (rows.length === 3) break;
    if ((await gh(`/repos/${OWNER}/${p.name}`)).private !== false) continue; // public only, never name anything else
    const commits = await gh(`/repos/${OWNER}/${p.name}/commits?per_page=10`);
    if (!Array.isArray(commits) || !commits.length) throw new Error(`no commits for ${p.name}`);
    // skip merge commits and bot commits: their subjects say nothing about the work
    const c = commits.find((x) => (x?.parents?.length ?? 0) < 2 && !/\[bot\]$/.test(x?.author?.login ?? "")) ?? commits[0];
    rows.push({ repo: p.name, week: relWeek(p.pushedAt, now), subject: cleanSubject(c?.commit?.message) });
  }
  if (rows.length < 3) throw new Error("fewer than 3 workbench rows");
  return { projects, by, shots, rows };
}

// ---------- build ----------
const WRITES = new Map(); // relative path -> string | Buffer
const rd = (rel) => (existsSync(resolve(ROOT, rel)) ? readFileSync(resolve(ROOT, rel)) : null);
function stage(rel, data) { WRITES.set(rel, data); }

async function renderArt(d) {
  const cards = (await import("./art/cards.mjs")).default;
  const workbench = (await import("./art/workbench.mjs")).default;
  for (const f of FEATURED) {
    const p = d.by.get(f.name);
    const buf = d.shots.get(f.name) ?? readFileSync(resolve(ROOT, `assets/shots/${f.name}.webp`));
    if (d.shots.has(f.name)) stage(`assets/shots/${f.name}.webp`, buf);
    for (const t of ["dark", "light"]) {
      const svg = await cards(t, { title: f.title, line: f.line, chips: f.chips, up: p.up, uptime30d: p.uptime30d, shotHref: `data:image/webp;base64,${buf.toString("base64")}` });
      if (Buffer.byteLength(svg) > 120 * 1024) throw new Error(`card ${f.name} over 120 KB`);
      stage(`assets/cards/${f.name}-${t}.svg`, svg);
    }
  }
  for (const t of ["dark", "light"]) {
    const svg = await workbench(t, { rows: d.rows, footer: footerText(d.projects) });
    if (Buffer.byteLength(svg) > 40 * 1024) throw new Error("workbench over 40 KB");
    stage(`assets/workbench-${t}.svg`, svg);
  }
  // static art from the other modules: keep committed files when a module is missing or fails
  for (const name of ["header", "credits", "jar", "stack"]) {
    try {
      const m = await import(`./art/${name}.mjs`);
      for (const t of ["dark", "light"]) stage(`assets/${name}-${t}.svg`, await m.default(t));
    } catch (e) { console.log(`art ${name}: ${e.code === "ERR_MODULE_NOT_FOUND" ? "missing" : e.message}; keeping committed files`); }
  }
  try {
    const m = await import("./art/buttons.mjs");
    for (const t of ["dark", "light"]) for (const [n, svg] of Object.entries(await m.renderButtons(t))) stage(`assets/btn-${n}-${t}.svg`, svg);
  } catch (e) { console.log(`art buttons: ${e.code === "ERR_MODULE_NOT_FOUND" ? "missing" : e.message}; keeping committed files`); }
}

const linkOf = (p, repoUrl) => (p?.up && p.url ? p.url : repoUrl);
const repoUrl = (n) => `https://github.com/${OWNER}/${n}`;

function blocks(d) {
  const b = {};
  b.header = pic("header", "Vin’s Atelier: a one-person software studio in Singapore, run by Vin.");
  const btn = (n, href, alt) => { const p = pic(`btn-${n}`, alt, { height: 40 }); return p && `<a href="${href}">${p}</a>`; };
  const buttons = [btn("site", "https://vwesley.dev", "Visit vwesley.dev"), btn("health", DEVPULSE, "Live project health on DevPulse")];
  b.buttons = buttons.every(Boolean) ? `<p>${buttons.join("&nbsp;")}</p>` : null;

  const feat = FEATURED.map((f) => {
    const p = d.by.get(f.name), live = linkOf(p, repoUrl(f.name));
    const img = pic(`cards/${f.name}`, `${f.title}: ${f.line}`);
    if (!img) return null;
    return `<a href="${live}">${img}</a>\n\n**[Open ${mdEsc(f.title)}](${live})** · [Source code](${repoUrl(f.name)})` + (f.note ? `\n<sub>${esc(f.note)}</sub>` : "");
  });
  b.featured = feat.every(Boolean) ? feat.join("\n\n") : null;

  b.more = MORE.filter((m) => d.by.has(m.name) && !d.by.get(m.name).archived)
    .map((m) => `- **[${mdEsc(m.title ?? m.name)}](${linkOf(d.by.get(m.name), repoUrl(m.name))})**: ${mdEsc(m.line)} ([code](${repoUrl(m.name)}))`).join("\n");

  b.workbench = pic("workbench", `Recently: ${d.rows.map((r) => `${r.repo} (${r.week}): ${r.subject}`).join("; ")}`);
  b.stack = pic("stack", `Tools I reach for: ${STACK_ROWS.flatMap(([, cs]) => cs).join(", ")}.`);
  b.jar = pic("jar", "A pixel-art jar of fireflies, drifting out into the night.");
  b.credits = pic("credits", "Credits: made by Vin. Copyright 2026 Vin’s Atelier. Designed and built by Vin.");
  return b;
}

async function main() {
  let d;
  try { d = await collect(Date.now()); }
  catch (e) { console.log(`build skipped (fail safe, committed files kept): ${e.message}`); return; }

  try { await renderArt(d); }
  catch (e) { console.log(`build skipped (render failed, committed files kept): ${e.message}`); return; }

  let changed = 0;
  const write = (rel, data) => {
    const old = rd(rel), buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (old && old.equals(buf)) return;
    mkdirSync(dirname(resolve(ROOT, rel)), { recursive: true });
    writeFileSync(resolve(ROOT, rel), buf); changed++;
  };
  for (const [rel, data] of WRITES) write(rel, data);

  // README is assembled after the assets are on disk so ?v= hashes match the files.
  let md = readFileSync(resolve(ROOT, "README.md"), "utf8");
  const b = blocks(d);
  for (const [id, content] of Object.entries(b)) {
    if (content == null) { console.log(`block ${id}: assets missing, kept as committed`); continue; }
    const next = replaceBlock(md, id, content);
    if (next == null) { console.log(`block ${id}: markers missing; README untouched`); return; }
    md = next;
  }
  write("README.md", md);
  console.log(`build ok: ${WRITES.size} generated files, ${changed} changed`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
