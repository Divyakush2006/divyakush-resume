import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

import '../src/index.css';
import { AppShell } from './_components/AppShell';
import { NAME, ORIGIN, ROLE, SAME_AS, homeSeo } from '../src/lib/seo';
import { FontPreload } from './_seo/Document';

/* ─────────────────────────────────────────────────────────────────
   The document.

   Everything here is true of every URL on the site: the language, the
   two font hosts, the analytics tag, the body's ground colour, and the
   application itself. Anything that differs between routes — title,
   description, canonical, Open Graph, JSON-LD, the prose a crawler
   without JavaScript reads — lives in that route's own page.tsx and is
   written into its own document at build time.

   ── Why the app is mounted here rather than in a page ─────────────
   Because it must never unmount. `/` and `/insights/<slug>` are the
   same page with a story open over it, and in Next those are different
   route segments — so if the application lived in `page.tsx`, opening a
   card would tear down the carousel, the hero and the scroll position
   and build them again. Mounted in the layout, it is mounted once for
   the whole session and Next's router does what it is actually good
   at: giving each URL a document. See the note in src/App.tsx.
   ───────────────────────────────────────────────────────────────── */

const home = homeSeo();

export const metadata: Metadata = {
  /* Every relative URL in this file and in every generateMetadata
     resolves against this, which is how a route can say
     `canonical: '/projects/netra'` and get an absolute URL on the
     right host without restating the origin. */
  metadataBase: new URL(ORIGIN),
  title: home.title,
  description: home.description,
  authors: [{ name: NAME, url: `${ORIGIN}/` }],
  creator: NAME,
  applicationName: NAME,
  /* No `alternates` here. Every route states its own canonical, and a
     layout-level default would silently apply to any route that forgot
     to — which is the failure this whole layer exists to prevent. */

  /* ── The robots directive ────────────────────────────────────────
     A third-party audit reported "Robots Meta Tag: Missing", and it
     was right that the tag was absent. Absent is not the same as
     wrong — the default for a page with no robots meta *is*
     `index, follow`, and `public/robots.txt` already welcomes every
     crawler by name — so nothing was being blocked and adding
     `index, follow` alone would change precisely nothing.

     It is here for the other three directives, which have no defaults
     worth having:

       max-image-preview:large   Lets Google use a *large* thumbnail in
                                 a result and in Discover. Without it
                                 the preview is capped at a
                                 thumbnail-sized image. This site is a
                                 portfolio whose evidence is
                                 photographic — twelve event
                                 photographs, eighteen certificate
                                 scans, ten project covers — and this
                                 one token decides how much of that a
                                 person sees before deciding to click.

       max-snippet:-1            No cap on the text snippet length.
                                 The default lets Google choose, and
                                 it chooses short.

       max-video-preview:-1      No cap on video previews. The project
                                 pages carry walkthrough films.

     Set at the layout so it applies to all twenty-three documents.
     Unlike `alternates` above, there is no per-route value here that
     could be wrong: every page on this site should be indexed, and a
     route that ever should not can override it locally.

     The three directives are set at the top level *and* under
     `googleBot`. Next emits the top-level ones as <meta name="robots">
     and the nested ones as <meta name="googlebot">, and the first
     version of this only set them under `googleBot` — which handed the
     preview rules to Google and to nobody else. Bing reads
     `max-snippet` and `max-image-preview` from the generic `robots`
     tag, so half the audience was getting defaults. Both tags now say
     the same thing. */
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
  openGraph: {
    type: 'website',
    url: `${ORIGIN}/`,
    siteName: NAME,
    title: home.title,
    description: home.description,
    locale: 'en',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${NAME} — ${ROLE}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: home.title,
    description: home.description,
    images: ['/og-image.png'],
  },
  other: {
    /* Not a Metadata field, and load-bearing for entity resolution:
       the same six URLs the JSON-LD carries, as a plain relation. */
    'profile:username': 'divyakush',
  },
};

/* `viewport-fit=cover` is the reason this is spelled out rather than
   left to the framework default. The hero runs to the edges of a
   notched phone, and without `cover` the browser insets the whole
   layout viewport and the design stops at the safe area. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0B0C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ── Fonts ──────────────────────────────────────────────
            Inter and JetBrains Mono are self-hosted from /fonts and
            declared in src/index.css. What used to be here was a
            render-blocking <link rel="stylesheet"> to
            fonts.googleapis.com, and removing it is the single largest
            change on this page: nothing painted until that stylesheet
            had been fetched from one third-party host and parsed to
            discover font URLs on a second one. Two handshakes and four
            serialised round trips in front of the first character.
            See the long note in src/index.css.

            Both faces are preloaded rather than merely declared. A
            @font-face URL is not discovered until the CSS that
            references it has been parsed *and* the browser has found a
            character that needs it, which puts the fetch late in a
            cascade it does not have to be in. These two are used above
            the fold on every route, so they are asked for immediately.
            Only the `latin` subsets — latin-ext stays lazy, which is
            the point of declaring it separately.

            `crossOrigin` is required even for a same-origin font:
            fonts are always fetched in CORS mode, and a preload whose
            mode does not match the eventual request is a preload the
            browser discards and warns about, having downloaded the
            file twice.

            Emitted through <FontPreload /> rather than written as
            <link> tags here, for the same reason HeroPreload exists:
            React hoists a rendered <link rel="preload"> into <head>
            as authored *and* registers it as a resource it emits
            itself, so both faces appeared twice in every document.
            The ReactDOM.preload API deduplicates. */}
        <FontPreload />

        {/* The two display faces are still hotlinked from a Webflow
            CDN — see src/index.css for why they have not moved. They
            load lazily behind `font-display: swap`, so this preconnect
            is worth keeping: it overlaps the handshake with parsing
            rather than paying for it when the face is first needed. */}
        <link rel="preconnect" href="https://cdn.prod.website-files.com" crossOrigin="" />

        {/* The identity graph's `sameAs`, as link relations. The
            JSON-LD says the same thing; a crawler that reads one and
            not the other still resolves the same person. */}
        {SAME_AS.map((url) => (
          <link key={url} rel="me" href={url} />
        ))}

        {/* public/manifest.json. It carried over from the site this one
            replaces, and it is linked because an unlinked manifest is a
            file nothing reads: the name, colours and display mode only
            reach the browser through this relation. Its `theme_color`
            is the same #0B0B0C as the `viewport` export above — two
            places that must agree, or the address bar and the
            installed splash screen disagree with each other. */}
        <link rel="manifest" href="/manifest.json" />
      </head>

      <body className="bg-ink text-bone-raised font-sans antialiased">
        {/* The prerendered head, the prose for crawlers without
            JavaScript, and the per-route JSON-LD all arrive here. */}
        {children}

        <AppShell />

        {/* ── Google Analytics 4 ──────────────────────────────────
            The loader, then the bootstrap. The bootstrap is /ga.js,
            a real file on this origin, rather than the inline block
            Google ships — which is what lets the Content-Security-
            Policy in public/_headers keep `script-src 'self'` with no
            'unsafe-inline' and no hash to maintain. The note in
            public/ga.js has the full reasoning.

            `afterInteractive` rather than `beforeInteractive`: nothing
            on the page waits on analytics, and a measurement tag has
            no business competing with the hero for the first
            connections on a cold phone. */}
        <Script
          id="ga4-tag"
          src="https://www.googletagmanager.com/gtag/js?id=G-59EFGHFFHF"
          strategy="afterInteractive"
        />
        <Script id="ga4-config" src="/ga.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
