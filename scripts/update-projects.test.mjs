import test from "node:test";
import assert from "node:assert/strict";
import { parseFeed, renderList, replaceBlock } from "./update-projects.mjs";

test("replaceBlock rewrites only the marked block", () => {
  const src = "top\n<!-- PROJECTS:START -->\nold\n<!-- PROJECTS:END -->\nbottom\n";
  const out = replaceBlock(src, "- [A](https://a.dev/)");
  assert.equal(out, "top\n<!-- PROJECTS:START -->\n- [A](https://a.dev/)\n<!-- PROJECTS:END -->\nbottom\n");
  assert.equal(replaceBlock("no markers", "x"), null);
});

test("parseFeed handles array, {projects}, and junk", () => {
  const e = { title: "A", url: "https://a.dev/" };
  assert.deepEqual(parseFeed([e, { title: "PLACEHOLDER Z", url: "https://z.dev/" }, { title: "x" }, { title: "y", url: "javascript:1" }]), [e]);
  assert.deepEqual(parseFeed({ projects: [e] }), [e]);
  assert.deepEqual(parseFeed("nope"), []);
  assert.equal(renderList([e]), "- [A](https://a.dev/)");
});
