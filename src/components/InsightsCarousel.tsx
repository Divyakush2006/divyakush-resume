import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';
import { Link } from './Link';
import { ArrowLeft, ArrowRight, MapPin, Pause, Play } from 'lucide-react';
import { SectionHeader } from './primitives';
import { InsightStory } from './InsightStory';
import { INSIGHTS } from '../lib/insights';
import { Picture } from './Picture';
import { useMediaQuery } from '../lib/useMediaQuery';

/* ─────────────────────────────────────────────────────────────────
   Insights — the run of years as a centre-stage carousel.

   Built after the Insights rail on governai.info: one slide held in
   the middle, its neighbours peeked and dimmed either side, a location
   chip and caption over the image, arrows and a dot rail beneath.
   Where this one goes further:

     · It advances itself. A ring around the pause control drains over
       the dwell, so the timer is visible rather than something that
       surprises you mid-sentence.
     · It stops when it should. Pointer over it, keyboard focus inside
       it, tab hidden, section scrolled off, or `prefers-reduced-
       motion` set — any one of those parks it, and there is an
       explicit play/pause for people who want the decision themselves.
       An autoplaying carousel with no way to stop it is a WCAG 2.2.2
       failure, not a style choice.
     · It is operable three ways: arrows, the dot rail, and dragging
       the deck. The reference is arrows and dots only, which leaves
       touch users pushing 8px targets.
     · Only the centre slide is reachable by tab or exposed to screen
       readers; the peeked neighbours are inert. Otherwise a keyboard
       user tabs into a card they cannot see the caption of.
     · A card opens, and it opens at its own URL. The caption over the
       photograph is two lines; the thing that actually happened is
       several paragraphs and has sources. Those live in an overlay,
       and the overlay is a route — `/insights/<slug>`, rendering the
       same page underneath. That is what makes a single moment
       linkable, shareable and reachable with Back, without it becoming
       a page of its own and taking you away from the deck. The whole
       card is the link; there is no button on it.

   ── Geometry ──────────────────────────────────────────────────────
   Slides are absolutely positioned at `left: 50%` and offset with a
   *percentage* x, which resolves against the slide's own width — so
   `-50%` centres it and `±STRIDE%` steps a neighbour out, with no
   container measurement and no resize observer to keep in sync.

   Distance is computed on the wrap, so slide 1 sits next to slide 12
   and the rail loops in both directions without a seam.
   ───────────────────────────────────────────────────────────────── */

/** Milliseconds a slide holds before advancing. */
const DWELL = 5200;
/** Neighbour offset, as a percentage of one slide's width.

   Must exceed the neighbour scale (0.82) or the peeked cards overlap
   the centre one. At 78 they did, and since every plate is dark the
   three of them fused into a single black band running edge to edge
   instead of reading as three separate cards. 92 leaves a visible gap
   at every width. */
const STRIDE = 92;
/** How many slides either side stay rendered. */
const VISIBLE = 2;
/** Pointer travel, in px, still counted as a tap rather than a drag.
    8 rather than 0: a tap on a touchscreen almost never lands on the
    pixel it started on, and treating that as a drag means the card
    silently refuses to open on exactly the devices where dragging is
    the primary gesture. */
const TAP_SLOP = 8;

const SPRING = { type: 'spring', stiffness: 210, damping: 30, mass: 0.9 } as const;

/* ── The side mirrors ─────────────────────────────────────────────
   Fill goes where a photograph falls short, and nowhere else.

   The photograph is hung from the top of the picture area at its own
   ratio, so it can only fall short in one of two ways. Short across
   the width leaves a column either side, and that gets a mirror: the
   whole picture again, flipped about the edge it sits against, so the
   pixels touching the seam on the mirror are the pixels touching it
   on the photograph. The content runs continuously out of the frame
   rather than a zoomed crop sitting near it, which is what makes it
   read as a reflection of *that* picture instead of a wash.

   Short down the height leaves a strip along the bottom — and that
   strip is directly above the caption, so it simply stays dark and
   joins the caption's ground. No mirror, because none is needed: the
   card already ends in a dark band there.

   That is the whole of it. No blurred copy behind the card, no fill
   behind the caption, nothing on an edge that is already flush.

   `translate` pushes each mirror a hair *under* the sharp copy. A
   24px blur samples past the element's own edges and feathers to
   transparent there, which would draw a pale seam line; tucking the
   edge beneath the copy that paints above it hides the feather.

   The mask fades each mirror out as it travels away from the seam, so
   it dissolves into the card's own ink rather than ending on a line. */
const MIRRORS = [
  { key: 'l', box: 'right-full top-0 translate-x-[26px]', flip: '-scale-x-100', to: 'left' },
  { key: 'r', box: 'left-full top-0 -translate-x-[26px]', flip: '-scale-x-100', to: 'right' },
] as const;

/** Opaque at the seam, gone by the far edge. */
function maskFor(to: string): React.CSSProperties {
  const image = `linear-gradient(to ${to}, #000 10%, rgba(0,0,0,0.55) 45%, transparent 88%)`;
  return {
    maskImage: image,
    WebkitMaskImage: image,
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
  };
}

/** Signed distance from `active` to `i`, wrapped to the shorter way round. */
function offset(i: number, active: number, count: number) {
  const half = Math.floor(count / 2);
  let d = i - active;
  if (d > half) d -= count;
  if (d < -half) d += count;
  return d;
}

/** The modal route's prefix. One string, so the parser below and
    every push above cannot drift apart. */
const INSIGHT_PREFIX = '/insights/';

export function InsightsCarousel() {
  const count = INSIGHTS.length;
  const reduced = useReducedMotion() ?? false;

  /* ── Mirrors are drawn where there is slack, and nowhere else ──
     The side mirrors fill the columns either side of a photograph
     narrower than its card. Whether there ARE any columns is a fact
     about two numbers — the card's aspect and the picture's — so it is
     answered by comparing them rather than by guessing at a
     breakpoint.

     It was a breakpoint for one release, gated at 768px, and the
     reasoning was sound at the time: every photograph in the set was
     landscape, a phone's card is portrait, so on a phone the picture
     already spanned the full width and the mirrors were rendering
     nothing but cost. Measured by scripts/audit-mirrors.mjs:

         390px   side slack   1px   — nothing to fill
         430px   side slack   1px   — nothing to fill
         768px   side slack  69px   — visible
        1440px   side slack  93px   — visible

     Then a portrait photograph joined the deck, and the premise went
     with it: at 0.66 in a 0.86 card it leaves 38px of bare ink down
     each side of a phone, which is exactly the case the mirrors were
     built for and exactly what the breakpoint was suppressing.

     So the gate is the measurement itself. `cardAspect` comes off a
     ResizeObserver on the card rather than from the CSS numbers
     restated in JavaScript — the box is `min(84vw, 760px)` by
     `clamp(380px, 44vw, 520px)`, and a copy of that here would be a
     second source of truth that drifts the first time either is tuned.

     The saving survives: a landscape picture in a phone's card still
     has no slack, still draws no mirrors, and none of the ten blurred,
     masked layers that cost the most on the weakest hardware come
     back. What changed is that the answer is now derived from the two
     boxes involved instead of asserted about a class of device. */
  const [cardAspect, setCardAspect] = useState(0);
  const cardBox = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = cardBox.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    /* Every card in the deck is the same box, so one is measured and
       the answer is used for all twelve. */
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setCardAspect(width / height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Covering the card is still a wide-screen move: on a phone the card
     is a portrait box, and covering a landscape picture into it crops
     the width, which is where the faces are. See `fill` in
     insights.ts. */
  const wide = useMediaQuery('(min-width: 768px)');

  const [active, setActive] = useState(0);
  const [wanted, setWanted] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);

  /* Which story is open is a fact about the URL, not about this
     component. `/insights/<slug>` renders the same page with the
     overlay up, so the state lives in the router and everything —
     opening, stepping, closing, the back button, a pasted link, a
     refresh — goes through the same one path. Holding it in `useState`
     as well would give two sources of truth that drift the first time
     someone presses Back. */
  /* The open story is read straight off the pathname rather than
     from route params. This component is mounted in the layout, above
     the route segment that owns `[slug]`, so asking the router for
     "the current params" would be asking from outside the segment they
     belong to. The pathname is unambiguous from anywhere. */
  const pathname = usePathname() ?? '/';
  const slug = pathname.startsWith(INSIGHT_PREFIX)
    ? pathname.slice(INSIGHT_PREFIX.length)
    : undefined;
  const router = useRouter();
  const open = slug ? INSIGHTS.findIndex((i) => i.slug === slug) : -1;
  const isOpen = open >= 0;

  const stageRef = useRef<HTMLDivElement>(null);
  /** The centre slide's link — the focus target when the overlay closes. */
  const cardLink = useRef<HTMLAnchorElement | null>(null);
  /** Where the pointer went down on the drag surface. */
  const down = useRef<{ x: number; y: number } | null>(null);

  /* Natural ratio per slide, learned when the file lands. The mirrors
     need to know where the photograph's edges actually are inside the
     card, and that is a fact about the file, not about the layout. Until
     it is known the slide renders exactly as it did before — sharp copy
     over the ambient ground — so nothing depends on this arriving. */
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const noteRatio = useCallback((slug: string, el: HTMLImageElement | null) => {
    if (!el?.naturalWidth || !el.naturalHeight) return;
    const r = el.naturalWidth / el.naturalHeight;
    setRatios((prev) => (prev[slug] === r ? prev : { ...prev, [slug]: r }));
  }, []);

  const step = useCallback(
    (delta: number) => setActive((i) => (i + delta + count) % count),
    [count],
  );

  const openStory = useCallback(
    (index: number) =>
      router.push(`/insights/${INSIGHTS[index].slug}`, { scroll: false }),
    [router],
  );

  /* `navigate(-1)` would be wrong here. It is right when the overlay
     was opened from this page, and wrong for every other way in — a
     pasted link, a refresh, a card opened after arriving from another
     route — where Back is somebody else's site. Going to `/` explicitly
     always lands where the overlay sat. */
  const closeStory = useCallback(() => router.push('/', { scroll: false }), [router]);

  /* Stepping replaces rather than pushes: eleven entries in the history
     stack because somebody held the arrow key down means eleven presses
     of Back to leave. One story, one entry. */
  const stepStory = useCallback(
    (delta: number) => {
      if (open < 0) return;
      const next = (open + delta + count) % count;
      router.replace(`/insights/${INSIGHTS[next].slug}`, { scroll: false });
    },
    [open, count, router],
  );

  /* The deck follows the overlay, so closing it leaves the card you
     were reading in the middle rather than wherever the timer had got
     to. Also what puts the right card up when a link is opened cold. */
  useEffect(() => {
    if (isOpen) setActive(open);
  }, [isOpen, open]);

  /* An unknown slug is not a page. Clean the URL rather than sitting on
     a path that renders nothing. */
  useEffect(() => {
    if (slug && open < 0) router.replace('/', { scroll: false });
  }, [slug, open, router]);

  /* Focus returns to the card that was opened, not to <body>. The
     overlay unmounts first, so this runs on the way back. */
  const wasOpen = useRef(false);
  useEffect(() => {
    /* `preventScroll`, because focusing a 520px card that is only
       partly in view makes the browser scroll it into view — which
       undoes the position the lock just restored. */
    if (wasOpen.current && !isOpen) cardLink.current?.focus({ preventScroll: true });
    wasOpen.current = isOpen;
  }, [isOpen]);

  /* The tab title tracks the open story, so a shared link and a
     bookmark both read as the thing they point at. */
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.title;
    document.title = `${INSIGHTS[open].title} — Divyakush Punjabi`;
    return () => {
      document.title = previous;
    };
  }, [isOpen, open]);

  /* Only run when every condition agrees, and never behind an open
     overlay — advancing the deck under a dialog means closing it
     returns you to a different slide than the one you opened. */
  const playing = wanted && !hovered && !focused && onScreen && !reduced && !isOpen;

  /* Park when the section is off screen: an invisible carousel burning
     a timer is wasted work, and it means someone scrolling back finds
     it where they left it rather than eleven slides on. */
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const io = new IntersectionObserver((entries) => setOnScreen(entries[0].isIntersecting), {
      threshold: 0.35,
    });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  /* Background tabs do not get a slideshow either. */
  useEffect(() => {
    const onVisibility = () => setOnScreen((v) => (document.hidden ? false : v));
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => step(1), DWELL);
    return () => window.clearInterval(id);
  }, [playing, step, active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    }
  };

  const current = INSIGHTS[active];

  return (
    <>
      <section
        id="insights"
        className="relative z-10 overflow-hidden bg-bone py-22 text-ink on-light sm:py-30"
        style={{ scrollMarginTop: 'var(--nav-h)' }}
      >
      <div className="mx-auto w-full max-w-shell px-gutter">
        <SectionHeader
          kicker="Insights"
          tone="light"
          title={<>Two years, in the order they happened.</>}
          aside={
            <>
              Campus, competition floors and production. {count} moments between the first year of
              the degree and leading engineering across two live platforms.
            </>
          }
        />
      </div>

      {/* Stage. Full-bleed rather than inside the shell, so the peeked
          neighbours run to the edge of the viewport the way the
          reference does instead of stopping at a gutter. */}
      <div
        ref={stageRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Moments over the years"
        onKeyDown={onKeyDown}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
        /* The card box is fixed and stays fixed. Everything that had to
           change to stop the caption covering the photograph was solved
           by dividing this space differently, not by taking more of it:
           see the article below, and the blurb under the controls. */
        className="relative mx-auto mt-2 h-[clamp(380px,44vw,520px)] w-full"
      >
        {INSIGHTS.map((item, i) => {
          const d = offset(i, active, count);
          const near = Math.abs(d) <= VISIBLE;
          const on = d === 0;
          const ratio = ratios[item.slug];
          /* Filling and mirroring are mutually exclusive by definition:
             a photograph that covers the card has no column left to
             mirror into. Below that, `slack` is the question the
             mirrors exist to answer: is the fitted box narrower than
             the card it sits in? The picture is fitted by height when
             its ratio is the smaller of the two, and what is left over
             either side is what gets mirrored. The 0.01 is there so a
             picture that matches its card to three decimal places does
             not draw two invisible layers. */
          const fills = item.fill && wide;
          const slack = ratio !== undefined && cardAspect > 0 && ratio < cardAspect - 0.01;

          return (
            <motion.article
              key={item.slug}
              aria-hidden={on ? undefined : true}
              animate={{
                x: `${d * STRIDE - 50}%`,
                scale: on ? 1 : 0.82,
                opacity: near ? 1 : 0,
              }}
              transition={reduced ? { duration: 0 } : SPRING}
              style={{
                left: '50%',
                zIndex: 20 - Math.abs(d),
                pointerEvents: on ? 'auto' : 'none',
              }}
              ref={(el) => {
                /* One card, measured, for all of them — see cardAspect. */
                if (i === 0) cardBox.current = el;
              }}
              className="absolute top-0 h-full w-[min(84vw,760px)] overflow-hidden rounded-panel border border-black/12 bg-ink shadow-2xl"
            >
              {/* ── The photograph ────────────────────────────────
                  The whole of it, at its own ratio — every face in the
                  frame is on screen, never cropped by the card.

                  Hung from the top, not centred (`object-top`), and
                  that is the load-bearing part. A picture wider than
                  the card leaves its slack along the bottom, which is
                  exactly where the caption sits, so the type lands on
                  empty ground instead of across somebody's face. A
                  picture narrower than the card leaves its slack down
                  the sides, and that is what the mirrors fill.

                  `container-type: size` makes 100cqw/100cqh resolve
                  against this box, which is how the mirrors know where
                  the photograph's edges are without measuring anything
                  in JavaScript. */}
              <div
                className={`absolute inset-0 [container-type:size] transition-[filter] duration-500 ease-out ${
                  on ? 'brightness-100' : 'brightness-[0.45]'
                }`}
              >
                {/* Side mirrors, and only when there is a side to fill.
                    See MIRRORS above. Gated on `near`: the far slides
                    sit at opacity 0, and blurred layers across all of
                    them is compositing work for pixels nobody can see.
                    VISIBLE is 2, so a slide is always mirrored well
                    before it animates into view. */}
                {near && slack && !fills && (
                  <div
                    aria-hidden="true"
                    /* The fitted box, to the pixel: exactly the box
                       `object-contain object-top` gives the sharp copy. */
                    style={{
                      width: 'min(100cqw, calc(100cqh * ' + ratio + '))',
                      height: 'min(100cqh, calc(100cqw / ' + ratio + '))',
                    }}
                    className="absolute left-1/2 top-0 -translate-x-1/2"
                  >
                    {MIRRORS.map((m) => (
                      <div
                        key={m.key}
                        style={maskFor(m.to)}
                        className={'absolute h-full w-full ' + m.box}
                      >
                        <Picture
                          sizes="(min-width: 1024px) 25vw, 30vw"
                          src={item.image}
                          alt=""
                          aria-hidden="true"
                          decoding="async"
                          draggable={false}
                          className={
                            /* Brightness stays near 1 on purpose. Dimming
                               the mirror puts a tonal step right on the
                               seam, where the two copies touch and any
                               step is most visible; the recession comes
                               from the mask fading into the darker
                               ground instead. */
                            'h-full w-full select-none object-fill blur-xl saturate-[1.1] brightness-[0.95] ' +
                            m.flip
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}

                <Picture
                  sizes="(min-width: 1024px) 60vw, 92vw"
                  src={item.image}
                  alt={on ? `${item.title}${item.location ? `, ${item.location}` : ''}` : ''}
                  loading={Math.abs(d) <= 1 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                  ref={(el) => {
                    /* A cached file is already decoded by the time the
                       ref runs, and `load` never fires for it. */
                    if (el?.complete) noteRatio(item.slug, el);
                  }}
                  onLoad={(e) => noteRatio(item.slug, e.currentTarget)}
                  className={`relative h-full w-full select-none object-top ${
                    fills ? 'object-cover' : 'object-contain'
                  }`}
                />
              </div>

              {/* ── Caption ───────────────────────────────────────
                  Over the photograph, on a scrim — a wash of the card's
                  own ink, heaviest at the bottom edge and gone by the
                  time it reaches the middle. Not a panel and not a
                  fill: the picture still reads through it. Its only job
                  is to separate white type from whatever tone happens
                  to be underneath, which on a bright photograph is the
                  difference between legible and not.

                  It sits low because the photograph is hung from the
                  top: any slack in the frame collects here, so on most
                  slides this is washing empty ground rather than
                  anybody's face.

                  Shown only on the centre slide — the neighbours are at
                  82% and clipped, and copy at that size is noise rather
                  than information. */}
              <div
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 via-ink/70 to-transparent p-6 transition-opacity duration-300 sm:p-9 ${
                  on ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {item.location && (
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-ink/60 px-3 py-1.5 font-mono text-meta-sm uppercase text-accent backdrop-blur-sm">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {item.location}
                  </p>
                )}
                <h3 className="text-balance font-display text-display-sm font-bold text-bone-raised">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-bone-raised/80 sm:text-base">
                  {item.blurb}
                </p>

              </div>

              {/* The whole card is the link, and it carries no chrome of
                  its own — a button over the photograph was one control
                  too many on a surface that already reads as clickable.

                  It is a real <a href>, not a click handler, so it can
                  be focused, opened in a new tab, copied, and read by a
                  screen reader as what it is. Pointer clicks never reach
                  it — the drag surface above catches those and works out
                  tap from drag — but keyboard reaches it, which is the
                  entire reason it exists rather than nothing at all.
                  Only the centre slide is reachable; the neighbours are
                  taken out of the tab order. */}
              <Link
                ref={(el) => {
                  if (on) cardLink.current = el;
                }}
                href={`/insights/${item.slug}`}
                tabIndex={on ? 0 : -1}
                aria-hidden={on ? undefined : true}
                className="absolute inset-0 z-20 rounded-panel outline-none ring-inset ring-accent focus-visible:ring-2"
              >
                <span className="sr-only">Read the story: {item.title}</span>
              </Link>
            </motion.article>
          );
        })}

        {/* Drag surface. Sits above the deck so a drag anywhere across
            the stage works, and below nothing that needs clicking —
            the controls are outside the stage.

            It also has to pass taps through to the card, because it
            covers the card completely and a card now opens. It cannot
            simply be moved below the deck: the neighbours are
            `pointer-events: none` and a drag has to start on them too.
            So it decides for itself — record where the pointer went
            down, and on release treat anything inside TAP_SLOP as a
            click on the centre slide rather than a failed drag.

            Keyboard users never reach this (it is `aria-hidden`); the
            stretched link on the card is their way in. */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onPointerDownCapture={(e) => {
            down.current = { x: e.clientX, y: e.clientY };
          }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) step(1);
            else if (info.offset.x > 60) step(-1);
          }}
          onClick={(e) => {
            const from = down.current;
            if (!from) return;
            const travelled = Math.hypot(e.clientX - from.x, e.clientY - from.y);
            if (travelled <= TAP_SLOP) openStory(active);
          }}
          className="absolute inset-0 z-30 cursor-pointer"
          aria-hidden="true"
        />

        {/* Edge fades. The deck is full-bleed, so without these the
            outermost cards are cut off by a hard viewport edge. Fading
            them into the surface makes the rail read as continuing past
            the screen rather than being sliced by it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-40 w-[10vw] bg-gradient-to-r from-bone to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-40 w-[10vw] bg-gradient-to-l from-bone to-transparent"
        />
      </div>

      {/* ── Controls ── */}
      <div className="mx-auto mt-10 w-full max-w-shell px-gutter">
        <div className="flex flex-col items-center gap-6">
          {/* Live region: the only announcement of a slide change for
              anyone who cannot see the deck move. */}
          <p aria-live="polite" className="sr-only">
            Slide {active + 1} of {count}: {current.title}
            {current.location ? `, ${current.location}` : ''}. {current.date}.
          </p>


          {/* Buttons and readout on one row, dot rail on its own below.
              They shared a row at first, and at 390px the twelve dots
              pushed pause and next past the section's `overflow-hidden`
              edge — the controls were not merely cramped, they were
              unreachable. Split like this the rail has the full width
              to itself and still fits on one line at 390. */}
          <div className="flex w-full items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous moment"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-black/15 text-ink/70 transition-colors duration-200 hover:border-ink hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Counter and dwell bar. The bar restarts on `active` via
                the key, so it tracks the timer that is actually running
                rather than a second one that can drift out of step. */}
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <p className="font-mono text-meta-sm uppercase text-ink/55">
                <span className="text-ink">{String(active + 1).padStart(2, '0')}</span> /{' '}
                {String(count).padStart(2, '0')}
              </p>
              <span
                aria-hidden="true"
                className="hidden h-px w-16 overflow-hidden bg-black/15 sm:block sm:w-24"
              >
                <motion.span
                  key={`${active}-${playing}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: playing ? 1 : 0 }}
                  transition={{ duration: playing ? DWELL / 1000 : 0, ease: 'linear' }}
                  className="block h-full w-full origin-left bg-ink"
                />
              </span>
              <p className="font-mono text-meta-sm uppercase text-ink/45">{current.date}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setWanted((v) => !v)}
                aria-label={wanted ? 'Pause the slideshow' : 'Play the slideshow'}
                className="grid h-11 w-11 place-items-center rounded-full border border-black/15 text-ink/70 transition-colors duration-200 hover:border-ink hover:text-ink"
              >
                {wanted ? (
                  <Pause className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Play className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next moment"
                className="grid h-11 w-11 place-items-center rounded-full border border-black/15 text-ink/70 transition-colors duration-200 hover:border-ink hover:text-ink"
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Dot rail. Each dot is a real button with a 40px tall hit
              area around a 3px mark — the reference's bare dots are
              below every minimum target size there is. */}
          <ul className="flex flex-wrap items-center justify-center gap-x-0.5 gap-y-0 sm:gap-x-1.5">
            {INSIGHTS.map((item, i) => {
              const on = i === active;
              return (
                <li key={item.slug}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`Go to ${item.title}`}
                    aria-current={on ? 'true' : undefined}
                    className="group grid h-10 place-items-center px-2"
                  >
                    <span
                      className={`block h-[3px] rounded-full transition-all duration-300 ease-out ${
                        on ? 'w-8 bg-ink' : 'w-2.5 bg-black/20 group-hover:w-4 group-hover:bg-black/45'
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
          </div>
        </div>
      </section>

      {/* Portalled so the dialog is never clipped by the section's
          `overflow-hidden` — which the deck needs and a full-screen
          dialog cannot live inside.

          The portal wraps AnimatePresence rather than the other way
          round. `createPortal()` returns a REACT_PORTAL_TYPE node and
          `React.isValidElement()` is false for those, so
          AnimatePresence silently drops a portal handed to it as a
          child. */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <InsightStory
              list={INSIGHTS}
              index={open}
              onClose={closeStory}
              onStep={stepStory}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
