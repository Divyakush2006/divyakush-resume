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

   The share image is a designed 1200x630 card with type set into it,
   never a page's own photograph or screenshot — a raw 16:10 frame
   dropped into that slot gets cropped by every platform differently
   and reads as an accident.

   For a long time that meant one card everywhere. The argument was
   right about screenshots and wrong about the conclusion, because a
   screenshot was never the only alternative to the site card: a card
   can be *generated* per page. `scripts/generate-og-image.mjs` now
   renders one per project on the same surface, so a link to Netra
   unfurls as Netra and a project's search thumbnail says what the
   project is, instead of ten results repeating the same byline.

   Anything without its own card falls back to the site card, which is
   still what the JSON-LD points at as the entity's image.
   ───────────────────────────────────────────────────────────────── */

const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: `${NAME} — ${ROLE}`,
};

export function metadataFor(seo: RouteSeo, type: 'website' | 'article'): Metadata {
  const card = seo.card
    ? { url: seo.card, width: 1200, height: 630, alt: `${seo.h1} — ${NAME}` }
    : OG_IMAGE;
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
      images: [card],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [card.url],
    },
  };
}
