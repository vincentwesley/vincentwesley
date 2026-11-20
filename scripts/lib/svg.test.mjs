import test from "node:test";
import assert from "node:assert/strict";
import { esc, frame, fireflies, chip, svgDoc } from "./svg.mjs";
import { measure } from "./fonts.mjs";

test("esc escapes markup, quotes and control chars", () => {
  assert.equal(esc("<script>alert('x')</script>"), "&lt;script&gt;alert(&apos;x&apos;)&lt;/script&gt;");
  assert.equal(esc('a"b&c'), "a&quot;b&amp;c");
  assert.equal(esc("a\u0000b\u001fc\u007fd"), "abcd");
  assert.equal(esc(null), "");
});

test("frame has 4 corner studs, ring and square corners", () => {
  const s = frame({ x: 10, y: 10, w: 200, h: 100 });
  assert.equal((s.match(/class="stud"/g) || []).length, 4);
  assert.ok(!s.includes("rx="));
});

test("fireflies are deterministic per seed", () => {
  const a = fireflies({ count: 6, w: 400, h: 200, seed: 7 });
  assert.deepEqual(fireflies({ count: 6, w: 400, h: 200, seed: 7 }), a);
  assert.notDeepEqual(fireflies({ count: 6, w: 400, h: 200, seed: 8 }), a);
  assert.equal((a.body.match(/fill="#eaffb0"/g) || []).length, 6);
});

test("svgDoc outlines text: no <text>, glyph <use>s, no @font-face, title/desc stay text", async () => {
  const body = '<text x="10" y="40" font-family="Inter" font-size="20" fill="#fff" class="a">Hi Hi</text>' +
    "<text x=\"100\" y=\"40\" text-anchor=\"middle\" font-family=\"'Space Grotesk'\" font-weight=\"700\" font-size=\"20\" letter-spacing=\"2\" fill=\"#000\" opacity=\".5\">Vin</text>";
  const svg = await svgDoc({ w: 200, h: 60, title: "T", desc: "D", body, id: "t" });
  assert.ok(!/<text\b/.test(svg));
  assert.match(svg, /<use href="#tg\d+"/);
  assert.ok(!svg.includes("@font-face") && !svg.includes("base64") && !svg.includes("NaN"));
  assert.match(svg, /<g fill="#fff" class="a">/);
  assert.match(svg, /<title id="t-t">T<\/title><desc id="t-d">D<\/desc>/);
  assert.equal(await svgDoc({ w: 200, h: 60, title: "T", desc: "D", body, id: "t" }), svg); // deterministic
  const raw = await svgDoc({ w: 1, h: 1, title: "x", body: '<text x="0" y="9" font-family="Inter" font-size="9">&lt;script&gt;alert(1)&lt;/script&gt;</text>' });
  assert.ok(!raw.includes("<script"));
});

test("measure, chip, reduced-motion kill switch", async () => {
  const w1 = await measure("iii", { family: "Inter", size: 16 });
  const w2 = await measure("WWW", { family: "Inter", size: 16 });
  assert.ok(w2 > w1 && w1 > 0);
  const c = await chip("live", {});
  assert.ok(c.w > 20 && c.svg.includes("LIVE"));
  assert.match(await svgDoc({ w: 1, h: 1, title: "<t>", body: "" }), /prefers-reduced-motion: reduce.*animation:none!important/);
});
