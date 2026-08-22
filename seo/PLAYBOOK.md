# SEO playbook — how not to undo this

Everything below is load-bearing. Each item exists because it was broken once
and the breakage was measured. `scripts/seo-crawl.mjs` fails the build if any
of it regresses, so the cheapest way to stay correct is to run it.

```
npm run build          # images -> tsc -> next build -> post-build assertions
npm run serve          # serve out/ with the real _headers
npm run seo:check      # crawl out/ and fail on any finding
```

> **Ported to Next 16, 22 August 2026.** `scripts/seo-build.mjs` is gone. It
> string-substituted a new `<head>` into `dist/index.html` twenty-three times
> because a client-rendered SPA emits one document and Vite had no idea the
> other twenty-two URLs existed. Next does. Everything that script did now
> lives in **`src/lib/seo.ts`** plus a `generateMetadata` export per route,
> and `scripts/post-build.mjs` asserts the result. Where this file used to
> say `scripts/seo-build.mjs`, read `src/lib/seo.ts`.

## The five rules

**1. Never hardcode a canonical in `app/layout.tsx`.**
A canonical in the shared layout applies to every route. That single tag once
told Google not to index 21 pages of writing. Each route's `generateMetadata`
writes its own self-referencing canonical, and `scripts/post-build.mjs` fails
the build if any document's canonical disagrees with the sitemap.

The home page is the one special case: Next's metadata resolver strips the
trailing slash off an origin, and the site has been indexed as
`https://www.divyakush.com/` since it launched. `app/_seo/Document.tsx` writes
that one as a literal tag and `app/_seo/metadata.ts` omits it from the
resolver. Do not "tidy" this.

**2. Never add a catch-all to `public/_redirects`.**
`/* /index.html 200` shadows the 22 prerendered documents and serves the home
page's head for all of them. Cloudflare's own documentation says redirects are
followed "regardless of whether or not an asset matches". Every valid route
already has a file; unknown paths fall to `404.html` and return a real 404.

**3. Schema is generated, never pasted.**
One source of truth: the `@graph` builders in `src/lib/seo.ts`, reading
`src/lib/projects.ts`, `src/lib/insights.ts` and `src/lib/certifications.ts`
directly. Add a project, an insight or a certificate and its document, sitemap
entry, `llms.txt` line and schema appear automatically. A second
hand-maintained copy is wrong within a week.

Two rules inside the builders:

- **Dates go through `isoDate()`.** The site prints "Jun 2025"; schema.org
  wants ISO 8601, and a reduced-precision date is a complete answer. Never
  pad a month out to `-01` to quiet a validator — that is a day nobody has.
- **Image dimensions come from `IMAGES`**, which `scripts/images.mjs` reads
  off the files. A width typed by hand is wrong the first time a photograph
  is recropped, silently.

**4. Mark up only what a reader can see.**
`BreadcrumbList` is on project pages because project pages render a visible
trail. It is deliberately absent from insight routes because they do not. No
`FAQPage` without a visible FAQ, no `AggregateRating` without real reviews. A
manual action costs more than any rich result gains.

**5. Numbers on the site come from a source.**
Every figure in `insights.ts` and `projects.ts` traces to a post, a document or
the author's stated record, and the provenance headers say which. A number a
reader can check is the last place to be approximate — this has already gone
wrong twice in both directions.

## When you add a project or an insight

Nothing to do. Add the entry to the data file and rebuild. Then confirm:

```
npm run seo:check
```

## When you change the domain

`ORIGIN` in `src/lib/seo.ts` is the only place it is written. Change it there,
rebuild, and update `public/robots.txt`'s `Sitemap:` line and the `ORIGIN`
constant in `scripts/post-build.mjs` that checks it.

## When you add a route pattern

Two places, same commit: a directory under `app/` with `generateMetadata` and
`generateStaticParams`, and an entry in `allRoutes()` in `src/lib/seo.ts` so it
reaches the sitemap and `llms.txt`. `src/App.tsx` also has to know which tree to
render for it.

Miss the first and it 404s in production — there is no SPA fallback, by design.
Miss the second and it is never crawled, which nothing will tell you.

## What must never be done

- Keyword stuffing, in titles, alt text, body copy or `llms.txt`.
- Generating pages to fill the sitemap.
- Hidden text — including "visually-hidden" prose added for crawlers. The
  crawlable copy lives in `<noscript>`, which is legitimate; CSS-hidden text is
  not.
- Buying links, PBNs, automated outreach.
- Claiming a rank or a metric that has not been measured. If it cannot be
  measured, it is `UNMEASURED`.
- Structured data describing something the page does not show. `hasCredential`
  is on the Person node because the Certifications section renders all twelve
  documents and several print a checkable credential number. That is the test.
  `AggregateRating`, `FAQPage` and a `BreadcrumbList` on the insight routes all
  fail it and are all deliberately absent.
