// Local-only, manual (never CI): capture each gallery project's live site in BOTH themes.
// Usage: node scripts/art/capture.mjs [name ...]   -> assets/shots-src/<name>-{dark,light}.webp (1600x900, sharp q75).
// Needs playwright + sharp (devDependencies, imported lazily). House-style sites default to dark and read
// localStorage.theme before paint, so each theme is forced via an init script plus colorScheme.
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const OUT = resolve(ROOT, "assets/shots-src");
const SETTLE = 3000;

// url + optional `prep(page, theme)` to dismiss dialogs / reach the framed view, `key` = localStorage theme key.
export const TARGETS = {
  "black-hole": { url: "https://vincentwesley.github.io/black-hole/" },
  "sdf-forge": { url: "https://vincentwesley.github.io/sdf-forge/", prep: async (p) => { await p.getByRole("button", { name: "No thanks" }).click({ timeout: 4000 }).catch(() => {}); } },
  MetaLensVGC: { url: "https://metalensvgc.pages.dev/", store: (t) => ({ "metalens.prefs": JSON.stringify({ theme: t }), "metalens.howtoDismissed": "1" }), prep: async (p) => { await p.waitForLoadState("networkidle"); await p.getByRole("link", { name: "Archetypes" }).first().click(); await p.waitForTimeout(3000); await p.addStyleTag({ content: "section:has(#h-teammates){display:none!important}" }); await p.evaluate(() => document.getElementById("h-archetypes")?.scrollIntoView()); await p.waitForTimeout(2500); } },
  "safe-regex": { url: "https://vincentwesley.github.io/safe-regex/", prep: async (p) => { await p.getByRole("tab", { name: /race/i }).click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(6000); } },
  "glass-compiler": { url: "https://vincentwesley.github.io/glass-compiler/", store: (t) => ({ "glass-theme": t }), prep: async (p) => { await p.getByRole("button", { name: /skip tour/i }).click({ timeout: 4000 }).catch(() => {}); } },
  "sg-time-machine": { url: "https://vincentwesley.github.io/sg-time-machine/", prep: async (p) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(3000); } },
};

async function main() {
  const { chromium } = await import("playwright");
  const sharp = (await import("sharp")).default;
  mkdirSync(OUT, { recursive: true });
  const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(TARGETS);
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
  for (const name of names) {
    const { url, prep, store = (t) => ({ theme: t }) } = TARGETS[name];
    for (const theme of ["dark", "light"]) {
      const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1, colorScheme: theme });
      await ctx.addInitScript((kv) => { try { for (const k in kv) localStorage.setItem(k, kv[k]); } catch {} }, store(theme));
      const p = await ctx.newPage();
      await p.goto(url, { waitUntil: "load" });
      await p.waitForTimeout(SETTLE);
      await prep?.(p, theme);
      await p.waitForTimeout(500);
      const png = await p.screenshot({ type: "png" });
      await sharp(png).webp({ quality: 75 }).toFile(resolve(OUT, `${name}-${theme}.webp`));
      console.log(`${name}-${theme}`);
      await ctx.close();
    }
  }
  await browser.close();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
