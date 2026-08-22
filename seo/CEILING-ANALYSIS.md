# Ceiling analysis — 21 August 2026

The on-site work is at its measured ceiling. This file states precisely which
Definition-of-Done conditions are met, which are not, and what is actually
blocking each one. It exists because the alternative — reporting "done" — would
be false.

---

## Met, with evidence

| Condition | Evidence |
|---|---|
| Unique, in-spec title + description + single H1 on every indexable page | 22/22 each, `seo/crawl.json` |
| Valid connected `@graph`, all `@id` references resolving | 22/22, 0 dangling |
| Zero canonical conflicts | 22/22 self-referencing and matching the served path |
| Zero 4xx/5xx on internally linked URLs | 22/22 return 200 |
| No soft 404s | unknown path → 404 + `noindex` |
| Zero orphan pages | every URL is linked from the home page or a project page |
| Priority pages ≤ 3 clicks from root | max depth 2 |
| CLS ≤ 0.05 | measured **0** on all 22 |
| Alternate domains resolved | apex and is-a.dev both 301 → www |
| `sameAs` graph complete | 6 controlled properties, reciprocal where the platform allows |
| Content in raw HTML for non-JS crawlers | 6,280 words, from 0 |

## Not met, and honestly not meetable from here

### 1. Everything downstream of deployment

**`www.divyakush.com` is still serving the previous site.** Nothing measured
here is live. Until this build deploys, the following cannot move and cannot be
measured: indexed page count, field CWV, rank for any term, AI-engine citation,
impressions, clicks.

This is the single blocking item. It is not an SEO problem.

### 2. Search Console — not verified as a Domain property

Without it: no ground-truth index coverage, no rank data, no way to submit the
sitemap or request indexing, no Enhancements report to validate the schema
against, no Core Web Vitals field report.

**Required:** a TXT record at BigRock. The `google0dbb222546d95f4f.html` file
carried into this build verifies a URL-prefix property only, which does not
cover the apex or the redirect sources.

### 3. Field Core Web Vitals

`UNMEASURED`. CrUX needs a deployed origin and a 28-day collection window with
sufficient traffic. A site with low traffic may never accumulate enough samples
to appear in CrUX at all — in which case the honest position is that lab data is
the only data, and the lab data is good.

Lab LCP is 1.9–2.1 s on the home page and the eleven insight routes, against a
2.0 s target. That is the hero portrait. **I have not optimised it**, because
optimising against a localhost measurement is optimising against a number that
does not exist in the field. Re-measure after deployment; if it holds, the lever
is `preload` + `fetchpriority="high"` on the portrait and nothing more exotic.

### 4. Rankings — all of them

Every performance-gate condition (brand keywords at position 1, money keywords
in top 3, long-tail in top 10, AI citations) is **UNMEASURED and unmeasurable
from here**. There is no legitimate programmatic way to check live Google
rank: the SERP API is paid and restricted, and scraping is blocked and against
terms of service. Any tool reporting your rank without Search Console is
guessing, and I will not add a guess to a report.

### 5. The external constraint that on-site work cannot fix

`divyakush.com` is a young domain with, per the previous strategy document,
effectively zero referring domains. Against that:

| Query class | On-site ceiling reached? | What actually decides it |
|---|---|---|
| `divyakush punjabi`, `divyakush punjabi portfolio` | Yes | Entity signals — already maximal. Expect 1–3 within weeks of indexing |
| `divyakush` alone | Yes | Competes with a construction firm and other people with the name. Decided by brand search volume and referring domains, not markup |
| `divyakush + <project>` | Yes | You are the only relevant entity. Should win once indexed |
| Generic terms (`full stack developer india`, `AI engineer`) | Yes | **Referring-domain deficit.** These SERPs are held by aged domains with hundreds of referring domains. No amount of on-page work closes that gap |

**Quantified gap:** unknown, because the referring-domain count is
`UNMEASURED` pending Search Console. That measurement is the first thing worth
taking after verification.

---

## The off-site work that closes it

In order of value per unit effort, none of it requiring budget:

1. **Deploy, verify, submit the sitemap, request indexing.** Nothing else
   matters until this is done.
2. **Repoint every controlled backlink** to `https://www.divyakush.com`,
   byte-identical: GitHub profile website field, all ~19 repo About fields,
   LinkedIn contact + Featured, dev.to profile, about.me. These are the
   highest-authority citations available and they cost nothing.
3. **The dev.to account is the most under-used asset here** — 44 published
   posts on an authoritative domain. Cross-link the relevant ones to the
   matching project page, and set `canonical_url` on any post that duplicates
   site content so authority resolves home rather than competing.
4. **Bing Webmaster Tools + IndexNow.** Under-served, indexes faster, and feeds
   several AI answer engines.
5. **Write the Rockfall case study properly** — the honest-evaluation angle
   ("the model scored 98% AUC-ROC; here is the baseline that nearly matches
   it") is a genuine link magnet and a hiring signal at once. Original data is
   the single most-cited content format in AI answer engines.
6. **Wikidata item**, if genuinely eligible. Do not force it; an item that gets
   deleted is worse than none.

---

## Honest summary

Everything I control is at its ceiling and verified: **0 findings across 22
pages** on the crawl that produced 44 findings at the start of this cycle.

Everything I do not control — deployment, verification, links, time — is
listed above with an owner. The gap between "on-site maximised" and "ranking
achieved" is entirely in that list, and most of it is one afternoon of your
time rather than any further engineering.
