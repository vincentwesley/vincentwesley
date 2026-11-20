> Update at the end of any session that changed state. Keep it lean.

Continue work on the **GitHub profile** (repo `vincentwesley/vincentwesley`, folder `vincentwesley-profile`, shows at github.com/vincentwesley once the repo is public).
Handover 2026-11-20. The rebuild is done and pushed to main. Tests pass (14), two builds in a row are byte-identical, and the pre-public check passes. The repo is still **private** until the owner flips it.

## Before anything
1. `git pull`. The weekly Action commits `chore: refresh profile data [skip ci]`.
2. Read `docs/DECISIONS.md` (P1–P17) and skim `docs/RESEARCH.md`.
3. Never edit `assets/brand/*`. They are byte-exact copies of `_house/brand/svg`, all rights reserved (`NOTICE.md`).

## How to work here
- `npm test` runs unit tests. `node scripts/build.mjs` regenerates `assets/` and the README GEN blocks. It needs `GITHUB_TOKEN` (set it to `gh auth token`, never print it), or it falls back to unauthenticated calls at 60/h.
- `node scripts/qa.mjs` renders through GitHub's markdown API and saves headless screenshots to `qa-output/{dark,light}-{1280,375}.png`. Add `--links` to check links.
- Art lives in `scripts/art/*.mjs`. Each module can preview itself (`node scripts/art/header.mjs`), and `social.mjs` renders `assets/social/*.png`.
- Copy and featured choices live in `scripts/projects.mjs`. Live data comes from DevPulse `/api/projects` and the GitHub REST API.
- All text in the SVGs is outlined to paths, so no fonts load at view time. Static frames are the final state, which covers reduced motion.
- `.gitattributes` forces LF. Keep it, or the embedded logo bytes drift between machines.
- Workflow `build-profile.yml` runs on Mondays, on manual dispatch, and on pushes to `scripts/**`. Actions are free once the repo is public.

## Current state
- Sections: animated night-garden header (logo, cabin, fireflies), buttons, 4 featured cards (Black Hole, SDF Forge, MetaLens VGC, safe-regex), "More from the atelier", workbench, tools, firefly jar, credits card.
- Repo descriptions, topics and homepages are set on 16 public repos (`docs/repo-surface.md`).
- The 6 social previews are in `assets/social/`, waiting for the owner to upload them.

## Known gaps / ideas
1. DevPulse currently has no screenshot for sdf-forge or safe-regex, so the committed shots are kept (fail safe). Once DevPulse shoots them again, the next build picks them up.
2. Card body text is about 9–10px at 375px; the titles and the real links under each card carry mobile.
3. llm-microscope belongs in the pins and featured cards once its Pages site is deployed.
4. The URL allow-list accepts any `*.pages.dev`. It could be narrowed to exact hosts.
5. On github.com, check that the `<picture>` swap follows the GitHub theme. The GitHub mobile app may always show the light variant.

Report outcomes only. Owner steps go last.
