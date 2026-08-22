import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { ArrowLeft, ArrowRight, BadgeCheck, Expand, X } from 'lucide-react';
import { SectionHeader } from './primitives';
import { useScrollLock } from '../lib/scroll-lock';
import { EASE_OUT, viewportOnce } from '../lib/motion';
import { CERTIFICATIONS, CERT_TRACKS, type Certification } from '../lib/certifications';
import { Picture } from './Picture';

/* ─────────────────────────────────────────────────────────────────
   Certifications.

   Eighteen documents, so the section is built as an archive rather
   than a card row: filter by track, scan the wall, open one full
   size. Three decisions worth knowing before editing.

   1. The thumbnails are desaturated until you point at one. Eighteen
      issuer palettes at full strength turn a strict bone/ink page into
      confetti; greyscale holds the grid together and gives the hover a
      job to do — colour arrives only where attention is.

   2. Card → lightbox is an entrance of its own, not a shared-element
      transition. It was one — `layoutId` on both media frames — and
      it collided with the scroll lock the dialog needs: pinning the
      body zeroes the document scroll, motion's projection measures in
      document coordinates, and on close the certificate was animated
      back across the page's entire scroll offset, in full view, after
      the dialog had gone. src/lib/scroll-lock.ts has the measurements.
      The lightbox now animates from values and measures nothing.

   3. Filtering re-mounts the list under `key={track}` instead of
      animating a reflow. A keyed swap with a stagger reads better than
      a grid of cards sliding into new cells, and cannot desync.

   Everything above is disabled under `prefers-reduced-motion`: no
   tilt, no glare, no stagger — the grid and the lightbox still work.

   Accent discipline: this section sits on bone, where #C8FF00 fails
   contrast. Selected state is ink-on-bone here; the bright accent only
   appears inside the lightbox, which is an ink surface.
   ───────────────────────────────────────────────────────────────── */

type Filter = 'All' | (typeof CERT_TRACKS)[number];

/* `restDelta` and `restSpeed` are the load-bearing half of this object.
   Without them the spring asymptotes rather than stopping: measured at
   5.7e-13 degrees still animating 733ms after the pointer left, and
   motion drives this through the Web Animations API, so a running
   animation on `transform` pins the card to its own composited layer
   for that entire time. One hover took the page from 52 composited
   layers to 67 and held it there for 795ms.

   0.05deg against a 7deg tilt is a hundred-and-fortieth of the travel —
   invisible, and it ends the animation the moment it stops being
   visible rather than when the maths runs out of float. */
const TILT_SPRING = {
  stiffness: 210,
  damping: 22,
  mass: 0.5,
  restDelta: 0.05,
  restSpeed: 0.5,
} as const;
/** Degrees of rotation at the far edge of a card. */
const TILT = 7;

/* ── Card ────────────────────────────────────────────────────────── */

interface CardProps {
  cert: Certification;
  index: number;
  reduced: boolean;
  onOpen: (index: number, node: HTMLButtonElement | null) => void;
}

function CertCard({ cert, index, reduced, onOpen }: CardProps) {
  const ref = useRef<HTMLButtonElement>(null);

  /* Pointer position over the card, normalised 0–1. Hooks cannot be
     conditional, so these are always created; the handlers that feed
     them are what gets withheld under reduced motion. */
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [TILT, -TILT]), TILT_SPRING);
  const rotateY = useSpring(useTransform(px, [0, 1], [-TILT, TILT]), TILT_SPRING);

  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  /* A vignette that lifts under the pointer rather than a white
     specular — the artwork is near-white, so white on white is
     invisible and darkening the surround is what reads as a light.
     Held at 0.16: at 0.30 the hovered card read *dimmer* than its
     neighbours, which fights the point of the hover (colour arrives
     where attention is). */
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(0,0,0,0) 0%, rgba(11,11,12,0.16) 74%)`;

  const track = (e: React.PointerEvent<HTMLElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const settle = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 26 },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
      }}
      style={{ perspective: 1100 }}
    >
      <motion.button
        ref={ref}
        type="button"
        onClick={() => onOpen(index, ref.current)}
        onPointerMove={track}
        onPointerLeave={settle}
        onBlur={settle}
        /* No `transformStyle: preserve-3d`. Nothing inside this button
           is positioned in 3D, so it bought nothing — and it put all
           eighteen cards into a permanent 3D rendering context, which
           stops the compositor flattening and caching them. The tilt
           reads identically from the `perspective` on the <li> alone. */
        style={reduced ? undefined : { rotateX, rotateY }}
        /* `h-full` and a column, so a two-line title does not make one
           card taller than the row. The grid stretches the <li>; without
           this the button sat at content height inside it and the row
           came out ragged.

           `transform` is deliberately NOT in the transition list, and
           there is no hover translate. motion owns this element's
           transform and rewrites it every frame; a CSS transition on the
           same property restarts a 300ms interpolation on every one of
           those frames. The `motion-safe:hover:-translate-y-1` that used
           to sit here never rendered either way — an inline transform
           beats a class one, so the lift was dead on arrival on every
           device, and it was the only reason `transform` was in the
           transition list at all. */
        className="group flex h-full w-full flex-col rounded-panel border border-black/12 bg-bone-raised p-3 text-left transition-[border-color,box-shadow] duration-300 ease-out hover:border-black/30 hover:shadow-[0_28px_60px_-32px_rgba(11,11,12,0.55)]"
      >
        {/* Media frame. */}
        <div className="relative shrink-0 overflow-hidden rounded-card border border-black/8 bg-white">
          {/* `object-contain`, not cover. Every file in
              public/certificates is normalised to exactly this ratio by
              scripts/normalise-certificates.mjs, so the two are
              identical today — but a scan dropped in at another ratio
              letterboxes on white here instead of having its edges cut
              off, and on a document that is the difference between a
              thumbnail and a mistake. */}
          {/* The zoom and the desaturation are deliberately on two
              different elements, and this is the expensive detail in the
              whole section.

              Both used to sit on the <img>: `transition-[filter,transform]`
              with `group-hover:scale-[1.03]` and `group-hover:grayscale-0`
              together. A CSS filter is resolved at raster time, so
              animating one *while the element is being scaled* makes the
              browser run a fresh full-size filter pass over a 1414x1000
              source on every frame — eighteen of these on the page, and
              the raster budget is shared with every other card. When it
              is exceeded Chromium serves blank tiles for whatever it has
              not finished, which is why hovering one certificate used to
              blank the one beside it for about a second.

              Split, the scale is a pure compositor transform on a wrapper
              that has no filter, and the filter animates at a fixed size
              where its result can be rastered once per step and reused.
              The wrapper is a plain block inside a display:contents
              <picture>, so the box tree and the rendered pixels are
              unchanged. */}
          <div className="transition-transform duration-500 ease-out group-hover:scale-[1.03]">
            <Picture
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
              src={cert.image}
              alt={`${cert.title} certificate issued by ${cert.issuer}`}
              loading="lazy"
              decoding="async"
              width={1414}
              height={1000}
              className="block aspect-[1414/1000] w-full object-contain grayscale transition-[filter] duration-500 ease-out group-hover:grayscale-0 group-focus-visible:grayscale-0"
            />
          </div>

          {!reduced && (
            <motion.span
              aria-hidden="true"
              style={{ backgroundImage: glare }}
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}

          {/* Affordance. Slides up on hover, always present for keyboard
              users the moment the card takes focus. */}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between gap-3 bg-ink/90 px-4 py-2.5 backdrop-blur-sm transition-transform duration-300 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0">
            <span className="font-mono text-meta-sm uppercase text-accent">View certificate</span>
            <Expand className="h-3.5 w-3.5 text-bone-raised" aria-hidden="true" />
          </span>
        </div>

        {/* Meta. `flex-1` takes the slack the media frame leaves, and
            the year is pushed to the bottom of it with `mt-auto` — so
            the years sit on one line across the row whether a title
            runs to one line or three, which is what stops the grid
            reading as ragged. */}
        <div className="flex flex-1 items-stretch justify-between gap-4 px-2 pb-1 pt-5">
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate font-mono text-meta-sm uppercase text-ink/55">{cert.issuer}</p>
            <h3 className="mt-2 font-display text-base font-bold leading-snug text-ink">
              {cert.title}
            </h3>
            <p className="mt-auto pt-3 text-sm text-ink/55">{cert.date}</p>
          </div>

          {cert.verified && (
            <span
              className="mt-0.5 shrink-0 self-start text-ink/70"
              title="Verified credential"
              aria-label="Verified credential"
            >
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </div>
      </motion.button>
    </motion.li>
  );
}

/* ── Lightbox ────────────────────────────────────────────────────── */

interface LightboxProps {
  list: Certification[];
  index: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}

function Lightbox({ list, index, onClose, onStep }: LightboxProps) {
  const cert = list[index];
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const reduced = useReducedMotion() ?? false;

  /* Focus lands on the close button, so Escape is not the only way out
     for someone who arrived here by keyboard. */
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useScrollLock();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onStep(1);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onStep(-1);
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      /* Trap. Without it Tab walks out of the dialog and onto the page
         behind, which is still rendered and still focusable. */
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, onStep]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      /* Out faster than in. An overlay arriving can afford to be
         unhurried; an overlay you have just dismissed is in the way. */
      exit={{ opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
    >
      {/* `/95`, not `/92`. The opacity modifier reads the theme's
          opacity scale, and a value that is not on it emits no CSS at
          all — the backdrop blurred the page behind without darkening
          it, and the certificate had to compete with the grid. */}
      <div
        className="absolute inset-0 bg-ink/95 backdrop-blur-xl"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full flex-col overflow-y-auto text-bone-raised"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-6 border-b border-white/12 bg-ink/80 px-gutter py-4 backdrop-blur-md">
          <p className="font-mono text-meta-sm uppercase text-bone-raised/55">
            <span className="text-accent">{pad(index + 1)}</span> / {pad(list.length)}
            <span className="mx-3 text-bone-raised/25">|</span>
            {cert.track}
          </p>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-mono text-meta-sm uppercase text-bone-raised/75 transition-colors duration-200 hover:border-accent hover:text-accent"
          >
            Close
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        {/* Centred on desktop, top-aligned when it stacks. The width
            cap is what makes centring safe: it holds the document's
            height under the space between the header and the footer,
            so a short viewport shrinks the certificate rather than
            clipping its top off against `items-center`. 1.414 is the
            artwork's aspect ratio. */}
        <div className="mx-auto grid w-full max-w-shell flex-1 grid-cols-1 items-start gap-10 px-gutter py-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-center lg:gap-14 lg:py-12">
          <motion.figure
            initial={reduced ? false : { opacity: 0, scale: 0.965, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.4, ease: EASE_OUT }}
            className="mx-auto w-full overflow-hidden rounded-panel border border-white/15 bg-white shadow-2xl lg:max-w-[calc((100svh_-_14rem)*1.414)]"
          >
            <Picture
              sizes="(min-width: 1024px) 55vw, 92vw"
              src={cert.image}
              alt={`${cert.title} certificate issued by ${cert.issuer}`}
              width={1414}
              height={1000}
              className="block aspect-[1414/1000] w-full object-contain"
            />
          </motion.figure>

          {/* Record. Keyed on the slug so the copy cross-fades as you
              step between certificates while the frame stays put. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={cert.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
            >
              <p className="font-mono text-meta-sm uppercase text-bone-raised/55">{cert.issuer}</p>
              <h2
                id={titleId}
                className="mt-4 text-balance font-display text-display-sm font-bold text-bone-raised"
              >
                {cert.title}
              </h2>

              {cert.verified && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent/40 px-3 py-1.5 font-mono text-meta-sm uppercase text-accent">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Verified
                </p>
              )}

              <p className="mt-6 max-w-prose text-sm leading-relaxed text-bone-raised/65">
                {cert.summary}
              </p>

              <ul className="mt-7 flex flex-wrap gap-2">
                {cert.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-bone-raised/75"
                  >
                    {skill}
                  </li>
                ))}
              </ul>

              <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/12 pt-7">
                <div>
                  <dt className="font-mono text-meta-sm uppercase text-bone-raised/45">Issued</dt>
                  <dd className="mt-1.5 text-sm text-bone-raised/85">{cert.date}</dd>
                </div>
                {/* Omitted, not blanked: several of these documents print
                    no credential number, and an empty "Credential ID"
                    row reads as a missing value rather than as one that
                    was never issued. */}
                {cert.credentialId && (
                  <div>
                    <dt className="font-mono text-meta-sm uppercase text-bone-raised/45">
                      Credential ID
                    </dt>
                    <dd className="mt-1.5 break-all font-mono text-xs text-bone-raised/85">
                      {cert.credentialId}
                    </dd>
                  </div>
                )}
              </dl>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <div className="sticky bottom-0 flex shrink-0 items-center justify-between gap-4 border-t border-white/12 bg-ink/80 px-gutter py-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => onStep(-1)}
            className="flex items-center gap-2.5 font-mono text-meta-sm uppercase text-bone-raised/75 transition-colors duration-200 hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </button>

          <p className="hidden font-mono text-meta-sm uppercase text-bone-raised/35 sm:block">
            Arrow keys to browse · Esc to close
          </p>

          <button
            type="button"
            onClick={() => onStep(1)}
            className="flex items-center gap-2.5 font-mono text-meta-sm uppercase text-bone-raised/75 transition-colors duration-200 hover:text-accent"
          >
            Next
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Section ─────────────────────────────────────────────────────── */

export function CertificationsWall() {
  const reduced = useReducedMotion() ?? false;
  const [filter, setFilter] = useState<Filter>('All');
  const [open, setOpen] = useState<number | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);

  const list = useMemo(
    () => (filter === 'All' ? CERTIFICATIONS : CERTIFICATIONS.filter((c) => c.track === filter)),
    [filter],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of CERTIFICATIONS) map.set(c.track, (map.get(c.track) ?? 0) + 1);
    return map;
  }, []);

  const handleOpen = useCallback((index: number, node: HTMLButtonElement | null) => {
    trigger.current = node;
    setOpen(index);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(null);
    /* Return focus to the card that opened the dialog, not to <body> —
       and `preventScroll`, because focusing a card that is only partly
       in view makes the browser scroll it into view, which fights the
       position the scroll lock is about to restore. Measured without
       it: the page came back 1,447px from where it was left. */
    trigger.current?.focus({ preventScroll: true });
  }, []);

  /* Wraps at both ends, so Previous on the first certificate is the
     last one rather than a dead button. */
  const handleStep = useCallback(
    (delta: number) => setOpen((i) => (i === null ? i : (i + delta + list.length) % list.length)),
    [list.length],
  );

  const chooseFilter = (next: Filter) => {
    setOpen(null);
    setFilter(next);
  };

  const filters: Filter[] = ['All', ...CERT_TRACKS];

  return (
    <LayoutGroup>
      <section
        id="certifications"
        className="relative z-10 bg-bone-sunk py-22 text-ink on-light sm:py-30"
        style={{ scrollMarginTop: 'var(--nav-h)' }}
      >
        <div className="mx-auto w-full max-w-shell px-gutter">
          <SectionHeader
            kicker="Certifications"
            tone="light"
            title={<>The paper behind the stack.</>}
            aside={
              <>
                {CERTIFICATIONS.length} credentials across {CERT_TRACKS.length} tracks. Open any one
                to read the certificate full size.
              </>
            }
          />

          {/* Filters */}
          <div
            role="group"
            aria-label="Filter certifications by track"
            className="mb-10 flex flex-wrap items-center gap-2.5 sm:mb-14"
          >
            {filters.map((name) => {
              const active = filter === name;
              const count = name === 'All' ? CERTIFICATIONS.length : (counts.get(name) ?? 0);

              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => chooseFilter(name)}
                  className={`relative rounded-full border px-4 py-2 font-mono text-meta-sm uppercase transition-colors duration-200 ${
                    active
                      ? 'border-ink text-bone-raised'
                      : 'border-black/15 text-ink/60 hover:border-black/40 hover:text-ink'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="cert-filter-pill"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    {name}
                    <span className={active ? 'text-accent' : 'text-ink/40'}>{count}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live count, for anyone who cannot see the grid change. */}
          <p aria-live="polite" className="sr-only">
            Showing {list.length} of {CERTIFICATIONS.length} certifications
            {filter === 'All' ? '' : ` in ${filter}`}.
          </p>

          {/* Grid. Re-mounted per filter so the new set staggers in
              rather than the old set sliding around. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.ul
              key={filter}
              initial="hidden"
              whileInView="show"
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              viewport={viewportOnce}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: reduced ? 0 : 0.055 } },
              }}
              /* `auto-rows-fr` makes every row the height of the tallest
                 card in the whole grid, not just the tallest in its own
                 row — otherwise row three stands 22px taller than row
                 one and the wall reads as ragged even though each row
                 is internally aligned. */
              className="grid auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7"
            >
              {list.map((cert, i) => (
                <CertCard
                  key={cert.slug}
                  cert={cert}
                  index={i}
                  reduced={reduced}
                  onOpen={handleOpen}
                />
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>
      </section>

      {/* Portalled so the dialog is never clipped by a section's
          stacking context or overflow.

          The portal wraps AnimatePresence and not the other way round.
          `createPortal()` returns a REACT_PORTAL_TYPE node, and
          `React.isValidElement()` is false for those, so AnimatePresence
          silently drops a portal handed to it as a child — the dialog
          never mounted at all the first time this was written. */}
      {createPortal(
        <AnimatePresence>
          {open !== null && list[open] && (
            <Lightbox list={list} index={open} onClose={handleClose} onStep={handleStep} />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </LayoutGroup>
  );
}
