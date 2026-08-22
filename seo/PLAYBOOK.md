# SEO playbook — how not to undo this

Everything below is load-bearing. Each item exists because it was broken once
and the breakage was measured. `scripts/seo-crawl.mjs` fails the build if any
of it regresses, so the cheapest way to stay correct is to run it.

```
npm run build          # includes the SEO pass
npm run seo:check      # crawl dist/ and fail on any finding
```

## The five rules

**1. Never hardcode a canonical in `index.html`.**
It applies to every route. That single tag told Google not to index 21 pages of
writing. `scripts/seo-build.mjs` strips whatever is in the shell and writes a
correct self-referencing one per document.

**2. Never add a catch-all to `public/_redirects`.**
`/* /index.html 200` shadows the 22 prerendered documents and serves the home
page's head for all of them. Cloudflare's own documentation says redirects are
followed "regardless of whether or not an asset matches". Every valid route
already has a file; unknown paths fall to `404.html` and return a real 404.

**3. Schema is generated, never pasted.**
One source of truth: the `@graph` builder in `scripts/seo-build.mjs`, reading
`src/lib/projects.ts` and `src/lib/insights.ts` through esbuild. Add a project
or an insight and its document, sitemap entry, `llms.txt` line and schema appear
automatically. A second hand-maintained copy is wrong within a week.

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

`ORIGIN` in `scripts/seo-build.mjs` is the only place it is written. Change it
there, rebuild, and update `public/robots.txt`'s `Sitemap:` line.

## When you add a route pattern to `App.tsx`

Add it to `routes()` in `scripts/seo-build.mjs` in the same commit, or it will
404 in production — there is no SPA fallback any more, by design.

## What must never be done

- Keyword stuffing, in titles, alt text, body copy or `llms.txt`.
- Generating pages to fill the sitemap.
- Hidden text — including "visually-hidden" prose added for crawlers. The
  crawlable copy lives in `<noscript>`, which is legitimate; CSS-hidden text is
  not.
- Buying links, PBNs, automated outreach.
- Claiming a rank or a metric that has not been measured. If it cannot be
  measured, it is `UNMEASURED`.
