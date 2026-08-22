import type { MetadataRoute } from 'next';

import { ORIGIN, allRoutes } from '../src/lib/seo';

/* ─────────────────────────────────────────────────────────────────
   The sitemap.

   Every URL, once, absolute, on `www` — the same string the canonical
   on that page declares. A sitemap that disagrees with a canonical is
   a contradiction, and Google resolves contradictions by ignoring
   both.

   It is generated from `allRoutes()`, which is the same function the
   heads and llms.txt are generated from, so a route cannot exist in
   one and be missing from another. That was the failure mode of
   maintaining a sitemap by hand, and it is silent: nothing breaks, the
   page simply never gets crawled.

   Priorities mirror what the site is: the portfolio first, then the
   projects it is a portfolio of, then the record of moments. `lastmod`
   is the build date, which is honest — a static export is rewritten in
   full on every deploy.
   ───────────────────────────────────────────────────────────────── */

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return allRoutes().map((r) => ({
    url: `${ORIGIN}${r.url}`,
    lastModified,
    priority: r.url === '/' ? 1 : r.url.startsWith('/projects/') ? 0.8 : 0.6,
    /* Only the moments have a photograph of their own. A project page's
       screenshots are interface captures, not images a reader would
       search for. */
    ...(r.image ? { images: [`${ORIGIN}${r.image}`] } : {}),
  }));
}
