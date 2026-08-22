import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

import '../src/index.css';
import { AppShell } from './_components/AppShell';
import { NAME, ORIGIN, ROLE, SAME_AS, homeSeo } from '../src/lib/seo';

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
        {/* Font hosts. Google serves Inter and JetBrains Mono; the
            Webflow CDN serves the two display faces declared in
            src/index.css. Preconnecting removes a round trip from the
            hero's first paint, which is the LCP element.

            These are written here rather than through next/font on
            purpose. next/font would self-host and hash the files,
            which is better — and it would also change which bytes the
            browser gets, when it gets them, and how the fallback
            metrics are computed. That is a typography change wearing a
            performance change's clothes, and it does not belong in the
            same commit as a framework port. It is written up in
            PRODUCTION-AUDIT.md as the next thing to do here. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.prod.website-files.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />

        {/* The identity graph's `sameAs`, as link relations. The
            JSON-LD says the same thing; a crawler that reads one and
            not the other still resolves the same person. */}
        {SAME_AS.map((url) => (
          <link key={url} rel="me" href={url} />
        ))}
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
