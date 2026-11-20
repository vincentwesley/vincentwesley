import { test } from "node:test";
import assert from "node:assert/strict";
import { mdEsc, safeUrl, cleanSubject, relWeek, replaceBlock, parseProjects, footerText } from "./build.mjs";
import card from "./art/cards.mjs";
import workbench from "./art/workbench.mjs";
import { embedImage } from "./lib/svg.mjs";

const NOW = Date.parse("2026-11-20T00:00:00Z");
const EVIL = '<script>alert(1)</script>"&';

test("mdEsc escapes markdown metacharacters", () => {
  assert.equal(mdEsc("a[b](c)<d>`e`*f*_g_|h"), "a\\[b\\]\\(c\\)\\<d\\>\\`e\\`\\*f\\*\\_g\\_\\|h");
});

test("safeUrl allow-list", () => {
  assert.ok(safeUrl("https://vincentwesley.github.io/black-hole/"));
  assert.ok(safeUrl("https://metalensvgc.pages.dev"));
  assert.ok(safeUrl("https://devpulse.vwesley.workers.dev/x"));
  assert.ok(safeUrl("https://github.com/vincentwesley/a"));
  assert.equal(safeUrl("http://vwesley.dev"), null);
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("https://evil.example/pages.dev"), null);
  assert.equal(safeUrl("https://vwesley.dev.evil.com/"), null);
  assert.equal(safeUrl("https://user:pw@vwesley.dev/"), null);
  assert.equal(safeUrl("not a url"), null);
});

test("cleanSubject", () => {
  assert.equal(cleanSubject("fix: thing [skip ci]\n\nCo-Authored-By: X <x@y>"), "Thing");
  assert.equal(cleanSubject("chore(house)!: sync kit"), "Sync kit");
  assert.equal(cleanSubject("Note: keep me"), "Keep me"); // ponytail: any "word:" prefix is dropped; fine for commit subjects
  assert.equal(cleanSubject("a Co-Authored-By: Claude"), "A");
  assert.equal(cleanSubject(""), "Update");
  const long = cleanSubject("x".repeat(100));
  assert.equal([...long].length, 64);
  assert.ok(long.endsWith("…"));
});

test("relWeek buckets", () => {
  const ago = (d) => new Date(NOW - d * 864e5).toISOString();
  assert.equal(relWeek(ago(0), NOW), "this week");
  assert.equal(relWeek(ago(6), NOW), "this week");
  assert.equal(relWeek(ago(7), NOW), "last week");
  assert.equal(relWeek(ago(15), NOW), "2 weeks ago");
  assert.equal(relWeek("junk", NOW), "recently");
});

test("replaceBlock fail-safe", () => {
  assert.equal(replaceBlock("no markers", "x", "y"), null);
  assert.equal(replaceBlock("<!-- GEN:x:END -->\n<!-- GEN:x:START -->", "x", "y"), null);
  assert.equal(replaceBlock("a\n<!-- GEN:x:START -->\nold\n<!-- GEN:x:END -->\nb", "x", "new"), "a\n<!-- GEN:x:START -->\nnew\n<!-- GEN:x:END -->\nb");
});

test("parseProjects: junk gives empty, bad entries dropped", () => {
  for (const j of [null, undefined, "x", 5, {}, [], [null, 1, "a", {}], [{ name: "../x", repo: "vincentwesley/../x" }]]) assert.deepEqual(parseProjects(j), []);
  const ok = parseProjects([
    { name: "b", repo: "vincentwesley/b", url: "http://x.com", up: true, uptime30d: 100, shot: "/shot/b.jpg?v=1", pushedAt: "2026-11-01T00:00:00Z", commitCount: 10 },
    { name: "a", repo: "other/a" },
    { name: "c", repo: "vincentwesley/c", url: "https://c.pages.dev", up: "yes", uptime30d: 500, shot: "https://evil/x.jpg" },
  ]);
  assert.deepEqual(ok.map((p) => p.name), ["b", "c"]);
  assert.equal(ok[0].url, null);
  assert.equal(ok[1].up, false);
  assert.equal(ok[1].uptime30d, null);
  assert.equal(ok[1].shot, null);
  assert.equal(footerText(ok), "1 sites live and up. 0+ commits across 2 public repos.");
});

const rows = [
  { repo: "black-hole", week: "this week", subject: EVIL },
  { repo: "sdf-forge", week: "last week", subject: "Add a thing" },
  { repo: "koi-pond", week: "2 weeks ago", subject: "Tune the fish" },
];

test("workbench is deterministic and escapes data", async () => {
  const d = { rows, footer: "10 sites live and up. 600+ commits across 18 public repos." };
  const a = await workbench("dark", d), b = await workbench("dark", d);
  assert.equal(a, b);
  assert.ok(!a.includes("<script"));
  assert.ok(a.includes("&lt;script&gt;"));
  assert.ok(Buffer.byteLength(a) < 40 * 1024);
});

test("card escapes data and shows live status", async () => {
  const shotHref = embedImage(new URL("../assets/brand/creator.webp", import.meta.url), "image/webp");
  const base = { title: EVIL, line: EVIL, chips: [EVIL, "TypeScript"], up: true, uptime30d: 99.94, shotHref };
  const svg = await card("light", base);
  assert.ok(!svg.includes("<script"));
  assert.ok(svg.includes('class="pulse"')); // status row present (its text is outlined)
  assert.ok(!(await card("dark", { ...base, up: false })).includes('class="pulse"'));
});

// Regression: light cards/workbench once rendered with no text (late-decoded embedded fonts). Text is now
// outlined, so there must be no <text>/@font-face left, only glyph <use>s.
function assertOutlined(svg, label) {
  assert.ok(!/<text\b/.test(svg), `${label}: <text> left`);
  assert.ok(!svg.includes("@font-face"), `${label}: @font-face left`);
  assert.ok((svg.match(/<use href="#/g) || []).length >= 20, `${label}: too few glyph <use>s`);
}

test("cards and workbench outline their text in both themes", async () => {
  const shotHref = embedImage(new URL("../assets/brand/creator.webp", import.meta.url), "image/webp");
  const d = { title: "MetaLens VGC", line: "Competitive Pokémon metagame, from real sheets.", chips: ["Data pipeline", "npm"], up: true, uptime30d: 100, shotHref };
  const wb = { rows, footer: "10 sites live and up. 600+ commits across 18 public repos." };
  for (const t of ["dark", "light"]) {
    assertOutlined(await card(t, d), `card ${t}`);
    assertOutlined(await workbench(t, wb), `workbench ${t}`);
  }
});
