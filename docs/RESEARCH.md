# Research: GitHub profile README (2026-11-20)

Sources are linked inline. Some points are marked **unverified**. I checked those on our own render: in headless Chromium for M1 and M4 (see DECISIONS), and on github.com once the repo is public.

## 1. Memorable profiles and why they work
- [jh3y/jh3y](https://github.com/jh3y/jh3y): a single spinning SVG gem that links to the author's site. The restraint is what makes it work.
- [BrunnerLivio/BrunnerLivio](https://github.com/BrunnerLivio/BrunnerLivio): a full early-2000s homepage pastiche. It works because it commits to one concept all the way.
- [timburgan/timburgan](https://github.com/timburgan/timburgan): a community chess game where moves are issue links. It's interactive with no JS.
- [Thaiane/Thaiane](https://github.com/Thaiane/Thaiane): the bio is written as a JS object, so the concept carries into the copy.
- [innng/innng](https://github.com/innng/innng): a typing-text banner with a short personal bio.
- [sindresorhus/sindresorhus](https://github.com/sindresorhus/sindresorhus): stacked visuals and badge rows.
- [abhisheknaiidu/abhisheknaiidu](https://github.com/abhisheknaiidu/abhisheknaiidu): a README that Actions updates automatically.
- [anuraghazra/anuraghazra](https://github.com/anuraghazra/anuraghazra) and [DenverCoder1/DenverCoder1](https://github.com/DenverCoder1/DenverCoder1): live stats cards from third-party hosts. We don't do this.
- Index: [awesome-github-profile-readme](https://github.com/abhisheknaiidu/awesome-github-profile-readme).

**Patterns:**
- One animated hero, not many.
- One concept carried through the headline, bio and images.
- Interaction through real links.
- Content updated automatically by Actions.
- A personal voice.
- Light and dark images via `<picture>`.
- Restraint with emoji and GIFs ([TechInterview](https://www.techinterview.org/post/3233474626/github-profile-engineers/)).

## 2. Renderer and sanitizer
- `<picture>` + `<source media="(prefers-color-scheme: dark)">` + a fallback `<img>` is the documented pattern ([GitHub Blog](https://github.blog/developer-skills/github/how-to-make-your-images-in-markdown-on-github-adjust-for-dark-mode-and-light-mode/); [GA 2022-08-15](https://github.blog/changelog/2022-08-15-specify-theme-context-for-images-in-markdown-ga)).
- `#gh-dark-mode-only` / `#gh-light-mode-only` are deprecated in favour of `<picture>` ([Stefan Judis](https://www.stefanjudis.com/blog/how-to-define-dark-light-mode-images-in-github-markdown)).
- The sanitizer is html-pipeline ([rubydoc](https://www.rubydoc.info/gems/html-pipeline)). `align`, `width`, `height`, `details`/`summary` survive in practice. `style`, `class` and `script` are stripped. GitHub publishes no allow-list ([docs](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)). Our QA renders through `gh api markdown`, which is GitHub's own renderer, so the sanitizer output is real.
- **Unverified:** whether the GitHub theme setting drives the `<picture>` media query, and whether the mobile apps always report light. That's why the fallback `<img>` must read on both themes.

## 3. Animated SVG via `<img>`
- CSS `@keyframes` and SMIL inside the SVG both run when the SVG is loaded as an image ([DEV](https://dev.to/sieis/animate-svgs-for-github-readmes-420d); [Frontend Masters](https://frontendmasters.com/blog/replace-your-animated-gifs-with-svgs/)).
- An SVG loaded as an image is opaque. It can't load external resources, run scripts or respond to hover. Use data URLs for anything it embeds ([MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_Image)).
- `prefers-reduced-motion` is widely supported ([web.dev](https://web.dev/articles/prefers-reduced-motion)). Inside an SVG image, Safari has a related bug ([WebKit 283894](https://bugs.webkit.org/show_bug.cgi?id=283894)). So the static frame (t = 0) must look complete on its own.
- Camo proxies external images ([docs](https://help.github.com/articles/about-anonymized-image-urls)). SVG content-type rules came out of a 2014 XSS ([bounty](https://bounty.github.com/2014/02/01/camo-content-type-xss.html)). Relative repo images are served from GitHub's own raw host. The cache is busted by changing the URL (`?v=`).
- Size: GitHub's image cap is around 10 MB ([attaching files](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)). Our budget is far below that (see DECISIONS).

## 4. Fonts inside SVG
- An SVG loaded as an image can't fetch web fonts ([W3C list](https://lists.w3.org/Archives/Public/public-css-archive/2024Jun/0796.html)).
- A base64 woff2 `@font-face` inside the SVG is self-contained, so it renders. Outlining text to paths is the fallback if it doesn't.
- We use subsetted base64 woff2, verified in the M1 smoke render.

## 5. GIF and video
- MP4/MOV/WebM uploads are supported, and H.264 is the safest choice ([docs](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)).
- GIFs are heavy and have a limited palette.
- Animated SVG beats both on weight and sharpness for vector scenes, so we don't use them.

## 6. Alt text
- Every image gets a meaningful `alt`; decorative images get `alt=""` ([docs](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)).
- SVGs carry `role="img"` + `<title>`/`<desc>` ([Smashing](https://smashingmagazine.com/2020/03/accessible-svgs-inclusiveness-beyond-patterns)).
- Anything a reader needs (links, project names) is also real markdown text, not only text inside an image.

## 7. What skimmers notice
- The order is pinned repos, then the README header, then bio and avatar ([Underdog](https://underdog.io/blog/what-hiring-managers-look-for-on-github); [TechInterview](https://www.techinterview.org/post/3233474626/github-profile-engineers/)).
- Recruiters read READMEs more than code (a small survey, [Jobrise](https://jobrise.io/en/blog/github-profile-freshers/)).
- There is no controlled eye-tracking study.
- So the first screen must say who, what and where to click.

## 8. Profile fields and APIs
- Up to 6 pins, which replace "Popular repositories" ([docs](https://docs.github.com/en/account-and-profile/tutorials/personalize-your-profile)).
- The bio is ≤ 160 characters ([github-limits](https://github.com/dead-claudia/github-limits)).
- The profile README is the root `README.md` of a **public** repo named after the user ([docs](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme)).
- Social preview: PNG/JPG/GIF, < 1 MB, 1280×640, **web UI only**. There is no shipped API ([docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview)).
- `PATCH /user` accepts name/blog/location/bio/company/hireable ([REST](https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#update-the-authenticated-user)). It needs a token with the `user` scope.

## Implications
1. One animated hero. Everything else is calm, with at most subtle firefly drift.
2. Every SVG is self-contained: inline style, embedded font subsets, data-URI images, no external URLs.
3. Use `<picture>` for dark and light, with a dark fallback `<img>`. Each SVG paints its own background, so it reads on either GitHub theme.
4. Frame 0 of every animation is complete, because reduced motion may not apply inside an image on Safari.
5. Real text and links go in markdown next to the images, and alt text describes what the image says.
6. Third-party stats cards are out. The owner requested a workflow of our own that writes committed SVG from real data.
7. Pins and the first screen carry the story for skimmers.
8. Social previews and pins are uploaded or set by the owner in the UI. Name and bio go through the API if the token scope allows, otherwise the UI.
