// Rewrites the PROJECTS block in README.md from the portfolio feed. Any failure or empty list leaves the file untouched.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FEED = "https://vwesley.dev/projects.json";
const START = "<!-- PROJECTS:START -->";
const END = "<!-- PROJECTS:END -->";

/** Accepts an array or {projects:[...]}; drops PLACEHOLDER titles, keeps entries with a string title and an https url. */
export function parseFeed(data) {
  const list = Array.isArray(data) ? data : data?.projects;
  if (!Array.isArray(list)) return [];
  return list.filter((p) => p && typeof p.title === "string" && p.title.trim() && !/^placeholder\b/i.test(p.title.trim()) && typeof p.url === "string" && /^https:\/\//.test(p.url));
}

export function renderList(items) {
  const esc = (t) => t.replace(/[\[\]\<>`*_]/g, "\$&").replace(/\s+/g, " ").trim();
  return items.map((p) => `- [${esc(p.title)}](${new URL(p.url).href})`).join("\n");
}

/** Returns the new text, or null if the markers are missing. */
export function replaceBlock(text, list) {
  const a = text.indexOf(START), b = text.indexOf(END);
  if (a < 0 || b < a) return null;
  return `${text.slice(0, a + START.length)}\n${list}\n${text.slice(b)}`;
}

async function main() {
  const readme = new URL("../README.md", import.meta.url);
  try {
    const res = await fetch(FEED, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = parseFeed(await res.json());
    if (!items.length) throw new Error("empty or invalid feed");
    const text = readFileSync(readme, "utf8");
    const next = replaceBlock(text, renderList(items));
    if (next === null) throw new Error("markers not found");
    if (next !== text) writeFileSync(readme, next);
  } catch (e) {
    console.log(`No changes: ${e.message}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
