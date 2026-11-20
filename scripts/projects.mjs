// Hand-curated copy. Live data (url, up) comes from DevPulse at build time.
export const OWNER = "vincentwesley";

// README list order. `social`, `note` and `shotFile` feed only scripts/art/social.mjs (shots: assets/shots-src, else qa-output/<name>.webp).
export const PROJECTS = [
  { name: "black-hole", title: "Black Hole", line: "fly around a real-time black hole in your browser", shotFile: "assets/shots-src/black-hole.webp", social: { line: "A black hole you can fly around in the browser. Every pixel is a traced ray of light.", chips: ["WebGL2", "GLSL", "Ray tracing"] } },
  { name: "sdf-forge", title: "SDF Forge", line: "build 3D shapes from nodes, then 3D-print them", shotFile: "assets/shots-src/sdf-forge.webp", social: { line: "Build 3D shapes in the browser by connecting nodes, then 3D-print them.", chips: ["React", "WebGL", "3D printing"] } },
  {
    name: "MetaLensVGC", title: "MetaLens VGC", line: "Pokémon VGC metagame stats from real tournament data",
    shotFile: "assets/shots-src/MetaLensVGC.webp",
    social: { line: "A metagame dashboard for Pokémon Champions VGC, built from real tournament data.", chips: ["Dashboard", "Cross-filter", "VGC 2026"] },
    note: "Fan project, not affiliated with Nintendo, Game Freak or The Pokémon Company.",
  },
  { name: "safe-regex", title: "safe-regex", line: "a JavaScript regex engine that can’t hang", shotFile: "assets/shots-src/safe-regex.png", social: { line: "A JavaScript-compatible regex engine that runs in linear time, so ReDoS can't happen.", chips: ["TypeScript", "Zero deps", "Linear time"] } },
  { name: "glass-compiler", title: "Glass Compiler", line: "a compiler you can see through, stage by stage", social: { line: "A compiler you can see through: tokens, syntax tree, bytecode and a stepping VM, all linked.", chips: ["Compiler", "VM", "TypeScript"] } },
  { name: "sg-time-machine", title: "SG Time Machine", line: "Singapore’s live open data, archived on a time slider", social: { line: "A growing archive of Singapore's live open-data feeds, browsable on a time-slider map.", chips: ["Open data", "MapLibre", "Singapore"] } },
  { name: "synthwave-drive", title: "Synthwave Drive", line: "an endless neon road that drives to the beat of your music" },
  { name: "koi-pond", title: "Koi Pond", line: "a koi pond that follows your clock and the seasons" },
];
