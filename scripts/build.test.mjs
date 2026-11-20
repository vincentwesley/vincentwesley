import { test } from "node:test";
import assert from "node:assert/strict";
import { mdEsc, safeUrl, replaceBlock, parseProjects, pickNow } from "./build.mjs";
import intro from "./art/intro.mjs";
import tile from "./art/tile.mjs";

test("mdEsc escapes markdown metacharacters", () => {
  assert.equal(mdEsc("a[b](c)<d>`e`*f*_g_|h"), "a\\[b\\]\\(c\\)\\<d\\>\\`e\\`\\*f\\*\\_g\\_\\|h");
});

test("safeUrl allow-list", () => {
  assert.ok(safeUrl("https://vincentwesley.github.io/black-hole/"));
  assert.ok(safeUrl("https://metalensvgc.pages.dev"));
  assert.ok(safeUrl("https://devpulse.vwesley.workers.dev/x"));
  assert.ok(safeUrl("https://github.com/vincentwesley/a"));
  assert.equal(safeUrl("https://other.pages.dev"), null);
  assert.equal(safeUrl("https://x.vwesley.workers.dev"), null);
  assert.equal(safeUrl("http://vwesley.dev"), null);
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("https://evil.example/pages.dev"), null);
  assert.equal(safeUrl("https://vwesley.dev.evil.com/"), null);
  assert.equal(safeUrl("https://user:pw@vwesley.dev/"), null);
  assert.equal(safeUrl("not a url"), null);
});

test("replaceBlock fail-safe", () => {
  assert.equal(replaceBlock("no markers", "x", "y"), null);
  assert.equal(replaceBlock("<!-- GEN:x:END -->\n<!-- GEN:x:START -->", "x", "y"), null);
  assert.equal(replaceBlock("a\n<!-- GEN:x:START -->\nold\n<!-- GEN:x:END -->\nb", "x", "new"), "a\n<!-- GEN:x:START -->\nnew\n<!-- GEN:x:END -->\nb");
});

test("parseProjects: junk gives empty, bad entries dropped", () => {
  for (const j of [null, undefined, "x", 5, {}, [], [null, 1, "a", {}], [{ name: "../x", repo: "vincentwesley/../x" }]]) assert.deepEqual(parseProjects(j), []);
  const ok = parseProjects([
    { name: "b", repo: "vincentwesley/b", url: "http://x.com", up: true },
    { name: "a", repo: "other/a" },
    { name: "c", repo: "vincentwesley/c", url: "https://metalensvgc.pages.dev", up: "yes" },
  ]);
  assert.deepEqual(ok.map((p) => p.name), ["b", "c"]);
  assert.equal(ok[0].url, null);
  assert.equal(ok[1].up, false);
});

// Text is outlined, so no <text>/@font-face may remain, only glyph <use>s.
test("intro renders in both themes with outlined text, deterministically", async () => {
  for (const t of ["dark", "light"]) {
    const svg = await intro(t);
    assert.ok(!/<text\b/.test(svg), `${t}: <text> left`);
    assert.ok(!svg.includes("@font-face"), `${t}: @font-face left`);
    assert.ok((svg.match(/<use href="#/g) || []).length >= 40, `${t}: too few glyph <use>s`);
    assert.equal(await intro(t), svg);
  }
});

test("tile renders in both themes with outlined text and escapes junk", async () => {
  const shotHref = "data:image/webp;base64,AAAA";
  for (const t of ["dark", "light"]) {
    const svg = await tile(t, { title: "<script>alert(1)</script> & \"x\"", tag: "A tagline", up: true, shotHref });
    assert.ok(!/<text\b/.test(svg) && !svg.includes("@font-face") && !svg.includes("<script"), `${t}: text not outlined or junk unescaped`);
    assert.ok((svg.match(/<use href="#/g) || []).length >= 10, `${t}: too few glyph <use>s`);
    assert.equal((svg.match(/class="stud"/g) || []).length, 6);
    assert.equal(await tile(t, { title: "<script>alert(1)</script> & \"x\"", tag: "A tagline", up: true, shotHref }), svg);
  }
});

test("pickNow: most recent push wins; unlisted and archived repos are ignored", () => {
  const by = new Map(Object.entries({
    a: { pushed: Date.parse("2026-11-18T00:00:00Z") },
    b: { pushed: Date.parse("2026-11-19T00:00:00Z") },
    old: { pushed: Date.parse("2026-11-01T00:00:00Z") },
    arch: { pushed: Date.parse("2026-11-21T00:00:00Z"), archived: true },
    "vincentwesley": { pushed: Date.parse("2026-11-22T00:00:00Z") },
  }).map(([name, v]) => [name, { name, ...v }]));
  assert.equal(pickNow(by, [{ name: "a" }, { name: "b" }, { name: "old" }, { name: "arch" }, { name: "missing" }]).name, "b");
  assert.equal(pickNow(by, [{ name: "old" }, { name: "a" }]).name, "a");
  assert.equal(pickNow(by, [{ name: "arch" }, { name: "missing" }]), null);
  assert.equal(parseProjects([{ name: "x", repo: "vincentwesley/x", pushedAt: "2026-11-20T00:00:00Z" }])[0].pushed, Date.parse("2026-11-20T00:00:00Z"));
  assert.equal(parseProjects([{ name: "x", repo: "vincentwesley/x", pushedAt: "junk" }])[0].pushed, 0);
});
