# divyakush.com

Personal portfolio and record of work. Next.js 16 (App Router, static
export), React 19, TypeScript, Tailwind 3, motion.

Twenty-three URLs, every one of them a real document written at build
time. Deployed as static files on Cloudflare Pages.

```
npm install
npm run dev          # http://localhost:3000
npm run build        # images → tsc → next build → verify export
npm run serve        # serve out/ the way Pages will, headers included
```

---

## Layout

```
app/                     routes: what each URL says about itself
  layout.tsx             the document — fonts, analytics, the app shell
  page.tsx               /
  insights/[slug]/       /insights/<slug>   twelve moments
  projects/[slug]/       /projects/<slug>   ten projects
  not-found.tsx          404.html
  sitemap.ts             sitemap.xml
  llms.txt/route.ts      llms.txt
  _seo/                  metadata, JSON-LD, noscript prose, hero preload
  _components/           the client boundary

src/                     the application
  App.tsx                which tree renders, and who owns the scrollbar
  HeroSection.tsx
  components/            fourteen components
  screens/               Home, ProjectPage, NotFound
  lib/                   data, motion tokens, hooks, the SEO route table
  assets/                masters and their generated width ladders
  index.css              Tailwind entry, font faces, design tokens

public/                  copied verbatim into the export
  _headers               CSP, security headers, caching
  _redirects             deliberately empty — see the note inside
  insights/              the twelve photographs, cropped and laddered
  certificates/          scans
  ga.js                  the GA4 bootstrap, as a file rather than inline

scripts/                 the build steps and the audits
```

---

## The build

`npm run build` is four steps, in order, and each one can fail the
build:

1. **`scripts/images.mjs`** — for every WebP the app imports and every
   photograph in `public/`, writes a raster fallback and a width ladder
   (400/800/1200/1600), then generates `src/lib/image-fallbacks.generated.ts`
   mapping each master to its `srcset` and fallback. That map is what
   `<Picture>` reads. It is the reason the home page decodes 10.5MB of
   bitmap on a phone rather than 133.5MB.
2. **`tsc`** — types, with `strict` on.
3. **`next build`** — twenty-three routes prerendered to static files.
4. **`scripts/post-build.mjs`** — checks the export is a site: one
   title, one canonical, one JSON-LD graph and one `<noscript>` per
   document; the canonical matching the sitemap; no inline script the
   CSP has not accounted for; the hero preload on the routes that paint
   the hero and nowhere else.

---

## Audits

Each of these exists because something went wrong once. Start a server
first — `npm run serve` — then:

| Command | What it proves |
|---|---|
| `npm run audit` | 13 routes × 2 viewports: console errors, 404s, CSP violations, contrast, labels, targets |
| `npm run audit:csp` | the site runs clean under the policy in `public/_headers` |
| `npm run audit:navigation` | the modal route, the scroll owner, the back button and the real 404 — twenty checks a screenshot cannot make |
| `npm run seo:check` | title, description, canonical, JSON-LD and a real 404 on every URL |
| `npm run audit:picture` | every `<picture>` fetches exactly one file — no double downloads |
| `npm run audit:fallbacks` | every raster fallback fetches, decodes, and is typed correctly |
| `npm run audit:responsive` | seven viewports from 320px up, including landscape |
| `npm run audit:mirrors` | the carousel draws its mirrored panels if and only if there is slack to fill |
| `npm run audit:lcp` `audit:perf` `audit:mobile` `audit:scroll` `audit:motion` | timing, throttled CPU, scroll behaviour, reduced-motion |

### Visual regression

```
node scripts/serve-dist.mjs 5188 out
npm run snapshot -- .after http://localhost:5188
npm run snapshot:diff -- .baseline .after
```

Forty-eight captures — every route at 390px and 1440px, with reduced
motion, a pinned clock, no lazy loading and a cold cache per page, so
two runs of the same build are byte-identical. Modal routes
(`/insights/*`) are captured at viewport size rather than full page;
the reasoning is in the script, and it is the difference between a
harness that measures the site and one that measures itself.

`.baseline/` is the reference set. It was captured from the Vite build
immediately before the Next port and the port was verified against it —
48 of 48 identical — so it is still the right thing to compare a change
to today.

---

## Deployment

Cloudflare Pages, static.

- Build command: `npm run build`
- Output directory: `out`
- No environment variables, no server, no adapter.

`public/_headers` and `public/_redirects` are copied into the export and
picked up by Pages. Read the notes inside both before changing either —
the CSP concession and the empty redirect file are each the result of a
specific failure.
