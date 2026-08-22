# Baseline — 21 August 2026

Measured, not asserted. Every number here comes from `scripts/seo-crawl.mjs`
run against a real server serving the real `dist/`, with each page fetched
twice: once as raw HTTP (no JavaScript) and once rendered in Chromium.
Raw data in `seo/crawl.json`.

Where something could not be measured it says `UNMEASURED` and names the
access required. Nothing in this file is estimated.

---

## Stack fingerprint

| | |
|---|---|
| Framework | Vite 6 · React 18 · TypeScript 5.6 |
| Routing | react-router-dom 6, `BrowserRouter`, 3 route patterns |
| Rendering | Client-side only. **No SSR, no hydration** — `createRoot().render()` |
| Styling | Tailwind 3.4, one compiled stylesheet (53.5 kB / 10.4 kB gzip) |
| Motion | motion 11 |
| Bundle | one chunk, 494 kB / 156 kB gzip |
| Hosting | Cloudflare Pages |
| Registrar | BigRock |
| Analytics | **None installed.** No GA4, Plausible or Umami in source |

## URL inventory

22 indexable URLs, all 200, all in the sitemap, all with a self-referencing
canonical that matches the served path exactly.

| Group | Count | Rendering |
|---|---|---|
| Home | 1 | prerendered head + `noscript` prose, app renders over it |
| `/projects/<slug>` | 10 | same |
| `/insights/<slug>` | 11 | same — a modal route over the home page |

An unknown path returns **404** with the `noindex` 404 document. It returned
**200** before this cycle, which is a soft 404 and reported as an error in
Search Console.

## Indexability integrity

| Check | Result |
|---|---|
| Unique `<title>` | 22 / 22 |
| Unique `<meta description>` | 22 / 22 |
| Exactly one `<title>` per document | 22 / 22 |
| Exactly one canonical per document | 22 / 22 |
| Canonical matches served URL | 22 / 22 |
| Exactly one `<h1>` in the rendered DOM | 22 / 22 |
| Heading-level skips | 0 |
| `<img>` without an `alt` attribute | 0 of 22 pages |
| `<main>` present | 22 / 22 |
| `lang` attribute | `en` on all |
| Conflicting robots directives | none |

## Content available to a crawler

| Pass | Words |
|---|---|
| Raw HTTP, JavaScript disabled | **6,280** across 22 documents |
| After the bundle runs | 36,453 |

The raw figure is what Bing, the LinkedIn and Slack unfurlers, and the AI
crawlers index — none of them run the bundle. It was **0** before this cycle:
every URL served an empty `<div id="root">`.

## Structured data

One connected `@graph` per document. `@id` references resolve to a node that
exists on the same page — **0 dangling references across all 22**.

| Page type | Nodes |
|---|---|
| Home | `Person` · `ImageObject` · `WebSite` · `ProfilePage` |
| Project | `Person` · `ImageObject` · `WebSite` · `WebPage` · `BreadcrumbList` · `SoftwareSourceCode` |
| Insight | `Person` · `ImageObject` · `WebSite` · `WebPage` · `ImageObject` · `Article` |

`sameAs` carries six controlled identity URLs. `BreadcrumbList` appears only on
project pages, which are the only pages that render a visible trail.

## Performance — lab, local

| Metric | Min | Median | Max | Target |
|---|---|---|---|---|
| LCP | 44 ms | 1,900 ms | 2,136 ms | ≤ 2,000 ms |
| CLS | 0 | 0 | **0** | ≤ 0.05 |
| TTFB | 2 ms | 2 ms | 3 ms | ≤ 200 ms |

Project pages land at 44–68 ms. The 1.9–2.1 s figures are the home page and
the eleven insight routes, all of which render the hero portrait — that image
is the LCP element on those pages.

**These are lab numbers on localhost.** TTFB in particular is meaningless here;
it measures a loopback socket. Field data is `UNMEASURED` and will stay so
until the site is deployed and CrUX has collected 28 days.

## Off-site state

| Property | Status |
|---|---|
| `www.divyakush.com` | **Serving the previous site**, not this build |
| `divyakush.com` (apex) | 301 → www ✅ |
| `divyakush.is-a.dev` | 301 → www ✅ |
| `divyakush2006.github.io/divyakush-resume/` | 200, meta-refresh → www |
| GitHub `Divyakush2006` | 200 |
| LinkedIn `/in/divyakush-punjabi` | exists (999 to bots, normal) |
| dev.to `/divyakush` | exists — **44 published posts**, links to www |
| about.me `/divyakush` | 200, links to GitHub + LinkedIn |

## Unmeasured — requires access

| Item | Blocked on |
|---|---|
| Indexed page count vs. intended | Search Console (Domain property) |
| Real field CWV (p75) | Deployment + 28 days of CrUX |
| Live rank for any term | Search Console. There is no legitimate programmatic SERP check |
| Googlebot crawl distribution | Server logs — Cloudflare Pages does not expose them by default |
| Referring domains | Search Console links report |
| Brand SERP composition | Manual search; cannot be automated reliably |
