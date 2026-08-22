import fs from 'node:fs';
import path from 'node:path';
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

   The first attempt at that asked git: `git log -1 -- <file>`, per
   content file. Correct locally, and wrong where it ships. Cloudflare
   Pages clones with `--depth=1`, and a one-commit clone reports that
   commit for every path — so every deploy stamped all twenty-three
   URLs with the deploy's own timestamp. It worked on the machine it
   was written on and degraded silently in production, which is the
   worst shape a bug can have.

   So the build no longer derives the answer, it reads one.
   `scripts/content-dates.mjs` hashes each content file and holds the
   date steady until the hash moves; `seo/content-dates.json` is
   committed, so every environment reads the same answer and a date
   only changes in a diff someone can see.

   Falls back to the build date if that file is missing — a tarball, a
   fresh checkout that has not run the build step. A slightly stale
   date is worth more than a build that fails for a hint.
   ───────────────────────────────────────────────────────────────── */

export const dynamic = 'force-static';

const BUILD_DATE = new Date();

/** The recorded dates, read once per build. */
const RECORDED: Record<string, Date> = (() => {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'seo', 'content-dates.json'), 'utf8');
    const out: Record<string, Date> = {};
    for (const [key, entry] of Object.entries(JSON.parse(raw) as Record<string, { date?: string }>)) {
      const d = new Date(entry?.date ?? '');
      if (!Number.isNaN(d.getTime())) out[key] = d;
    }
    return out;
  } catch {
    return {};
  }
})();

const SOURCE = {
  projects: RECORDED.projects ?? BUILD_DATE,
  insights: RECORDED.insights ?? BUILD_DATE,
  certifications: RECORDED.certifications ?? BUILD_DATE,
  /* The roles are data too, even though they live in the component
     that renders them. The home page shows them, so editing one
     changes the home page. */
  experience: RECORDED.experience ?? BUILD_DATE,
} as const;

/* The home page renders all of it, so it is as new as the newest
   thing on it. */
const HOME = new Date(Math.max(...Object.values(SOURCE).map((d) => d.getTime())));

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
