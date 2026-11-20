// Hand-curated copy. Live data (url, up) comes from DevPulse at build time.
export const OWNER = "vincentwesley";

// Gallery order (3 rows of 2). `tag`: tile tagline (<= 34 chars). `focus`: sharp gravity for the 16:9 crop (default centre).
// README list order. `social`, `note` and `shotFile` feed only scripts/art/social.mjs (shots: assets/shots-src, else qa-output/<name>.webp).
export const PROJECTS = [
  // `site: true`: not in DevPulse (its repo is private); always shown, always links to `link`, never a repo.
  { name: "vwesley.dev", site: true, link: "https://vwesley.dev", title: "vwesley.dev", tag: "My site: projects, résumé, contact", line: "my portfolio site, with every project, my résumé and how to reach me", shotFile: "assets/shots-src/vwesley.webp" },
  { name: "black-hole", title: "Black Hole", focus: "south", tag: "Fly around a black hole", line: "fly around a real-time black hole in your browser", shotFile: "assets/shots-src/black-hole.webp", social: { line: "A black hole you can fly around in the browser. Every pixel is a traced ray of light.", chips: ["WebGL2", "GLSL", "Ray tracing"] } },
  { name: "sdf-forge", title: "SDF Forge", tag: "3D shapes from nodes", line: "build 3D shapes from nodes, then 3D-print them", shotFile: "assets/shots-src/sdf-forge.webp", social: { line: "Build 3D shapes in the browser by connecting nodes, then 3D-print them.", chips: ["React", "WebGL", "3D printing"] } },
  {
    name: "MetaLensVGC", title: "MetaLens VGC", tag: "VGC metagame from real data", line: "Pokémon VGC metagame stats from real tournament data",
    shotFile: "assets/shots-src/MetaLensVGC.webp",
    social: { line: "A metagame dashboard for Pokémon Champions VGC, built from real tournament data.", chips: ["Dashboard", "Cross-filter", "VGC 2026"] },
    note: "Fan project, not affiliated with Nintendo, Game Freak or The Pokémon Company.",
  },
  { name: "safe-regex", title: "safe-regex", tag: "A regex engine that can’t hang", line: "a JavaScript regex engine that can’t hang", shotFile: "assets/shots-src/safe-regex.png", social: { line: "A JavaScript-compatible regex engine that runs in linear time, so ReDoS can't happen.", chips: ["TypeScript", "Zero deps", "Linear time"] } },
  { name: "glass-compiler", title: "Glass Compiler", focus: "south", tag: "A compiler you can see through", line: "a compiler you can see through, stage by stage", social: { line: "A compiler you can see through: tokens, syntax tree, bytecode and a stepping VM, all linked.", chips: ["Compiler", "VM", "TypeScript"] } },
];

// One plain text line under the gallery (live link if up, else the repo).
export const MORE = [
  { name: "sg-time-machine", title: "SG Time Machine" },
  { name: "synthwave-drive", title: "Synthwave Drive" },
  { name: "koi-pond", title: "Koi Pond" },
  { name: "llm-microscope", title: "LLM Microscope" },
  { name: "devpulse", title: "DevPulse", line: "a live status board for all my projects" },
  { name: "tldr-panel", title: "TL;DR Panel" },
  { name: "clearslip", title: "Clearslip" },
];
