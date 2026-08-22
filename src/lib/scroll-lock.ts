import { useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────────
   Scroll lock for a full-screen dialog.

   The obvious version — `document.body.style.overflow = 'hidden'` —
   is wrong, and quietly. Body overflow propagates to the viewport, so
   the document stops being scrollable, the browser clamps the scroll
   offset to zero, and the position is gone. Restore the overflow on
   close and you are at the top of the page, nowhere near the thing
   you opened. Behind an opaque backdrop nobody sees it happen; they
   just find themselves somewhere else afterwards.

   So the page is pinned instead of hidden. `position: fixed` with a
   negative `top` holds it exactly where it was — visually unchanged,
   and now genuinely unscrollable rather than scrolled-to-top — and
   the offset is scrolled back on release.

   A width has to go with the fixed position, because a fixed body
   shrinks to its content otherwise — but not `100%`. A fixed element's
   containing block is the viewport, and the viewport includes the
   scrollbar gutter that `scrollbar-gutter: stable` reserves on <html>,
   so `width: 100%` makes the body some fifteen pixels wider the moment
   it is pinned. Everything reflows inside the new width, the document
   changes height, and the page comes back a few pixels off. Measured:
   4px on a desktop, none on a phone, which is exactly the shape of a
   scrollbar bug. So the width is measured first and pinned in pixels.

   Fixed positioning on <body> does not create a containing block for
   fixed descendants — only transform, filter, perspective, contain and
   will-change do that — so a portalled `fixed inset-0` dialog still
   resolves against the viewport and sits where it should.

   One thing the lock rules out, and it belongs here because it was not
   obvious: nothing may run a *layout animation* across it. Pinning the
   body makes the document's scroll offset zero for as long as the
   dialog is up, and motion's projection records every box in document
   coordinates — client rect plus scroll. So a box measured while the
   page is pinned and the same box measured after release are the whole
   scroll offset apart, and motion animates the element across the
   difference: measured here at 27,958px, a photograph sliding down the
   page for the best part of a second after the dialog had gone.

   Which is why neither dialog shares a `layoutId` with the card that
   opened it. Both entrances animate from values, and measure nothing.

   The same zeroed offset is why the hero's pinned overlay checks its
   own rect rather than trusting `useScroll` — see the note beside
   `overlayVisibility` in src/HeroSection.tsx. Anything on this page
   that reads `scrollY` to decide whether it is on screen has to
   survive being told, truthfully but uselessly, that it is zero.
   ───────────────────────────────────────────────────────────────── */

/** Pin the page. Returns the release. */
export function lockScroll(): () => void {
  const y = window.scrollY;
  const width = document.body.getBoundingClientRect().width;
  const { style } = document.body;
  const previous = {
    position: style.position,
    top: style.top,
    width: style.width,
    overflow: style.overflow,
  };

  style.position = 'fixed';
  style.top = `-${y}px`;
  style.width = `${width}px`;
  style.overflow = 'hidden';

  return () => {
    style.position = previous.position;
    style.top = previous.top;
    style.width = previous.width;
    style.overflow = previous.overflow;
    window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
  };
}

/** The same thing for a component that is mounted only while open. */
export function useScrollLock() {
  useEffect(() => lockScroll(), []);
}
