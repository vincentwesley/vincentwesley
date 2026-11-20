// Manual refresh of the vwesley.dev tile screenshot: `node scripts/art/capture-site.mjs [top|projects|mid]`. Never run in CI.
// Writes assets/shots-src/vwesley.webp (1600x900 dark capture) and, for comparing variants, qa-output/vwesley-<variant>.webp.
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const URL_ = "https://vwesley.dev";

async function capture(variant) {
  const { chromium } = await import("playwright");
  const sharp = (await import("sharp")).default;
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1, colorScheme: "dark", reducedMotion: "no-preference" });
    const page = await ctx.newPage();
    await page.goto(URL_, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /^(accept|reject|dismiss|close|got it)/i }).first().click({ timeout: 1000 }).catch(() => {});
    if (variant !== "top") {
      const y = variant === "projects"
        ? await page.evaluate(() => document.querySelector("#projects, #work, [id*=project]")?.getBoundingClientRect().top + scrollY || innerHeight)
        : 700;
      await page.evaluate((v) => scrollTo(0, v), Math.max(0, y - 40));
    }
    await page.waitForTimeout(3000);
    return sharp(await page.screenshot({ type: "png" })).webp({ quality: 75 }).toBuffer();
  } finally { await browser.close(); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { writeFileSync } = await import("node:fs");
  const variants = process.argv[2] ? [process.argv[2]] : ["top", "mid", "projects"];
  mkdirSync(resolve(ROOT, "qa-output"), { recursive: true });
  for (const v of variants) {
    const buf = await capture(v);
    writeFileSync(resolve(ROOT, `qa-output/vwesley-${v}.webp`), buf);
    if (process.argv[2]) writeFileSync(resolve(ROOT, "assets/shots-src/vwesley.webp"), buf);
  }
  console.log("captured:", variants.join(", "));
}
