# Decisions

Newest at the bottom. Each entry is the decision, then the reason.

**P1. The profile is rebuilt from scratch as the front door of Vin's Atelier.**
The old README was a 5-link list. Nothing from it is worth keeping.

**P2. The README is dark-first, uses `<picture>` per image, and the fallback `<img>` is the dark variant.**
The house default is dark. Every SVG paints its own background, so the fallback still reads on GitHub light.

**P3. Every image is a self-contained SVG: inline `<style>`, base64 woff2 subsets, and data-URI images.**
SVG loaded as an image can't fetch anything (RESEARCH §3–4). Subsetting keeps each font to a few KB.

**P4. The logo is embedded as a nested `<image href="data:image/svg+xml;base64,…">` of the untouched `_house/brand/svg` file.**
This keeps the logo byte-exact: never recoloured or redrawn. It also avoids the generic `SVGID_*` gradient-id clash. The variants are `name-b` and `atelier-b` on dark, and `name-a` and `atelier-a` on light. The avatar is `mark-b` on `#11150e`.

**P5. Logo licence in a public repo.**
`_house/brand/PROVENANCE.md` allows the logo in Vin's Atelier projects, all rights reserved. It requires the artist credit and never the `.ai`/`.pdf` source files. So `assets/brand/` is excluded from MIT in `NOTICE.md`, generated SVGs that embed it inherit that restriction, and the README credits Portus Workstation (@portus_workstation / @wason25_pz). `source/` is never copied.

**P6. No third-party runtime image hosts, and that includes DevPulse's `/card` and `/shot` URLs.**
Those URLs are our own, but they would put a live dependency and a Camo fetch on every view. The workflow downloads the data and screenshots and commits static files instead.

**P7. Data comes from DevPulse `/api/projects` (uptime, live URL, screenshot, commits) plus the GitHub REST API (public repos, recent commits).**
Both are real and already aggregated. Only public repos ever appear.

**P8. The weekly schedule is re-enabled, alongside `workflow_dispatch` and push-on-`scripts/**`.**
The data is now real (DevPulse), not placeholders. The owner explicitly asked for the workflow. Actions are free on a public repo. Output is deterministic, so unchanged data makes no commit.

**P9. Featured cards: black-hole, sdf-forge, MetaLensVGC, safe-regex.**
Each is live with 100% 30-day uptime, polished, and visually or technically striking. Together they cover graphics, tools, data and security.

**P10. "More from the atelier" lists glass-compiler, sg-time-machine, synthwave-drive, koi-pond, devpulse and the Chrome extensions.**
These are real, public projects that are either live or released. Pagehold ("coming soon") and little-sql (a stub) are left out until they're finished.

**P11. Pins, in order: black-hole, sdf-forge, MetaLensVGC, safe-regex, glass-compiler, sg-time-machine.**
Skimmers read pins first (RESEARCH §7). This order leads with the strongest visual and ends with data. llm-microscope would qualify, but its Pages site is down.

**P12. No star counts or contribution-streak cards.**
Every repo has 0 stars, so the numbers would undersell the work. Uptime, live-site count and commits are real and flattering.

**P13. Fandom stays off the profile, apart from MetaLens VGC.**
MetaLens is an engineering showcase (a data pipeline and a dashboard), so it stays, with a one-line non-affiliation note.

**P15. Repo surface.**
- Every public repo that gets promoted carries a plain one-sentence description in the house voice, a homepage set to its live URL when one exists, and 4–7 accurate topics. I set these with `gh repo edit`, which is allowed.
- Pagehold and little-sql are left as they are, because they aren't finished.
- Existing good descriptions stay as they are.
- The exact values are in `docs/repo-surface.md`.

**P16. Social previews.**
- Each pinned repo gets a 1280×640 house-style PNG under 1 MB: the screenshot, the title, a one-line description and the `mark-b` logo.
- They live in `assets/social/`.
- They're uploaded by hand, because GitHub has no API for this.

**P17. Profile fields.**
- The gh token has no `user` scope, so the name, bio, location and website are owner steps.
- The values are in `docs/next-session.md`. The owner chose to keep the legal name `Vincent Wesley` as the display name, with the bio `Software Engineer` and no company field (2026-11-20). That overrides the "Vin" suggestion.

**P14. Email.**
The approved public address belongs to the personal side, so there's no email button. Contact goes through vwesley.dev.

**P18. Redesign for clarity (owner feedback 2026-11-20): intro card replaces the header; simpler image-first project cards with text in markdown; workbench and jar collapsed; footer credits.**
The credits-card look now introduces Vin. Each featured card is a screenshot with a title band and a Live pill, with the description and links as real text underneath. This supersedes the P9 card style (chips, copy and uptime inside the image); the P9 project choice stands.

**P19. Minimal redesign (owner, 2026-11-20): the earlier card and panel layout felt busy. Now one calm banner, plain text and a link list; pins carry the visuals. Supersedes P9, P10 and P18 layout parts.**
The README is the banner, one sentence, one h3 with eight links and a footer. Only DevPulse is fetched (live URL and up). The URL allow-list is exact hosts.
