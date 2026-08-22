'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { Home } from './screens/Home';
import { ProjectPage } from './screens/ProjectPage';
import { NotFound } from './screens/NotFound';
import { INSIGHT_PREFIX, homeSeo, insightSeo, projectSeo } from './lib/seo';

/* ─────────────────────────────────────────────────────────────────
   Routes.

   The site is one long page plus a detail page per project:

     /                     the portfolio
     /insights/<slug>      the portfolio, with one moment's story open
     /projects/<slug>      the detail page behind a deck frame
     anything else         a 404 that still lists the ten projects

   `/insights/<slug>` renders exactly the same element as `/`. It is a
   modal route: the story is an overlay over the page, not a page of
   its own, and the URL exists so that one can be linked, shared,
   bookmarked and reached with the back button. Opening a card pushes
   that path, closing pops back to `/`, and landing on it cold puts the
   page up with the overlay already open. Nothing about the route
   changes what is rendered underneath — which is the whole point of
   doing it this way rather than as a separate page.

   Nav and Footer sit outside the switch because they are the same on
   every route — only their link targets change, which each of them
   works out from the current pathname.

   ── Why this component still does the routing ─────────────────────
   Next has a file-system router, and the `app/` directory does use it:
   every URL here is a real route with its own `generateMetadata`, its
   own JSON-LD and its own prerendered document. What `app/` does not
   do is decide which React tree renders, and that is deliberate.

   The reason is the modal route. In Next, `/` and `/insights/<slug>`
   are different route segments, so navigating between them swaps one
   page subtree for another — which means unmounting the carousel, the
   hero and everything else, then mounting it again. The deck would
   jump back to its first slide, the hero would replay its intro, and
   the page would lose its scroll position, every time a card was
   opened or closed. React Router did not do that because both routes
   rendered the same element and React reconciled them.

   So the whole application is mounted once, in the root layout, and
   this component reads the pathname and renders accordingly. React
   reconciles Home across `/` and `/insights/<slug>` exactly as before,
   and Next's router is left doing what it is genuinely better at:
   giving each URL a document, a title and a canonical.
   ───────────────────────────────────────────────────────────────── */

/* ── Own the scroll position on load ──────────────────────────────
   Chrome serialises a scroll *anchor* into the history entry and uses
   it to re-place the page on reload. The anchor it picks here is the
   hero's wordmark band, which lays out at `top: 25vh` but is pulled
   back up by a `y: -25vh` transform. Transforms do not move an
   element's layout box, so on restore the browser puts the anchor's
   layout position where its visual position used to be — parking every
   reload exactly 25vh down the hero, mid-fade, with the portrait
   half-blurred and the cards half-gone. It reproduced at precisely
   0.25 × viewport height at every window size, with the intro both
   enabled and disabled.

   Rather than fight the heuristic, take the decision away from it. A
   one-page site with a staged hero has exactly two correct landing
   positions: the top, or the section named in the URL fragment.

   At module scope rather than in an effect, so it is set the moment
   this chunk evaluates — which is before React renders anything, and
   therefore before the browser has a rendered document to restore a
   position within. */
if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

/* ── Scroll on navigation ─────────────────────────────────────────
   Deliberately keyed on pathname alone. A hash-only change on the
   same page — every anchor in the nav while you are on the home page
   — is left to the browser, which already scrolls it smoothly; taking
   it over here would replace that with a jump.

   `/insights/<slug>` is folded onto `/` for the same reason. It is a
   modal route over the page that is already there, so opening a story,
   stepping to the next one and closing again are all one page as far
   as scrolling is concerned. Without this, opening a card would scroll
   the page to the top behind the overlay and closing it would leave
   you nowhere near the carousel you were reading.

   Every link on the site navigates with `scroll={false}` so that this
   is the only thing moving the page. See src/components/Link.tsx. */
const pageKey = (pathname: string) =>
  pathname.startsWith('/insights/') ? '/' : pathname;

function ScrollManager({ pathname }: { pathname: string }) {
  const last = useRef<string | null>(null);

  useEffect(() => {
    const key = pageKey(pathname);
    if (last.current === key) return;
    last.current = key;

    /* The new route has to paint before its sections exist to be
       found, so this waits a frame rather than running inline.

       The hash is read off `window` rather than from a hook: Next's
       `usePathname` excludes the fragment by design, and the fragment
       is only ever needed at the moment a navigation completes. */
    const raf = requestAnimationFrame(() => {
      const hash = window.location.hash;
      const target = hash ? document.getElementById(hash.slice(1)) : null;
      if (target) target.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      else window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}

/** The slug in `/projects/<slug>`, or null if this is not one. */
function projectSlug(pathname: string): string | null {
  if (!pathname.startsWith('/projects/')) return null;
  const slug = pathname.slice('/projects/'.length).replace(/\/+$/, '');
  return slug.length && !slug.includes('/') ? slug : null;
}

/** What this URL's document says its title is, read from the same
    table that wrote the served HTML — so the two cannot drift. */
function titleFor(pathname: string): string | null {
  if (pathname === '/') return homeSeo().title;
  if (pathname.startsWith(INSIGHT_PREFIX)) {
    const slug = pathname.slice(INSIGHT_PREFIX.length).replace(/\/+$/, '');
    return insightSeo(slug)?.title ?? null;
  }
  const slug = projectSlug(pathname);
  return slug ? (projectSeo(slug)?.title ?? null) : null;
}

/* ── The document title, on client-side navigation ────────────────
   Next writes a correct <title> into all twenty-three documents at
   build time, and updates it correctly when you navigate between two
   dynamic routes. It does not update it when you navigate *to* `/`.

   Measured, on the built export and again on production:

     /            -> /projects/x   title updates          ok
     /projects/a  -> /projects/b   title updates          ok
     /insights/x  -> /             title stays on the story
     /projects/x  -> /  (Back)     title goes EMPTY

   In the same navigations the description, og:title and canonical all
   revert correctly, so this is not metadata failing to resolve — it
   is the <title> element specifically, and only for the root route.
   Ruled out by testing each in turn: the explicit <head> in the root
   layout, the layout-level `title`, and static `metadata` versus
   `generateMetadata` on the home page. None of them was the cause.

   Closing a story is the common path — `/insights/<slug>` back to `/`
   is one Escape key — so the visible symptom was a reader closing a
   story and leaving the tab named after it.

   This sets the title from `titleFor`, which reads the same route
   table `app/` uses, so there is one source of truth and a route that
   changes its title cannot end up with two answers. It is a no-op on
   every navigation Next already gets right, including the first paint
   of every URL. */
function TitleManager({ pathname }: { pathname: string }) {
  useEffect(() => {
    const title = titleFor(pathname);
    if (title && document.title !== title) document.title = title;
  }, [pathname]);

  return null;
}

export function App() {
  /* `usePathname` is null only while the router is initialising, which
     cannot happen here — this tree is client-only and mounts after it. */
  const pathname = usePathname() ?? '/';

  const slug = projectSlug(pathname);
  const isHome = pathname === '/' || pathname.startsWith('/insights/');

  return (
    <div className="clip-x bg-ink">
      <ScrollManager pathname={pathname} />
      <TitleManager pathname={pathname} />
      <Nav />

      {isHome ? <Home /> : slug ? <ProjectPage slug={slug} /> : <NotFound />}

      <Footer />
    </div>
  );
}

export default App;
