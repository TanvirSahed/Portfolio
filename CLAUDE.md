# Portfolio site: project context and handoff notes

Personal academic portfolio of **Md Tanvir Rahman Sahed** (Tanvir Sahed), Graduate Research Assistant, Dept. of EECE, Military Institute of Science and Technology (MIST), Dhaka. Prospective MS/PhD applicant. Research: embedded systems, robotics, embodied AI, edge AI.

Read this whole file before making changes. Everything below has already been decided or set up; do not ask the owner for it again.

## Writing rules (strict)

- **Never use em dashes** anywhere in site copy, commit messages or replies. Use commas, colons, parentheses, or "|" in titles.
- Keep copy factual. Pull details from real sources (GitHub repos, CV, papers), never invent results or claims.

## Live site and hosting

- Live URL: **https://tanvirsahed.github.io/Portfolio/** (GitHub Pages, served from the `docs/` folder of `github.com/TanvirSahed/Portfolio`, branch `main`).
- The owner decided to **keep this URL**. Do not suggest renaming the repo to `TanvirSahed.github.io`. All canonical, Open Graph and sitemap URLs are hard-coded to the `/Portfolio/` path.
- Deploy = commit and push to `main`. Pages updates in about 1 to 2 minutes.
- Files outside `docs/` (like this one) are not published.

## Site architecture

- Static, no build step. JSON-driven content.
- `docs/index.html` is only a redirect to `pages/home/home.html`. It also holds the Search Console verification tag (keep it).
- `docs/index.js` + `docs/index.json`: shared nav on every page, and the Google Analytics loader (reads `analytics.ga4` from `index.json`).
- Each page is `docs/pages/<name>/<name>.html` + `.js` + `.json` + `.css`. Pages: `home`, `projects`, `publication`, `experience`, `gallery` (gallery is still "coming soon").
- Home "About" text lives in `docs/pages/home/about.txt`. Hero, education, awards, footer live in `home.json`. Hero social icons come from `hero.social` in `home.json`; icon SVGs are in `iconSVG()` in `home.js`.
- Projects: `docs/pages/projects/projects.json`. Images go in `docs/pages/projects/assets/images/<slug>/` named `p1.jpg, p2.jpg, ...` (the carousel auto-discovers only that `p<N>` pattern). Cards support a `links: [...]` array (older single `link` object still works). Image modal has click-to-zoom, prev/next, arrow keys and a hover magnifier lens.
- Publications: `docs/pages/publication/publication.json`.
- CV PDF: `docs/pages/home/assets/resume/CV_MdTanvirRahmanSahed.pdf`.

## SEO and search indexing (done 2026-10-28)

- Every page `<head>` has a descriptive title, meta description, absolute canonical URL, favicon (`docs/favicon.svg`) and Open Graph tags.
- `home.html` has JSON-LD `ProfilePage` / `Person` data (name variants, MIST affiliation, ORCID identifier, `sameAs` profile links) plus `<link rel="me">` tags. If a new profile is added, add it to `sameAs` too.
- `docs/sitemap.xml` lists home, publication, projects, experience and the CV PDF. Update `<lastmod>` when pages change meaningfully, and add new pages here.
- **Google Search Console:** URL-prefix property `https://tanvirsahed.github.io/Portfolio/`, verified with meta tag `0H3QkGzZ6ZYOLQ6S1P4EODVAWgfYTtHIxZfjtrZwwYw` (in `docs/index.html` and `home.html`). Sitemap submitted.
- **Google Analytics 4:** Measurement ID `G-ZXLC0L7DC4`, set in `docs/index.json` under `analytics.ga4`. Skipped on localhost and `file:`. Linked to Search Console.
- `robots.txt` is not possible: it only works at the domain root, which this repo does not control.

## Owner identities and profiles

| Profile | Link / ID |
|---|---|
| ORCID | https://orcid.org/0009-0003-3108-7655 |
| Google Scholar | https://scholar.google.com/citations?user=DOUfU_EAAAAJ |
| GitHub | https://github.com/TanvirSahed |
| LinkedIn | https://www.linkedin.com/in/tanvir-sahed-b68759275 |
| Facebook | https://facebook.com/me.unique1 |
| Email | tanvir@eece.mist.ac.bd (alt: tanvir.sahed00@gmail.com) |

- **Do not show an ORCID icon** in the home hero icon row (owner said it takes space and breaks the symmetry). ORCID stays only in the invisible metadata (JSON-LD and `rel="me"`). Visible icons: Google Scholar, GitHub, LinkedIn, Facebook.
- ResearchGate and Semantic Scholar profile URLs are unknown. Ask only if they are needed.

## Pending work

Owner's side (needs their logins, cannot be done from code). The site URL should be added to:
- ORCID "Websites & social links", Google Scholar "Homepage", GitHub profile "Website" and the Portfolio repo About box, LinkedIn contact info, ResearchGate, Facebook.
- Bing Webmaster Tools: "Import from Google Search Console" (not confirmed done).

Content still placeholder or incomplete:
- Projects: `ETD` and `ML-Cyber` (AI tab, no matching GitHub repo found), `E-Grenade` (needs the owner to describe it), `Line following Robot` (no repo, but the portfolio PDF has real What/How/Results), the Design tab (hidden, low priority).
- Home page Featured Projects carousel and Awards wall still partly point at placeholder images or links.
- Gallery page has no content yet (excluded from the sitemap until it does).
