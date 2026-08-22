import { execFileSync } from 'node:child_process';
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
   projects it is a portfolio of, then the record of moments.

   ── lastmod ──────────────────────────────────────────────────────
   This used to be `new Date()` — the build time, on every URL, on
   every deploy. The comment defending it said that was honest because
   a static export is rewritten in full each time, and that is true
   about the *files*. It is not what the field means. `lastmod` is when
   the page's content last changed, and answering "just now, all
   twenty-three, again" to every crawl is how a site teaches Google to
   stop reading the field at all. Google says as much: lastmod is used
   when it is consistent and demonstrably accurate, and ignored when it
   is not.

   So it comes from version control instead. Each route's content lives
   in exactly one data file, and the last commit that touched that file
   is the honest answer for every route built from it. Redeploying
   without changing content now leaves the dates alone, which is the
   entire point.

   Falls back to the build date if git is unavailable — a tarball, a
   `npm pack`, a CI runner without the history. A slightly stale date
   is worth more than a build that fails for a hint.
   ───────────────────────────────────────────────────────────────── */

export const dynamic = 'force-static';

const BUILD_DATE = new Date();

/** When `file` was last committed, or null if git cannot say. */
function lastCommit(file: string): Date | null {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      cwd: process.cwd(),
    }).trim();
    if (!out) return null;
    const d = new Date(out);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/* Resolved once per build, not once per URL: twenty-three `git log`
   processes to answer three questions is twenty spawns of pure waste. */
const SOURCE = {
  projects: lastCommit('src/lib/projects.ts') ?? BUILD_DATE,
  insights: lastCommit('src/lib/insights.ts') ?? BUILD_DATE,
} as const;

/* The home page renders everything, so it is as new as the newest
   thing on it. */
const HOME = new Date(Math.max(SOURCE.projects.getTime(), SOURCE.insights.getTime()));

function lastModified(url: string): Date {
  if (url.startsWith('/projects/')) return SOURCE.projects;
  if (url.startsWith('/insights/')) return SOURCE.insights;
  return HOME;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return allRoutes().map((r) => ({
    url: `${ORIGIN}${r.url}`,
    lastModified: lastModified(r.url),
    priority: r.url === '/' ? 1 : r.url.startsWith('/projects/') ? 0.8 : 0.6,
    /* Only the moments have a photograph of their own. A project page's
       screenshots are interface captures, not images a reader would
       search for. */
    ...(r.image ? { images: [`${ORIGIN}${r.image}`] } : {}),
  }));
}
