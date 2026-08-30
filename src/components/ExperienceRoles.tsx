import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useMotionValueEvent, useTransform } from 'motion/react';
import { SectionHeader } from './primitives';
import { useMediaQuery } from '../lib/useMediaQuery';
import { ROLES, type Role } from '../lib/roles';

/* ─────────────────────────────────────────────────────────────────
   Experience.

   The frame locks when the section arrives, and five full-frame
   cards pass through it right to left as you scroll down. One card
   is on screen at a time; the page carries on underneath once the
   last one has gone by.

   ── Full frame changes the card, not just its width ───────────────
   A card sized to a third of the frame is a portrait: one column,
   everything stacked, and the delivery list is the only place the
   eye can go. Sized to the whole frame it is a landscape, and a
   landscape can carry the layout a corporate record actually wants —
   identity and specification on the left, the remit in the middle,
   the outcome hung off the right margin, and the delivery broken
   into columns underneath.

   That is why the card is laid out as a dossier and not as a list:

     · A specification table. `Engagement` and `Term` set as labelled
       rows is the idiom every professional services record uses,
       because it is the part a reviewer scans rather than reads.
     · The delivery in columns rather than a single run, so four
       items are four parallel facts instead of a queue.
     · The outcome against the right margin at display size, on its
       own rule. It is the one number the card is judged on.

   ── The mechanism ─────────────────────────────────────────────────
   A tall outer element with a `sticky` child one viewport high. The
   browser owns the pinning, so it survives any scroll speed and a
   reload part-way through and costs nothing on the main thread.
   Progress across the outer maps to `translateX` on the row.

   How far the row travels is measured, never assumed — card width is
   a percentage of a frame that is itself a clamped shell, and a
   hard-coded distance that is a few pixels wrong leaves either a
   strip of dead space after the last card or a last card that never
   quite lands. A ResizeObserver on the row and the frame keeps the
   real number.

   ── Damping ───────────────────────────────────────────────────────
   Scroll drives a spring and the spring drives the row, so it keeps
   moving briefly after the wheel stops and settles rather than
   halting. Raw scroll-linked motion is rigid in a way people read as
   cheap even when they cannot say why.

   ── When it does not lock ─────────────────────────────────────────
   A full-frame card needs a frame worth filling. Below 1024px wide
   or 720px tall — and for anyone who asked for reduced motion — the
   row becomes a native horizontal snap scroller and the card falls
   back to its single-column form. Same cards, same order, same
   gesture, done by the browser instead of simulated.
   ───────────────────────────────────────────────────────────────── */


const STEPS = ROLES.length;

/* Scroll budget. `PIN_HEIGHT` has to be a complete literal for
   Tailwind to emit it: one viewport for the locked frame plus the
   travel, at roughly nine tenths of a viewport of scroll per card
   change. Four changes, so 360svh. */
const PIN_HEIGHT = 'h-[calc(100svh+360svh)]';

/* Cards fill the frame, so the card being read is simply the one
   whose left edge is at the frame's left edge. */
const READING_LINE = 0;

/* ── Dwell ──
   Mapping scroll straight onto travel is what a third-width card can
   get away with, because there is always a whole card somewhere in
   the frame. A full-frame card cannot: every position between two
   cards is two half-cards, so a linear mapping means the reader
   spends most of the section looking at a seam and the only place
   card one is correctly framed is the single instant at progress
   zero.

   So the mapping is shaped. Each card holds still for `DWELL` of the
   scroll and then moves over in `SHIFT`, which makes the section a
   sequence of readable states with movement between them rather than
   one continuous slide. Five dwells and four shifts, and they have
   to sum to exactly 1 or the last card never lands. */
const DWELL = 0.12;
const SHIFT = 0.1;
const CYCLE = DWELL + SHIFT;

/** Where the row is, in cards, at a given scroll progress. */
function cardAt(progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  const index = Math.min(STEPS - 1, Math.floor(p / CYCLE));
  const within = p - index * CYCLE;
  if (within <= DWELL) return index;
  return Math.min(STEPS - 1, index + (within - DWELL) / SHIFT);
}

/** A full-frame card needs a frame worth filling. */
const WIDE_QUERY = '(min-width: 1024px) and (min-height: 720px)';
const CALM_QUERY = '(prefers-reduced-motion: reduce)';

/* The damping that does most of the work. Soft enough to keep moving
   after the wheel stops, stiff enough that clicking a name in the
   index still feels like a direct answer. */
const GLIDE = { stiffness: 110, damping: 30, mass: 0.55, restDelta: 0.001 };


export function ExperienceRoles() {
  const [active, setActive] = useState(0);

  const outerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLOListElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);

  const wide = useMediaQuery(WIDE_QUERY);
  const calm = useMediaQuery(CALM_QUERY);
  const locked = wide && !calm;

  /* How far the row has to travel, measured rather than assumed. */
  const [distance, setDistance] = useState(0);
  const distanceRef = useRef(0);
  distanceRef.current = distance;

  useLayoutEffect(() => {
    const measure = () => {
      const row = rowRef.current;
      const frame = frameRef.current;
      if (!row || !frame) return;
      setDistance(Math.max(0, row.scrollWidth - frame.clientWidth));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    if (rowRef.current) ro.observe(rowRef.current);
    if (frameRef.current) ro.observe(frameRef.current);
    return () => ro.disconnect();
  }, [locked]);

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  });

  /* Scroll drives a spring, and the spring drives the row. */
  const glide = useSpring(scrollYProgress, GLIDE);

  /* The dwell, as keyframes: a pair of stops per card holding the
     same position, with the shift falling out of the interpolation
     between one card's second stop and the next card's first. Built
     from `distance` rather than closed over it, so a resize rebuilds
     the mapping instead of leaving it pointing at a stale width. */
  const [stops, positions] = React.useMemo(() => {
    const unit = distance / Math.max(1, STEPS - 1);
    const ins: number[] = [];
    const outs: number[] = [];
    for (let i = 0; i < STEPS; i += 1) {
      const start = i * CYCLE;
      ins.push(start, start + DWELL);
      outs.push(-i * unit, -i * unit);
    }
    return [ins, outs];
  }, [distance]);

  const x = useTransform(glide, stops, positions);
  const fill = useTransform(glide, [0, 1], ['0%', '100%']);

  /* Which card is in the frame. Off raw scroll rather than the
     spring: the index should answer immediately and let the row
     catch up to it. */
  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    if (!locked) return;
    const next = Math.round(cardAt(value));
    setActive((current) => (current === next ? current : next));
  });

  const nearestCard = (scrolled: number) => {
    const frame = frameRef.current;
    /* Running out of travel means you are on the last card. Belt and
       braces now that cards fill the frame — but it was load-bearing
       when they did not, and it costs one comparison. */
    const limit = locked ? distanceRef.current : (frame?.scrollWidth ?? 0) - (frame?.clientWidth ?? 0);
    if (limit > 0 && scrolled >= limit - 1) return STEPS - 1;

    const line = (frame?.clientWidth ?? 0) * READING_LINE;
    let best = 0;
    let bestGap = Infinity;
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const gap = Math.abs(el.offsetLeft - scrolled - line);
      if (gap < bestGap) {
        bestGap = gap;
        best = i;
      }
    });
    return best;
  };

  /** Move to a card. Locked that means scrolling the page, because
      scroll position is what decides where the row is; unlocked it
      means scrolling the row, for the same reason. */
  const goTo = useCallback(
    (index: number) => {
      const next = Math.min(STEPS - 1, Math.max(0, index));
      const card = cardRefs.current[next];
      const frame = frameRef.current;
      const outer = outerRef.current;
      if (!card || !frame) return;

      const line = frame.clientWidth * READING_LINE;

      if (!locked) {
        frame.scrollTo({ left: Math.max(0, card.offsetLeft - line), behavior: 'smooth' });
        setActive(next);
        return;
      }
      if (!outer) return;

      const top = outer.getBoundingClientRect().top + window.scrollY;
      const length = outer.offsetHeight - window.innerHeight;
      /* The middle of the card's dwell, not its leading edge: landing
         on the boundary puts the reader one wheel notch from being
         half-way into the next card. */
      const progress = Math.min(1, next * CYCLE + DWELL / 2);
      window.scrollTo({ top: top + length * progress });
    },
    [locked]
  );

  /* Unlocked, the row is the source of truth and the index follows
     it — otherwise a swipe would move the cards without moving the
     mark that says which one you are on. */
  const onScroll = () => {
    if (locked) return;
    setActive(nearestCard(frameRef.current?.scrollLeft ?? 0));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = STEPS - 1;
    let next: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = active === last ? 0 : active + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = active === 0 ? last : active - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next === null) return;
    event.preventDefault();
    goTo(next);
  };

  return (
    <section
      id="experience"
      className="relative z-10 bg-bone-sunk text-ink on-light"
      style={{ scrollMarginTop: '0px' }}
    >
      <div className="mx-auto w-full max-w-shell px-gutter pt-22 sm:pt-30">
        <SectionHeader
          kicker="Experience"
          tone="light"
          title={<>Where I've done the work.</>}
          aside={
            locked
              ? 'Five roles across product startups, an AI governance lab, and a BASF partner. Scroll to move through the record.'
              : 'Five roles across product startups, an AI governance lab, and a BASF partner. Swipe the record, or pick a role.'
          }
        />
      </div>

      <div ref={outerRef} className={`relative ${locked ? PIN_HEIGHT : ''}`}>
        {/* The nav is fixed for the whole document, so a frame locked
            to `top-0` is locked underneath it. */}
        <div
          className={`flex w-full flex-col ${
            locked ? 'sticky top-0 h-[100svh] pt-[var(--nav-h)]' : 'pb-22 sm:pb-30'
          }`}
        >
          <div className="mx-auto flex w-full max-w-shell flex-1 flex-col px-gutter pb-6 pt-3">
            {/* ── Frame chrome ── */}
            <div className="flex shrink-0 items-baseline justify-between gap-6 pb-3">
              <p className="font-mono text-meta-sm uppercase text-ink/45">
                The record · 2025 — Present
              </p>
              <p className="font-mono text-meta-sm tabular-nums text-ink/30">
                <span className="text-ink/70">{String(active + 1).padStart(2, '0')}</span>
                {` / ${String(STEPS).padStart(2, '0')}`}
              </p>
            </div>

            {/* ── The row ──
                Locked, this is a transform on a motion value and the
                frame never scrolls. Unlocked, the frame is a native
                snap scroller and the row is static. Both paths render
                the same cards in the same order. */}
            <div
              ref={frameRef}
              onScroll={onScroll}
              className={`relative min-h-0 flex-1 ${
                locked
                  ? 'overflow-hidden'
                  : '-mx-gutter snap-x snap-mandatory overflow-x-auto overscroll-x-contain px-gutter [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              }`}
            >
              <motion.ol
                ref={rowRef}
                style={locked ? { x } : undefined}
                className={`flex gap-5 will-change-transform sm:gap-6 ${locked ? 'h-full' : 'py-1'}`}
              >
                {ROLES.map((role, i) => (
                  <li
                    key={role.company}
                    /* Block body, not an expression body. React 19
                       treats a value returned from a ref callback as a
                       cleanup function, so `(el) => (refs[i] = el)` now
                       hands React an element where it expects a
                       function to call on unmount. */
                    ref={(el) => {
                      cardRefs.current[i] = el;
                    }}
                    className={`shrink-0 snap-start ${locked ? 'h-full w-full' : 'w-[min(86vw,30rem)]'}`}
                  >
                    <Card role={role} index={i} wide={locked} />
                  </li>
                ))}
              </motion.ol>
            </div>

            {/* ── The index ──
                Also the scrollbar. A row that moves sideways under a
                gesture that does not is the one arrangement where a
                reader has no idea how much is left, so the rule
                fills. */}
            <div className="shrink-0 pt-5">
              <div className="relative h-px w-full bg-black/15">
                {locked && (
                  <motion.span
                    aria-hidden="true"
                    style={{ width: fill }}
                    className="absolute inset-y-0 left-0 bg-ink"
                  />
                )}
              </div>

              <div
                role="group"
                aria-label="Jump to a role"
                onKeyDown={onKeyDown}
                className="-mx-gutter mt-3 flex items-center gap-6 overflow-x-auto px-gutter [scrollbar-width:none] lg:mx-0 lg:justify-between lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
              >
                {ROLES.map((role, i) => {
                  const current = i === active;
                  return (
                    <button
                      key={role.company}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={current ? 'true' : undefined}
                      tabIndex={current ? 0 : -1}
                      className="group flex shrink-0 items-baseline gap-2.5 py-1 text-left"
                    >
                      <span
                        className={`font-mono text-meta-sm uppercase tabular-nums transition-colors duration-300 ${
                          current ? 'text-ink' : 'text-ink/30'
                        }`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`font-display text-[0.9375rem] font-bold leading-none transition-colors duration-300 ${
                          current ? 'text-ink' : 'text-ink/40 group-hover:text-ink/70'
                        }`}
                      >
                        {role.company}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── One card ─────────────────────────────────────────────────────
   A record sheet, ruled into bands. `wide` is the full-frame
   landscape; without it the same content sets as a single column,
   which is the only arrangement that works in a phone's width. */
function Card({ role, index, wide }: { role: Role; index: number; wide: boolean }) {
  return (
    <article className="flex h-full flex-col border border-black/12 bg-bone-raised shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Masthead. The index and the term, ruled off from the record
          the way a document header is ruled off from its body. */}
      <header className="flex shrink-0 items-baseline justify-between gap-6 border-b border-black/12 px-6 py-3.5 sm:px-8 lg:px-10">
        {/* The index alone. It read "Record 01 of 05" while the frame
            chrome directly above the card already said 01 / 05 — the
            same fact twice, eleven words apart. */}
        <p className="font-mono text-meta-sm uppercase tabular-nums text-ink/45">
          {String(index + 1).padStart(2, '0')}
        </p>
        <p className="font-mono text-meta-sm uppercase text-ink/45">{role.period}</p>
      </header>

      <div
        className={`flex min-h-0 flex-1 flex-col px-6 py-6 sm:px-8 lg:px-10 ${wide ? 'lg:py-8' : ''}`}
      >
        <div className={wide ? 'grid grid-cols-12 gap-x-10' : ''}>
          {/* Identity, and the specification under it. A labelled
              table is the part of a professional record a reviewer
              scans rather than reads, which is exactly why it is set
              as a table and not as another paragraph. */}
          <div className={wide ? 'col-span-4' : ''}>
            <h3 className="font-display text-[clamp(1.75rem,3.4vw,3.25rem)] font-bold leading-[0.94] tracking-[-0.035em] text-ink">
              {role.company}
            </h3>
            <p className="mt-2 text-lede text-ink/55">{role.title}</p>

            <dl className="mt-6 border-t border-black/12">
              {[
                ['Engagement', role.mode],
                ['Term', role.term],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 border-b border-black/12 py-2.5"
                >
                  <dt className="font-mono text-meta-sm uppercase text-ink/40">{label}</dt>
                  <dd className="text-[13px] leading-snug text-ink/75">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* The remit. */}
          <div className={wide ? 'col-span-5 col-start-6' : 'mt-6'}>
            <p className="font-mono text-meta-sm uppercase text-ink/40">Mandate</p>
            <p className="mt-3 text-lede leading-relaxed text-ink/80">{role.mandate}</p>
          </div>

          {/* The outcome, hung off the right margin on its own rule.
              It is the one number the card is judged on, and at body
              size among three other paragraphs it was being found
              last rather than first. */}
          <div
            className={
              wide
                ? 'col-span-3 col-start-10 border-l border-black/12 pl-8'
                : 'mt-6 border-t border-black/12 pt-5'
            }
          >
            <p className="font-mono text-meta-sm uppercase text-ink/40">Outcome</p>
            <p className="mt-3 font-display text-[clamp(1.75rem,2.4vw,2.5rem)] font-bold leading-none tracking-[-0.03em] text-ink">
              {role.outcome.value}
            </p>
            <p className="mt-3 text-sm leading-snug text-ink/55">{role.outcome.label}</p>
          </div>
        </div>

        {/* Delivery, broken into columns. Four items across read as
            four parallel facts; the same four stacked read as a
            queue, which is not what they were.

            The band is ruled off across the full width. A full-frame
            card is far taller than this content, so `mt-auto` leaves
            a stretch of empty card above the delivery — and empty
            space between two blocks reads as a mistake, while the
            same space under a rule reads as a division. */}
        <div className="mt-auto border-t border-black/15 pt-6">
          <p className="font-mono text-meta-sm uppercase text-ink/40">Selected delivery</p>
          <ol className={`mt-4 grid gap-x-10 ${wide ? 'grid-cols-2 xl:grid-cols-4' : ''}`}>
            {role.work.map((item, i) => (
              <li key={item} className="border-t border-black/12 py-3.5">
                <span className="block font-mono text-meta-sm tabular-nums text-ink/30">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-ink/75">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Colophon. The stack as a run of prose, not tokens in
          containers: six rounded chips is six more boxes than six
          words need. */}
      <footer className="shrink-0 border-t border-black/12 px-6 py-3.5 sm:px-8 lg:px-10">
        <p className="font-mono text-meta-sm uppercase leading-loose text-ink/45">
          {role.stack.map((item, i) => (
            <React.Fragment key={item}>
              {i > 0 && <span className="text-ink/25"> · </span>}
              {item}
            </React.Fragment>
          ))}
        </p>
      </footer>
    </article>
  );
}
