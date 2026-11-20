// Shared dev-only preview harness for the art modules' `if main` blocks. Playwright is imported lazily,
// so build and test never load it. Everything lands in qa-output/ (gitignored).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const abs = (...p) => resolve(root, ...p);
export const url = (...p) => pathToFileURL(abs(...p)).href;
const QA = abs("qa-output");

/** Launch headless Chromium, run fn(browser), always close. */
export async function browse(fn) {
  mkdirSync(QA, { recursive: true });
  const { chromium } = await import("playwright");
  const b = await chromium.launch();
  try { return await fn(b); } finally { await b.close(); }
}

/** Screenshots of assets/<name>.svg via <img> on #0d1117 (…-dark) or #ffffff (…-light) -> qa-output/<name>.png */
export const shoot = (names, width = 960) => browse(async (b) => {
  const p = await b.newPage({ viewport: { width: width + 40, height: 400 } });
  for (const n of names) {
    const bg = n.endsWith("dark") ? "#0d1117" : "#ffffff";
    const svg = "data:image/svg+xml;base64," + readFileSync(abs(`assets/${n}.svg`)).toString("base64");
    await p.setContent(`<body style="margin:20px;background:${bg}"><img src="${svg}" style="display:block;width:${width}px">`);
    await p.waitForTimeout(200);
    await p.screenshot({ path: abs(`qa-output/${n}.png`), fullPage: true });
  }
});

/** Write assets/<name>-{dark,light}.svg from gen(t), a preview sheet (desktop + phone width, both themes) and screenshots:
 *  <name>-default.png (motion on, after `wait` ms) and <name>-reduced.png (svg loaded top-level: <img> ignores reducedMotion). */
export async function sheet(name, gen, { width, vw, wait = 1500 }) {
  mkdirSync(abs("assets"), { recursive: true });
  for (const t of ["dark", "light"]) {
    const s = await gen(t);
    writeFileSync(abs(`assets/${name}-${t}.svg`), s);
    console.log(`${name}-${t}.svg ${Buffer.byteLength(s)} bytes`);
  }
  const cell = (t, bg) => `<div style="background:${bg};padding:24px"><img src="../assets/${name}-${t}.svg" style="width:${width}px"> <img src="../assets/${name}-${t}.svg" style="width:343px"></div>`;
  mkdirSync(QA, { recursive: true });
  writeFileSync(abs(`qa-output/${name}-preview.html`), `<!doctype html><meta charset="utf-8"><body style="margin:0">${cell("dark", "#0d1117")}${cell("light", "#fff")}`);
  await browse(async (b) => {
    const p = await (await b.newContext({ viewport: { width: vw, height: 800 }, reducedMotion: "no-preference" })).newPage();
    await p.goto(url(`qa-output/${name}-preview.html`)); await p.waitForTimeout(wait);
    await p.screenshot({ path: abs(`qa-output/${name}-default.png`), fullPage: true });
    const rp = await (await b.newContext({ viewport: { width: vw, height: 800 }, reducedMotion: "reduce" })).newPage();
    await rp.goto(url(`assets/${name}-dark.svg`)); await rp.waitForTimeout(300);
    await rp.screenshot({ path: abs(`qa-output/${name}-reduced.png`), fullPage: true });
  });
}
