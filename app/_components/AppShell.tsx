'use client';

import { useEffect, useState } from 'react';

import App from '../../src/App';

/* ─────────────────────────────────────────────────────────────────
   The application, mounted in the browser.

   `ssr: false` is the single most consequential line in this port, so
   here is the whole argument for it.

   ── What the site renders is a function of the viewport ───────────
   Not its styling — what it renders. Seven places branch on a media
   query, and they branch on structure and on copy, not on colour:

     · Selected work is a scroll-linked deck of ten pinned frames above
       768px and a plain list below it. Different components.
     · A project page's standfirst is the lede above `sm` and the
       shorter summary below it. Different sentences.
     · The insights carousel fills the card with a landscape photograph
       on a desktop and contains it on a phone, and only draws its
       mirrored side panels where there is slack to fill.
     · The hero's portrait blur is 35px on a desktop and lighter on a
       phone, because that blur is the most expensive thing on the page
       and a phone rasterises it at device pixel ratio 3.
     · The experience rail scroll-locks on a wide screen and scrolls
       normally otherwise.

   A static export has one document for every device. Server-render
   that tree and the file has to commit to one branch — the desktop one
   — and every phone then downloads it, paints it, and holds it until
   hydration finishes. On the hardware this site was tuned for, that is
   several hundred milliseconds of the wrong layout, followed by a
   reflow when the real one arrives: the deck replaced by the list, the
   standfirst replaced by a shorter sentence, the page's height
   changing under a reader's thumb. It is a worse first paint than
   painting nothing, and it is measured in Cumulative Layout Shift.

   The alternative is to move all seven branches into CSS so both
   variants ship and one is hidden. That is a redesign of five
   components — the deck would mount its ten frames on phones to sit
   invisible — and this is a port. It is written up as future work.

   ── What is given up, and what is not ─────────────────────────────
   Given up: the application's markup is not in the HTML file. What is
   not given up is anything a search engine actually reads here, all of
   which is server-rendered and sitting in every one of the twenty-three
   documents this build writes:

     · title, description and canonical, per route
     · Open Graph and Twitter cards, per route
     · a JSON-LD @graph naming the person, the site, the page and —
       on a project or a moment — the software or the article
     · the page's real prose in <noscript>, which is what Bing, the
       LinkedIn and Slack unfurlers and the AI crawlers read
     · a preload for the hero portrait, resolved to the exact rendition
       the browser will pick

   That is the same posture the site already shipped and audits clean
   on: 23 of 23 unique titles and descriptions, a real 404, no soft
   404, no canonical mismatch.

   ── The one line that would change it ─────────────────────────────
   Delete the mount gate below. Everything else about this file, and
   every route in `app/`, is already written for it. When the seven
   branches become CSS, that is the whole change.

   ── Why this is no longer next/dynamic ────────────────────────────
   It was `dynamic(() => import('../../src/App'), { ssr: false })`, and
   that spelling cost about three seconds of first paint.

   `dynamic()` does two separable things: it keeps a module out of the
   server render, and it moves that module into a chunk fetched at
   runtime. Only the first was wanted here. The second built a
   waterfall, and the built output showed it plainly — the application
   chunk was 528KB and its filename appeared **nowhere in the HTML**.
   Nothing could ask for it until the framework had downloaded,
   parsed and executed enough to reach the import. Two full
   network-then-execute phases, in series, in front of the first pixel:

     HTML → 574KB framework → execute → *now* discover App
          → 528KB application → execute → paint

   A static import removes the second phase. The module joins the
   normal client graph, so Next emits it as a preload in the document
   and the browser fetches it alongside the framework rather than
   after it.

   The no-server-render guarantee is kept, and kept more precisely
   than before: `mounted` is false during the render that produces the
   static HTML, so this returns null and not one branch of the tree is
   committed to a document. The import is what became eager. The
   *render* is exactly as deferred as it was, which is the property
   the whole note above is about.

   The effect this has on the seven media-query branches is nil. They
   are evaluated in effects after mount, which is the same moment they
   were evaluated before.
   ───────────────────────────────────────────────────────────────── */

export function AppShell() {
  /* The mount gate. False on the server and on the very first client
     render, so the static document contains no application markup and
     hydration has nothing to disagree with. True immediately after,
     which is when the media queries the tree branches on can actually
     be asked. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return mounted ? <App /> : null;
}

export default AppShell;
