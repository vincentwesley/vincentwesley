// Hand-curated copy. Live data (url, uptime, screenshots, dates) comes from DevPulse at build time.
export const OWNER = "vincentwesley";
export const PROFILE_REPO = "vincentwesley";
// Public but still work-in-progress: never promoted on the "workbench" panel (DECISIONS P10).
export const NOT_ON_WORKBENCH = ["pagehold", "little-sql"];

export const FEATURED = [
  { name: "black-hole", title: "Black Hole", line: "Fly around a black hole. Every pixel is traced light.", chips: ["WebGL2", "GLSL", "TypeScript"], shotFile: "assets/shots-src/black-hole.webp" },
  { name: "sdf-forge", title: "SDF Forge", line: "Build 3D shapes from nodes, then 3D-print or take the shader.", chips: ["WebGL2", "GLSL", "Node editor"] },
  {
    name: "MetaLensVGC", title: "MetaLens VGC",
    line: "Pokémon VGC metagame, from real team sheets.",
    shotFile: "assets/shots-src/MetaLensVGC.webp",
    chips: ["Data pipeline", "JavaScript", "Cloudflare Pages"],
    note: "Fan project, not affiliated with Nintendo, Game Freak or The Pokémon Company.",
  },
  { name: "safe-regex", title: "safe-regex", line: "A drop-in RegExp that runs in linear time. No ReDoS.", chips: ["TypeScript", "Automata", "npm"] },
];

export const MORE = [
  { name: "glass-compiler", title: "Glass Compiler", line: "A compiler you can see through: tokens, tree, bytecode and a VM, all linked." },
  { name: "sg-time-machine", title: "SG Time Machine", line: "Singapore’s live open-data feeds, archived by Actions on a time-slider map." },
  { name: "synthwave-drive", title: "Synthwave Drive", line: "An endless neon road that drives to the beat of any song." },
  { name: "koi-pond", title: "Koi Pond", line: "A koi pond that follows your clock and the seasons." },
  { name: "llm-microscope", title: "LLM Microscope", line: "GPT-2 running in your browser, with its attention heads on show." },
  { name: "devpulse", title: "DevPulse", line: "Live health of every project here: CI, uptime, commits." },
  { name: "tldr-panel", title: "TL;DR Panel", line: "One-click private page summaries with Chrome’s on-device AI." },
  { name: "clearslip", title: "Clearslip", line: "A Chrome ad and tracker blocker that shows what it blocked." },
];
