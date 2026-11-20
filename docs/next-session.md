> Update at the end of any session that changed state. Keep it lean.

Continue work on the **GitHub profile** (repo `vincentwesley/vincentwesley`, folder `vincentwesley-profile`, shows at github.com/vincentwesley once the repo is public).
Handover 2026-11-20. The rebuild is done and pushed to main. Tests pass (14), two builds in a row are byte-identical, and the pre-public check passes. The repo is **public** and the profile renders live; the dark/light swap is verified on github.com.
Profile fields (owner's choice): name `Vincent Wesley`, bio `Software Engineer`, no company, location `Singapore`, website `https://vwesley.dev`.

## Before anything
1. `git pull`. The weekly Action commits `chore: refresh profile data [skip ci]`.
2. Read `docs/DECISIONS.md` (P1–P25) and skim `docs/RESEARCH.md`.
3. Never edit `assets/brand/*`. They are byte-exact copies of `_house/brand/svg`, all rights reserved (`NOTICE.md`).

## How to work here
- `npm test` runs unit tests. `node scripts/build.mjs` regenerates `assets/intro-*.svg`, `assets/site-*.svg`, `assets/tiles/*.svg`, and the README GEN blocks (intro, now, built, also). It only calls DevPulse (live/up, links), so it needs no token. Tile screenshots are committed captures, not downloaded.
- **Refresh screenshots** (manual, local, never CI): `node scripts/art/capture.mjs [name ...]` captures each project's live site in dark and light at 1600x900 into `assets/shots-src/<name>-{dark,light}.webp` (per-site theme keys and dialog dismissals are in its `TARGETS`; Black Hole's scene is dark by nature, only its UI turns light). Then run `node scripts/build.mjs`.
- `node scripts/qa.mjs` renders through GitHub's markdown API (needs `gh` auth) and saves headless screenshots to `qa-output/{dark,light}-{1280,375}.png`. Add `--links` to check links.
- Art lives in `scripts/art/*.mjs`: `intro.mjs` (banner, previews itself), `tile.mjs` (gallery tile), `site.mjs` (vwesley.dev brand card) and `social.mjs` (renders `assets/social/*.png` from `assets/shots-src`; not part of the build; uses the dark captures).
- Project copy lives in `scripts/projects.mjs`. Live data comes from DevPulse `/api/projects`.
- All text in the SVGs is outlined to paths, so no fonts load at view time. Static frames are the final state, which covers reduced motion.
- `.gitattributes` forces LF. Keep it, or the embedded logo bytes drift between machines.
- Workflow `build-profile.yml` runs on Mondays, on manual dispatch, and on pushes to `scripts/**`. Actions are free once the repo is public.

## Current state
- Sections (P23): credits-card banner, nav row (6 links), two-line intro, generated "Now" line (GEN:now), "My website" (GEN:site, brand card `art/site.mjs`: logo morph played once, long form when static), "Things I’ve built" (the 6 pinned projects, 3 rows x 2 tiles with a Live pill), an "Also:" line, centred Atelier logo + small print.
- Repo descriptions, topics and homepages are set on 16 public repos (`docs/repo-surface.md`).
- The 6 social previews are in `assets/social/`, waiting for the owner to upload them.

## Known gaps / ideas
1. llm-microscope belongs in the pins and list once its Pages site is deployed (add to `PROJECTS`; add its host to the allow-list in `build.mjs`).
2. The GitHub mobile app may always show the light variant (unverified).
3. The committed `assets/social/*.png` predate the new captures; rerun `node scripts/art/social.mjs` if the owner wants them refreshed.

Report outcomes only. Owner steps go last.
