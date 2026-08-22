import type { Metadata } from 'next';

import { NAME, ROLE, type RouteSeo } from '../../src/lib/seo';

/* ─────────────────────────────────────────────────────────────────
   One route's <head>, from one route's description of itself.

   Written once here rather than three times across the three page
   files, because the three heads have to agree. Under the old build
   script they agreed by being generated from one template literal;
   this is the same guarantee with types on it.

   `alternates.canonical` takes a path. It resolves against
   `metadataBase` in app/layout.tsx, which is why no route restates the
   origin and why none of them can disagree about whether the site is
   on `www`. That mattered: a canonical is a declaration that a page is
   a duplicate of the URL it names, and twenty-two of these documents
   once named the home page.

   The share image is the same file everywhere on purpose. A project
   page could plausibly use its own cover, and the reason it does not
   is that og:image is a 1200x630 card with type set into it — a raw
   16:10 screenshot dropped into that slot gets cropped by every
   platform differently and reads as an accident. One designed card
   that names the person is the better unfurl, and it is the same card
   the JSON-LD points at as the entity's image.
   ───────────────────────────────────────────────────────────────── */

const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: `${NAME} — ${ROLE}`,
};

export function metadataFor(seo: RouteSeo, type: 'website' | 'article'): Metadata {
  return {
    title: seo.title,
    description: seo.description,
    /* The home page's own URL is not written here — see HomeCanonical
       in ./Document.tsx. Next's metadata resolver normalises a URL
       against `trailingSlash: false` and strips the slash off the
       origin, turning `https://www.divyakush.com/` into
       `https://www.divyakush.com`. The two are the same URL to a
       browser and to Google, and they are not the same string to the
       sitemap, to Search Console's URL inspection, or to the crawl
       audit that compares them. The site has been indexed under the
       one with the slash since it launched, so it keeps it. */
    ...(seo.url === '/' ? {} : { alternates: { canonical: seo.url } }),
    openGraph: {
      type,
      ...(seo.url === '/' ? {} : { url: seo.url }),
      siteName: NAME,
      title: seo.title,
      description: seo.description,
      locale: 'en',
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [OG_IMAGE.url],
    },
  };
}
