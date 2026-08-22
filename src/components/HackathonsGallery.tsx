import { asset } from '../lib/asset';
import React, { useState } from 'react';
import { Link } from './Link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { SectionHeader } from './primitives';
import { riseIn, viewportOnce } from '../lib/motion';

import _compNec from '../assets/comp_nec.webp';
import _compSih from '../assets/comp_sih.webp';
import _compEy from '../assets/comp_ey.webp';
import _compDevjams from '../assets/comp_devjams.webp';

import { Picture } from './Picture';

/* Vite resolved these imports to URL strings; Next resolves them to
   StaticImageData objects. `asset()` is the single boundary where that
   difference is settled — see src/lib/asset.ts for why it is a function
   and not a bundler setting. Everything below this block is a string,
   exactly as it was before the port. */
const compNec = asset(_compNec);
const compSih = asset(_compSih);
const compEy = asset(_compEy);
const compDevjams = asset(_compDevjams);

/* ─────────────────────────────────────────────────────────────────
   NOT MOUNTED. This section was removed from the home page on
   21 August 2026 and nothing imports it.

   The file is kept rather than deleted for two reasons. There is no
   version control in this working copy, so a delete is unrecoverable
   by anything short of rewriting it — and the DevJams provenance note
   below is the site's only written record of why that figure reads
   Top 12 when the post says thirteen. src/lib/insights.ts cites this
   file by name for exactly that. Vite tree-shakes an unimported
   module, so it costs nothing in the bundle.

   To bring it back: import it in src/screens/Home.tsx between
   <InsightsCarousel /> and <ContactTakeover />, and restore the
   "Recognition" entry to FOOTER_NAV in src/lib/content.ts.

   ─────────────────────────────────────────────────────────────────
   Recognition.

   Rebuilt as a fanned deck: four portrait cards laid out in an arc,
   the way an editorial site presents a set of moments. Pointing at a
   card straightens it, lifts it out of the fan and swaps the readout
   underneath. Everything is one interaction — hover, focus and tap all
   do the same thing — so keyboard and touch are not second-class.

   What changed and why:
     · The fourth entry was filed as "IoT Smart Home Challenge". It is
       DevJams '24, run by Google Developer Student Clubs at VIT
       Vellore, and it is linked to the build it produced.

       Its field size was wrong here, in projects.ts and in
       insights.ts alike: 400+ teams, carried from the résumé. The post
       written on the day puts it at more than 250, and all three now
       read 250+.

       The placing beside it is Top 12, on the author's own record.
       What each source actually says is written down here because they
       do not agree, and without the note somebody will "correct" this
       a second time: the post is headlined thirteen, and the
       photograph of the shortlist in that project's gallery lists
       thirteen names. Neither of those settles how many of the
       thirteen were competing teams. The author's account of his own
       result governs, and the disagreement is recorded rather than
       smoothed away — which is the entire purpose of a note like this.

       A number a reader can check is the last place to be
       approximate.
     · The old gallery reused `hackathon_win.webp`, an AI-generated
       image whose signage reads "GLOBAL TECH INNOVATE HACKATHON" in
       garbled type, captioned as the IIT Bombay finals. Nothing on a
       portfolio should claim to document an event it did not. The four
       images here are photography, and they are framed as atmosphere:
       the card's text carries every factual claim.
     · One subject per card, and no two alike. The first pass gave EY
       and DevJams near-identical "screens in a dark room" shots, which
       made the fan read as four photographs of the same hackathon.
       Each card now takes the subject its entry is actually about —
       a stage, a rock face, a corporate skyline, a board — so the fan
       carries four ideas rather than one repeated four times.
     · Two entries have a detail page, so those cards link to it.
       The other two do not, and get no link rather than a dead one.

   The fan is desktop-only. Below `lg` it becomes a plain grid with the
   detail inline — the old build's fan buried its rear cards on touch,
   where there is no hover to dig them out with.
   ───────────────────────────────────────────────────────────────── */

interface Competition {
  id: string;
  org: string;
  /** Card-width form. The card is 232px; the full attribution wraps to
      two lines there and crowds the title against the edge. Falls back
      to `org` when the full name already fits. The readout below always
      shows the full `org`, so nothing is lost by shortening here. */
  orgShort?: string;
  event: string;
  /** The outcome, in the fewest words that are still true. */
  result: string;
  resultLabel: string;
  desc: string;
  image: string;
  /** Detail page for the project behind it, when there is one. */
  href?: string;
}

const COMPETITIONS: Competition[] = [
  {
    id: 'nec',
    org: 'E-Cell, IIT Bombay',
    event: 'National Entrepreneurship Challenge',
    result: 'AIR 140',
    resultLabel: 'National rank',
    desc: 'Led team Visionary Ventures representing VIT Vellore, pitching SaaS model validations into the top 1% of a national field.',
    image: compNec,
  },
  {
    id: 'sih',
    org: 'Smart India Hackathon 2025',
    orgShort: 'Smart India Hackathon',
    event: 'National finalist shortlist',
    result: 'Shortlisted',
    resultLabel: 'National stage',
    desc: 'An AI and IoT rockfall prediction system built on multi-sensor data fusion, shortlisted out of the national field.',
    image: compSih,
    href: '/projects/rockfall-prediction',
  },
  {
    id: 'ey',
    org: 'Ernst & Young',
    event: 'EY Techathon 2025',
    result: 'Advanced rounds',
    resultLabel: 'Progress',
    desc: 'Built AI governance scanners, compliance sandboxes, and the analytics surface reporting on them.',
    image: compEy,
  },
  {
    id: 'devjams',
    org: 'Google Developer Student Clubs · VIT Vellore',
    orgShort: 'GDSC · VIT Vellore',
    event: "DevJams '24",
    result: 'Top 12',
    resultLabel: 'Of 250+ teams',
    desc: 'A voice-controlled home system parsing natural language through the Gemini API onto Arduino-driven devices, built inside the flagship campus hackathon.',
    image: compDevjams,
    href: '/projects/smart-home-automation',
  },
];

const SPRING = { type: 'spring', stiffness: 260, damping: 30, mass: 0.8 } as const;

/* Fan geometry. `pos` runs -1.5 … 1.5 across four cards, and every
   other value is derived from it, so adding or removing a competition
   re-spaces the arc instead of needing four hand-tuned transforms.

   Sizes are deliberately short. At 268x420 the fan alone filled a
   laptop viewport and the readout underneath started below the fold,
   so the description of the card you were pointing at was the one
   thing you could not see. Cards through counter now measure ~700px,
   which clears the usable height at 1280x800 and 1024x768 — the two
   that a 330px card still overshot.

   The numbers that have to agree:
     · STAGE_H holds the tallest pose. The lifted card is
       CARD_H * 1.06 = 329px and rises by LIFT, so its top sits at
       (392 - 329) / 2 - 24 ≈ 8px — inside the stage, not over the
       heading above it.
     · STEP sets the overlap: 232 wide on a 132 stride is a 43% lap,
       enough to read as a fan and still leave each title legible. */
const CARD_W = 232;
const CARD_H = 310;
const STAGE_H = 392;
const STEP = 132;
const LIFT = -24;

function fanPose(index: number, count: number) {
  const pos = index - (count - 1) / 2;
  return {
    x: pos * STEP,
    rotate: pos * 9,
    y: pos * pos * 20,
    scale: 1 - Math.abs(pos) * 0.05,
    z: 20 - Math.round(Math.abs(pos) * 4),
  };
}

/* ── Readout ─────────────────────────────────────────────────────── */

function Readout({ item, active }: { item: Competition; active: boolean }) {
  return (
    <div
      /* Inactive copies stay in the grid cell as invisible sizers, so
         the block is always as tall as its tallest entry and the page
         does not jolt when the readout swaps. `invisible` also takes
         them out of the tab order, and the link below is rendered as a
         span in that state so there is nothing focusable to reach. */
      className={`col-start-1 row-start-1 text-center ${active ? '' : 'invisible'}`}
      aria-hidden={active ? undefined : true}
    >
      <p className="font-mono text-meta-sm uppercase text-accent">{item.org}</p>
      <h3 className="mx-auto mt-3 max-w-[22ch] text-balance font-display text-display-sm font-bold text-bone-raised">
        {item.event}
      </h3>

      {/* The result in full. The card chip only has room for the figure
          ("Top 12"); without the qualifier beside it here, "of 250+
          teams" — the part that makes the figure mean anything — was
          declared in the data and rendered nowhere. */}
      <p className="mt-5 inline-flex items-baseline gap-3 rounded-full border border-white/15 px-4 py-2">
        <span className="font-display text-base font-bold text-accent">{item.result}</span>
        <span className="font-mono text-meta-sm uppercase text-bone-raised/55">
          {item.resultLabel}
        </span>
      </p>

      <p className="mx-auto mt-4 max-w-prose text-sm leading-relaxed text-bone-raised/65">
        {item.desc}
      </p>

      {item.href ? (
        <Link
          href={item.href}
          tabIndex={active ? undefined : -1}
          className="mt-5 inline-flex items-center gap-2 border-b border-white/25 pb-1 font-mono text-meta-sm uppercase text-bone-raised transition-colors duration-200 hover:border-accent hover:text-accent"
        >
          View in detail
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      ) : (
        <span className="mt-5 inline-flex items-center gap-2 pb-1 font-mono text-meta-sm uppercase text-transparent">
          &nbsp;
        </span>
      )}
    </div>
  );
}

/* ── Card face ───────────────────────────────────────────────────── */

/* Three states, not two. `rest` is the fan with nothing pointed at:
   every card sits at the same middle exposure. Reusing the dimmed
   `off` treatment for rest made the whole fan look switched off before
   anyone touched it, and reusing `on` made all four shout at once. */
type FaceState = 'on' | 'off' | 'rest';

const FACE_IMAGE: Record<FaceState, string> = {
  on: 'brightness-100 saturate-100',
  rest: 'brightness-[0.8] saturate-[0.85]',
  off: 'brightness-[0.5] saturate-[0.55]',
};

function CardFace({ item, state }: { item: Competition; state: FaceState }) {
  return (
    <>
      <Picture
        sizes="(min-width: 1024px) 30vw, 80vw"
        src={item.image}
        alt=""
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-500 ease-out ${FACE_IMAGE[state]}`}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10"
      />

      <span
        className={`absolute left-4 top-4 rounded-full border px-2.5 py-1 font-mono text-meta-sm uppercase backdrop-blur-sm transition-colors duration-300 ${
          state === 'on'
            ? 'border-accent/50 bg-ink/70 text-accent'
            : 'border-white/20 bg-ink/60 text-bone-raised/75'
        }`}
      >
        {item.result}
      </span>

      <span className="absolute inset-x-0 bottom-0 p-5 text-left">
        <span className="block font-mono text-meta-sm uppercase text-bone-raised/60">
          {item.orgShort ?? item.org}
        </span>
        <span className="mt-1.5 block font-display text-base font-bold leading-snug text-bone-raised">
          {item.event}
        </span>
      </span>
    </>
  );
}

/* ── Section ─────────────────────────────────────────────────────── */

export function HackathonsGallery() {
  /* `null` is the resting fan — nothing lifted, nothing selected. It is
     also the starting state, so the section is never showing a card as
     picked before anyone has picked it. */
  const [active, setActive] = useState<number | null>(null);
  const reduced = useReducedMotion() ?? false;
  const transition = reduced ? { duration: 0 } : SPRING;

  /* The reset lives on the stage, not on each card. Card-level
     pointerleave fires *before* the next card's pointerenter, so
     travelling across the fan would drop to rest for a frame between
     every pair — a visible flinch on the lift and on the readout.
     Leaving the stage is also the gesture that actually means "done".

     Guarded on `mouse`: a touch pointer leaves the moment the finger
     lifts, which would undo a tap the instant it landed. */
  const releasePointer = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') setActive(null);
  };

  /* Keyboard equivalent. React's onBlur is focusout, so it bubbles;
     the relatedTarget check keeps Tab between two cards from resetting. */
  const releaseFocus = (e: React.FocusEvent<HTMLUListElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setActive(null);
  };

  return (
    <section
      id="recognition"
      className="relative z-10 bg-ink py-22 text-bone-raised sm:py-30"
      style={{ scrollMarginTop: 'var(--nav-h)' }}
    >
      <div className="mx-auto w-full max-w-shell px-gutter">
        {/* The "point at a card" instruction moved into the resting
            readout, where the result of following it appears. Saying it
            twice on one screen read as filler. */}
        <SectionHeader
          kicker="Recognition"
          tone="dark"
          title={<>Competitions and national finals.</>}
          aside={
            <>
              Four fields, national and campus. Two of them produced a build you can read end to
              end.
            </>
          }
        />

        {/* ── Fan (lg and up) ── */}
        <motion.div
          variants={riseIn}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="hidden lg:block"
        >
          {/* The stage is `CARD_W + 3 * STEP` wide at rest and the active
              card only rises, so nothing in the fan can reach outside
              it — which is what let the old fan clip against the
              section's overflow. */}
          <ul
            onPointerLeave={releasePointer}
            onBlur={releaseFocus}
            className="relative mx-auto flex items-center justify-center"
            style={{ width: CARD_W + 3 * STEP, height: STAGE_H }}
          >
            {COMPETITIONS.map((item, i) => {
              const pose = fanPose(i, COMPETITIONS.length);
              const on = active === i;

              return (
                <li key={item.id} className="absolute">
                  <motion.button
                    type="button"
                    onPointerEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-pressed={on}
                    aria-label={`${item.event} — ${item.org}, ${item.result}`}
                    animate={{
                      x: pose.x,
                      y: on ? LIFT : pose.y,
                      rotate: on ? 0 : pose.rotate,
                      scale: on ? 1.06 : pose.scale,
                    }}
                    transition={transition}
                    style={{ zIndex: on ? 50 : pose.z, width: CARD_W, height: CARD_H }}
                    className={`relative block overflow-hidden rounded-[24px] border text-left shadow-2xl transition-colors duration-300 ${
                      on ? 'border-white/35' : 'border-white/12'
                    }`}
                  >
                    <CardFace item={item} state={on ? 'on' : active === null ? 'rest' : 'off'} />
                  </motion.button>
                </li>
              );
            })}
          </ul>

          {/* Readout. One grid cell; the four records and the resting
              prompt are stacked in it and exactly one is visible, so the
              block is always as tall as its tallest entry and returning
              to rest cannot collapse the page under the pointer. */}
          <div className="mt-4 grid">
            {COMPETITIONS.map((item, i) => (
              <Readout key={item.id} item={item} active={active === i} />
            ))}
            <div
              className={`col-start-1 row-start-1 flex items-center justify-center ${
                active === null ? '' : 'invisible'
              }`}
              aria-hidden={active === null ? undefined : true}
            >
              <p className="font-mono text-meta-sm uppercase text-bone-raised/40">
                Point at a card to read the record
              </p>
            </div>
          </div>

          {/* Index. Announced politely so the readout swap is not silent
              to a screen reader driving this from the keyboard. */}
          <p
            aria-live="polite"
            className="mt-5 text-center font-mono text-meta-sm uppercase text-bone-raised/35"
          >
            {active === null ? '—' : String(active + 1).padStart(2, '0')} /{' '}
            {String(COMPETITIONS.length).padStart(2, '0')}
          </p>
        </motion.div>

        {/* ── Grid (below lg) ── */}
        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:hidden"
        >
          {COMPETITIONS.map((item) => (
            <motion.li key={item.id} variants={riseIn}>
              <div className="relative aspect-[3/4] overflow-hidden rounded-panel border border-white/12">
                <CardFace item={item} state="on" />
              </div>
              <p className="mt-5 inline-flex items-baseline gap-3 rounded-full border border-white/15 px-4 py-2">
                <span className="font-display text-base font-bold text-accent">{item.result}</span>
                <span className="font-mono text-meta-sm uppercase text-bone-raised/55">
                  {item.resultLabel}
                </span>
              </p>
              <p className="mt-5 text-sm leading-relaxed text-bone-raised/65">{item.desc}</p>
              {item.href && (
                <Link
                  href={item.href}
                  className="mt-4 inline-flex items-center gap-2 border-b border-white/25 pb-1 font-mono text-meta-sm uppercase text-bone-raised transition-colors duration-200 hover:border-accent hover:text-accent"
                >
                  View in detail
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
