// Local QA only (never CI): render README like GitHub, screenshot with Playwright, write qa-output/report.txt.
// Usage: node scripts/qa.mjs [--links]
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve, join } from "node:path";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const out = join(root, "qa-output");
mkdirSync(out, { recursive: true });
const require = createRequire(import.meta.url);
const md = readFileSync(join(root, "README.md"), "utf8");

// GFM render via gh (token stays inside gh, never printed).
let html = execFileSync("gh", ["api", "markdown", "-f", "mode=gfm", "-f", "context=vincentwesley/vincentwesley", "-F", "text=@-"], {
  input: md, encoding: "utf8", maxBuffer: 32 << 20,
});

// Relative img src / srcset -> file:// so local assets load.
const fileUrl = (p) => pathToFileURL(resolve(root, p.replace(/^\.?\//, "").replace(/[?#].*$/, ""))).href;
const isRel = (u) => u && !/^([a-z]+:|\/\/|#|data:)/i.test(u);
html = html.replace(/\b(src|srcset)="([^"]*)"/g, (m, attr, v) => {
  if (attr === "src") return isRel(v) ? `src="${fileUrl(v)}"` : m;
  return `srcset="${v.split(",").map((s) => { const [u, ...r] = s.trim().split(/\s+/); return [isRel(u) ? fileUrl(u) : u, ...r].join(" "); }).join(", ")}"`;
});

const css = (n) => readFileSync(require.resolve(`github-markdown-css/github-markdown-${n}.css`), "utf8");
const page = (scheme) => `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${css(scheme)}
body{margin:0;padding:24px 16px;background:${scheme === "dark" ? "#0d1117" : "#fff"}}
.markdown-body{box-sizing:border-box;max-width:1012px;margin:0 auto;padding:32px;border:1px solid ${scheme === "dark" ? "#30363d" : "#d0d7de"};border-radius:6px}
@media(max-width:600px){body{padding:8px}.markdown-body{padding:16px}}</style>
<article class="markdown-body">${html}</article>`;

const browser = await chromium.launch();
const shots = [
  ...["dark", "light"].flatMap((s) => [375, 1280].map((w) => ({ s, w }))),
  { s: "dark", w: 1280, reduce: true },
];
for (const { s, w, reduce } of shots) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: 900 }, deviceScaleFactor: w === 375 ? 2 : 1,
    colorScheme: s, reducedMotion: reduce ? "reduce" : "no-preference",
  });
  const p = await ctx.newPage();
  const f = join(out, `page-${s}${reduce ? "-reduced" : ""}.html`);
  writeFileSync(f, page(s));
  await p.goto(pathToFileURL(f).href);
  await p.waitForLoadState("networkidle");
  await p.waitForTimeout(1500);
  // SVG-as-image rasterises once; fonts decoded late leave text blank/fallback. A reload hits the warm cache.
  await p.reload(); await p.waitForLoadState("networkidle"); await p.waitForTimeout(1500);
  await p.screenshot({ path: join(out, `${s}-${w}${reduce ? "-reduced" : ""}.png`), fullPage: true });
  await ctx.close();
}
await browser.close();

// Report
const lines = [];
const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
let bytes = 0;
lines.push(`# images (${imgs.length})`);
for (const tag of imgs) {
  const src = /\bsrc="([^"]*)"/.exec(tag)?.[1] ?? "";
  const alt = /\balt="([^"]*)"/.exec(tag)?.[1];
  const flag = alt === undefined ? "  [MISSING ALT]" : alt.trim().length < 4 ? "  [SHORT ALT]" : "";
  let size = "";
  if (src.startsWith("file:")) {
    const fp = fileURLToPath(src.split("?")[0]);
    if (existsSync(fp)) { const n = statSync(fp).size; bytes += n; size = ` (${n} B)`; } else size = " (MISSING FILE)";
  }
  lines.push(`${src}${size} | alt="${alt ?? ""}"${flag}`);
}
// also count <source srcset> local files
for (const m of html.matchAll(/<source\b[^>]*srcset="([^"]*)"/g)) {
  for (const part of m[1].split(",")) {
    const u = part.trim().split(/\s+/)[0];
    if (u.startsWith("file:")) { const fp = fileURLToPath(u.split("?")[0]); if (existsSync(fp)) bytes += statSync(fp).size; }
  }
}
const hrefs = [...new Set([...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => m[1]))];
lines.push("", `# local image bytes (img + source): ${bytes}`, "", `# hrefs (${hrefs.length})`);
const check = process.argv.includes("--links");
for (const h of hrefs) {
  let status = "";
  if (check && /^https?:/.test(h)) {
    try {
      let r = await fetch(h, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(10000) });
      if (r.status >= 400) r = await fetch(h, { redirect: "follow", signal: AbortSignal.timeout(10000) });
      status = ` -> ${r.status}`;
    } catch (e) { status = ` -> ERR ${e.name}`; }
  }
  lines.push(h + status);
}
writeFileSync(join(out, "report.txt"), lines.join("\n") + "\n");
console.log(lines.slice(0, 1).join(""), `| bytes ${bytes} | hrefs ${hrefs.length} | report: qa-output/report.txt`);
