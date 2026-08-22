'use client';

import NextLink from 'next/link';
import type { ComponentProps } from 'react';

/* ─────────────────────────────────────────────────────────────────
   The site's link, and the one place the scroll policy lives.

   This is `next/link` with a single default changed: `scroll={false}`.
   That default is not a preference, it is what keeps two systems from
   fighting over the same scrollbar.

   Next scrolls to the top of the document on every client navigation
   unless told not to. This site already has an opinion about that, in
   ScrollManager (src/App.tsx), and the opinion is more specific than
   "top":

     · `/insights/<slug>` is a modal route. It renders the same page as
       `/` with a story open over it, so opening a card, stepping to the
       next moment and closing again must not move the page at all —
       otherwise you close the overlay and find yourself at the top of
       the site rather than at the carousel you were reading.
     · `/#work` from a project page has to land on the section, not the
       top.
     · Everything else does go to the top.

   Two components implementing three rules between them is how a page
   ends up jumping once, and then jumping back. So navigation never
   scrolls, ScrollManager always does, and there is exactly one place
   to look when the page moves when it should not have.

   `scroll` is still a prop: pass `scroll` explicitly and this gets out
   of the way. Nothing currently needs to.
   ───────────────────────────────────────────────────────────────── */

type LinkProps = ComponentProps<typeof NextLink>;

export function Link({ scroll = false, ...rest }: LinkProps) {
  return <NextLink scroll={scroll} {...rest} />;
}

export default Link;
