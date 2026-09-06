import React, { useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from 'motion/react';
import { Link } from './Link';
import { ArrowRight } from 'lucide-react';
import { EASE_OUT } from '../lib/motion';
import { PROJECTS, type Project } from '../lib/projects';
import { MotionPicture } from './Picture';
import { contentImage } from '../lib/image-loading';
import { useMediaQuery } from '../lib/useMediaQuery';
import { WorksListMobile } from './WorksListMobile';

/* ─────────────────────────────────────────────────────────────────
   Selected work — a deck of frames.

   The section opens on its own screen: the heading and nothing else.
   Every project after it is a full viewport frame, and each frame is
   `position: sticky` at the same offset, so the next one rises off the
   bottom of the screen and locks over the one before it while that one
   stays exactly where it is. Nothing scrolls away; the deck grows
   until the last frame, which holds.

   Why sticky rather than scroll-driven transforms: the browser owns
   the pinning, so it stays glued at any scroll speed, survives a
   reload part-way through, and costs nothing on the main thread.

   ── The hold ──────────────────────────────────────────────────────
   A sticky deck with layers exactly one viewport tall never rests: the
   moment a frame locks, the next one has already started climbing, so
   the whole section is one continuous slide and no single project ever
   gets a beat of its own. Each frame is now preceded by a `DWELL_VH`
   spacer, which buys exactly that beat — the frame locks, and then
   nothing moves for two thirds of a screen while its content plays in
   and can actually be read.

   The spacer is invisible: the frame above it is pinned and covering
   the viewport for the whole of it. All it contributes is scroll
   length. See `windows()` for how that reshapes the timeline.

   ── The grid ──────────────────────────────────────────────────────
   One arrangement, used by every frame: the page is halved, copy on
   one side and the image on the other, and the image changes side from
   frame to frame. Nothing else about the layout varies — same measure,
   same type scale, same rule pinned at the same height — so the deck
   reads as one system, and the alternation is what stops ten halves in
   a row turning into wallpaper.

   Three things rotate on three different periods, so the combination
   never repeats inside ten frames and the deck never looks mechanical:

     surface   3   bone-raised → bone → bone-sunk
     side      2   image right → image left
     reveal    4   curtain → wipe → iris → lift

   Nothing goes dark, no new hue.

   ── Motion ────────────────────────────────────────────────────────
   Deliberately split in two, because the two halves want opposite
   things:

     scroll-linked   the frame slide (native sticky), the slow scale
                     drift on the image, and the exit drift + dim.
                     These track the finger, so they must scrub.

     time-based      the content entrance — image reveal, rule, title
                     mask, copy, stack, proof card. These fire once,
                     when the frame is around half way up, and run on
                     their own easing. Scrubbing an entrance to scroll
                     position is what makes a deck feel mechanical; a
                     real staggered sequence is what makes it feel
                     composed.
   ───────────────────────────────────────────────────────────────── */

/* Each frame is a doorway now: the deck names the project, the page
   at /projects/<slug> explains it. Everything rendered here comes
   from src/lib/projects.ts so the two can never disagree. */

/* ── Timeline ─────────────────────────────────────────────────────
   `DWELL_VH` must stay in step with the spacer's Tailwind class, which
   has to be a complete literal string for Tailwind to emit it — hence
   the constant and `SPACER` sitting next to each other. */
const DWELL_VH = 65;
const SPACER = 'h-[65svh]';

/** One project's scroll budget: a viewport to climb, then the hold. */
const UNIT = 100 + DWELL_VH;
/** Share of a unit spent climbing; the rest is the hold. */
const RISE = 100 / UNIT;
const HOLD = 1 - RISE;

/* The deck carries one more spacer than it has projects: without a
   trailing one the last frame locks and is immediately pushed off by
   the next section, so the only project on the page that never gets
   its beat would be the last. That tail is `HOLD` of a span long,
   which is what the `+ HOLD` in the denominator accounts for. */
const SPAN = 1 / (PROJECTS.length + HOLD);

/* Surface rotates on three, side flips on two, the image reveal
   changes on four — so no two of the ten frames arrive the same way. */
const SURFACES = ['bg-bone-raised', 'bg-bone', 'bg-bone-sunk'] as const;
const REVEALS = ['curtain', 'wipe', 'iris', 'lift'] as const;
type Reveal = (typeof REVEALS)[number];

/**
 * Where frame `index` sits on the deck's 0→1 progress.
 *
 * Layer k comes to rest at `deckTop + k × UNIT`, and the deck's total
 * scroll is `PROJECTS.length × UNIT`, so the pin lands on exactly
 * `k × SPAN` no matter how large the dwell is — the spacers stretch
 * the timeline without skewing it.
 *
 *   rise   climbing into place              [pin − SPAN·RISE, pin]
 *   hold   locked, nothing moving           [pin, pin + SPAN·HOLD]
 *   exit   the next frame is burying it     [pin + SPAN·HOLD, pin + SPAN]
 *
 * The last frame's exit window starts past 1, so it never dims — it is
 * the one you are left looking at.
 */
function windows(index: number) {
  const pin = index * SPAN;
  return {
    riseFrom: pin - SPAN * RISE,
    pin,
    exitFrom: pin + SPAN * HOLD,
    exitTo: pin + SPAN,
  };
}

/* Pads the copy half's outer edge back to the shell measure, so text
   starts where the rest of the site's content starts even though its
   half runs to the viewport edge. `max-w-shell` is 84rem, hence the
   42rem half-measure; percent rather than `vw` because `vw` includes
   the scrollbar and would centre a few pixels off. */
const SHELL_PAD_L = 'lg:pl-[max(theme(spacing.gutter),calc(50%-42rem+theme(spacing.gutter)))]';
const SHELL_PAD_R = 'lg:pr-[max(theme(spacing.gutter),calc(50%-42rem+theme(spacing.gutter)))]';

/* ── Two arrangements, one set of parts ───────────────────────────
   Side by side, a frame is a copy column and a picture column and the
   record sits on the picture's bottom edge. Stacked, that ordering is
   wrong: the picture ends up below a full column of prose, so the
   reader meets the argument before the evidence, and the record is
   four screens of scrolling from the title it belongs to.

   Stacked, the order is title → picture → record → prose, which is how
   a case study is set on paper: name the thing, show it, state what it
   produced, then explain. Same parts, same DOM once, placed by a media
   query rather than duplicated behind `hidden`/`lg:block` — ten frames
   with two copies each would put twenty images in the document and
   fetch every one of them. */
const COMPACT_QUERY = '(max-width: 1023px)';
/** Below `md`: the deck is swapped for a static list entirely. */
const PHONE_QUERY = '(max-width: 767px)';


/**
 * Starting clip for each reveal. All four resolve to `inset(0%)`.
 *
 *   curtain  drops from the top edge
 *   wipe     travels inward, from whichever edge the page centre is on
 *   iris     opens out from a smaller inset frame
 *   lift     rises from the bottom edge
 */
function clipFrom(kind: Reveal, imageRight: boolean) {
  switch (kind) {
    case 'curtain':
      return 'inset(0% 0% 100% 0%)';
    case 'wipe':
      return imageRight ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';
    case 'iris':
      return 'inset(13% 11% 13% 11%)';
    case 'lift':
      return 'inset(100% 0% 0% 0%)';
  }
}

/* ── The record ───────────────────────────────────────────────────
   This was a floating plate dropped on top of the photograph. It read
   as a sticker — a rounded light card sitting at an arbitrary offset,
   belonging to neither the picture nor the type grid.

   It is now a band ruled off against the foot of the image: flush to
   three edges, square, hairline top. That is how a record is set
   — aligned to the frame, field named, nothing floating. On ink it can
   also use the full accent rather than the dimmed one the light card
   forced.

   ── One field, not two ──
   It used to be split Result | Role, and the Role half is gone. Two
   reasons, and the second is the one that matters:

     · It said nothing. "Developer", "Implementation", "End-to-end
       development" — nine of the ten were a job title restating the
       fact that this is a portfolio of things its author built.
     · It made a claim about team shape that these projects do not
       support, and the split forced it to be made ten times over.

   What is left is the single hardest fact about each build, and it now
   gets the whole width instead of 57% of it: the value big and in
   accent, its reading set beside it on the same baseline rather than
   stacked under it in a column too narrow to hold a line. The vertical
   rule went with the second cell, and the band is set off from the
   picture by the top rule alone. A short accent segment used to key
   that corner; against a bright frame it read as a progress bar caught
   mid-fill rather than as a mark on a rule, which is a bad first
   impression for a band whose whole job is to state a finished result.

   The band carries the record and nothing else. A frame counter lived
   at its far end for a while and was wrong there: a record states what
   the work produced, and where you are in a deck is a different kind of
   fact entirely. Sitting opposite the result it read as though it were
   part of the measurement. The number moved to the frame's own header,
   which is where a set index belongs. */
/* ── The record, stacked ──────────────────────────────────────────
   The same fact on one line, sitting under the picture rather than on
   it. Over a picture the band can afford a label row, a display figure
   and a reading on three lines, because it is floating on an image
   that is already there. Below the picture that block is ~90px of a
   phone's frame taken from the picture itself and from the prose under
   it, and it is the reason the frame stopped fitting.

   Kept on ink so it reads as the picture's own caption rather than a
   third band of page furniture, which also keeps the accent legal: the
   figure is 6.9:1 here and would be 3.4:1 on bone. */
function RecordLine({ project }: { project: Project }) {
  return (
    <div className="bg-ink px-gutter py-2.5">
      <p className="flex items-baseline gap-2.5">
        <span className="shrink-0 font-mono text-meta-sm uppercase text-bone-raised/40">Result</span>
        <span className="shrink-0 font-display text-[15px] font-bold leading-none tracking-tight text-accent">
          {project.proof.value}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12px] leading-snug text-bone-raised/55">
          {project.proof.label}
        </span>
      </p>
    </div>
  );
}

function Record({ project }: { project: Project }) {
  /* Positioned by its caller, not by itself — it is translated in from
     below its own edge, which needs a wrapper with real height to
     measure the percentage against. */
  return (
    <div className="relative border-t border-white/15 bg-ink/85 backdrop-blur-md">
      <div className="px-5 py-4 sm:px-7 sm:py-5">
        <dl className="min-w-0">
          <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone-raised/40">
            Result
          </dt>
          {/* Baseline-aligned side by side where there is room. Below
              `sm` it stacks, because "Of 250+ teams — GDSC DevJams
              2024" beside "Top 12" on a phone is two words per line. */}
          <dd className="mt-2.5 flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-4">
            <span className="font-display text-display-sm font-bold leading-none tracking-tight text-accent">
              {project.proof.value}
            </span>
            <span className="text-sm leading-snug text-bone-raised/60">{project.proof.label}</span>
          </dd>
        </dl>
      </div>
    </div>
  );
}

/* ── Deck progress ──────────────────────────────────────────────
   Ten frames held for two thirds of a screen each is long enough that
   you need to know where you are and be able to leave. Each tick is a
   real button that scrolls to its frame, and reveals its title on
   hover. */
function DeckProgress({
  progress,
  visible,
  onJump,
}: {
  progress: MotionValue<number>;
  visible: MotionValue<number>;
  onJump: (index: number) => void;
}) {
  return (
    <motion.div
      style={{ opacity: visible }}
      aria-hidden="true"
      className="pointer-events-none fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-2.5 xl:flex"
    >
      {PROJECTS.map((project, i) => (
        <ProgressTick
          key={project.slug}
          index={i + 1}
          title={project.title}
          progress={progress}
          onJump={onJump}
        />
      ))}
    </motion.div>
  );
}

function ProgressTick({
  index,
  title,
  progress,
  onJump,
}: {
  index: number;
  title: string;
  progress: MotionValue<number>;
  onJump: (index: number) => void;
}) {
  const at = index * SPAN;
  const opacity = useTransform(progress, [at - SPAN, at, at + SPAN], [0.3, 1, 0.3], {
    clamp: true,
  });
  const scaleX = useTransform(progress, [at - SPAN, at, at + SPAN], [1, 2.8, 1], { clamp: true });

  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => onJump(index)}
      title={title}
      className="group pointer-events-auto flex h-4 items-center justify-end gap-3 pl-3"
    >
      {/* Named only on hover, and on its own plate — the rail sits over
          whichever half the frame put on the right, which is as often
          a photograph as it is bone. */}
      <span className="whitespace-nowrap rounded-sm border border-black/10 bg-bone-raised px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink/75 opacity-0 shadow-[0_6px_18px_-10px_rgba(11,11,12,0.6)] transition-opacity duration-200 group-hover:opacity-100">
        {title}
      </span>
      <motion.span style={{ opacity, scaleX }} className="block h-px w-3 origin-right bg-ink" />
    </button>
  );
}

/* ── Opening screen ─────────────────────────────────────────────── */
function OpeningFrame({ progress }: { progress: MotionValue<number> }) {
  const { exitFrom, exitTo } = windows(0);
  const contentY = useTransform(progress, [exitFrom, exitTo], [0, -70], { clamp: true });
  const dim = useTransform(progress, [exitFrom, exitTo], [0, 0.6], { clamp: true });

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-20% 0px' },
    transition: { duration: 0.7, delay, ease: EASE_OUT },
  });

  return (
    <div className="sticky top-0 h-[100svh] overflow-hidden bg-bone">
      <motion.div
        style={{ y: contentY }}
        className="mx-auto flex h-full w-full max-w-shell flex-col justify-center px-gutter pt-[var(--nav-h)]"
      >
        <motion.p {...reveal(0)} className="eyebrow text-ink/55">
          Selected work
        </motion.p>

        <motion.h2
          {...reveal(0.08)}
          className="mt-7 max-w-[14ch] text-balance font-display text-display-xl font-bold leading-[0.92] text-ink"
        >
          Things I built that people use.
        </motion.h2>

        <motion.p {...reveal(0.16)} className="mt-9 max-w-xl text-lede text-ink/65">
          Ten shipped projects — production platforms, retrieval systems, models and hardware.
        </motion.p>
      </motion.div>

      <motion.div
        aria-hidden="true"
        style={{ opacity: dim }}
        className="pointer-events-none absolute inset-0 bg-ink"
      />
    </div>
  );
}

/* ── Project frame ──────────────────────────────────────────────── */
function ProjectFrame({
  project,
  index,
  progress,
}: {
  project: Project;
  index: number;
  progress: MotionValue<number>;
}) {
  const { riseFrom, pin, exitFrom, exitTo } = windows(index);

  /* Scroll-linked: the slow drift on the image, and the exit. The
     image is oversized while the frame is climbing and settles to
     true size across the hold, so the frame keeps breathing during
     the beat where nothing else is moving. */
  const imgScale = useTransform(progress, [riseFrom, pin, exitFrom], [1.12, 1.05, 1], {
    clamp: true,
  });
  const exitY = useTransform(progress, [exitFrom, exitTo], [0, -70], { clamp: true });
  const dim = useTransform(progress, [exitFrom, exitTo], [0, 0.62], { clamp: true });

  /* Time-based: the entrance sequence, tripped the moment the frame's
     top edge clears the bottom of the screen rather than on lock. Trip
     it any later and the first sliver of every incoming frame is an
     empty half-page of bone; tripped here, the content is already
     assembling as the frame climbs, and the whole sequence is done by
     about the time it locks.

     It runs once and then latches. A frame you scroll back to keeps
     the state it finished in — the entrance never rewinds, never
     replays, and never plays backwards on the way up. Seeing it again
     means reloading the page.

     The latch is a ref rather than the state itself so that once a
     frame has played, the scroll handler is a single boolean check
     instead of a state update on every frame of every scroll. */
  const gate = pin - SPAN * RISE * 0.95;
  const played = useRef(progress.get() >= gate);
  const [live, setLive] = useState(played.current);
  useMotionValueEvent(progress, 'change', (v) => {
    if (played.current || v < gate) return;
    played.current = true;
    setLive(true);
  });

  /** One stagger step of the entrance. */
  const step = (delay: number, distance = 26, duration = 0.75) => ({
    initial: { opacity: 0, y: distance },
    animate: live ? { opacity: 1, y: 0 } : { opacity: 0, y: distance },
    transition: { duration, delay, ease: EASE_OUT },
  });

  const compact = useMediaQuery(COMPACT_QUERY);

  /* Which side the picture sits on when there are sides at all. Still
     read when stacked: the entrance rule is drawn from whichever
     margin this frame's picture would have come from, so the ten keep
     alternating even where the layout does not. */
  const imageRight = index % 2 === 1;
  const surface = SURFACES[(index - 1) % SURFACES.length];
  const reveal = REVEALS[(index - 1) % REVEALS.length];
  const hidden = clipFrom(reveal, imageRight);

  /* ── The parts ──
     Built once, then placed by `compact` into one of the two
     arrangements below. Nothing here knows which one it is in. */

  const headerRow = (
    <>
      {/* Index, then what it is, then when — left to right, above the
          rule. That is where a numbered set puts its number: at the
          head of the entry, reading into the title, not floating off
          the end of a result. Set in the same mono as the year so the
          row reads as one line of filing rather than three unrelated
          marks.

          `tabular-nums` because these are stacked identically on ten
          frames you scroll through: proportional digits make "01" and
          "10" different widths, and the category behind them would
          shift by a pixel or two from frame to frame. */}
      <motion.div {...step(0.06, 14, 0.6)} className="flex items-baseline justify-between gap-6 pb-4">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="shrink-0 font-mono text-meta-sm tabular-nums text-ink/45">
            {String(index).padStart(2, '0')}
          </span>
          <span aria-hidden="true" className="h-3 w-px shrink-0 self-center bg-black/15" />
          <p className="eyebrow truncate text-ink/55">{project.category}</p>
        </div>
        <span className="shrink-0 font-mono text-meta-sm uppercase text-ink/40">{project.year}</span>
      </motion.div>

      {/* Drawn from the outer edge inward, so the rule reads as
          arriving from the margin rather than growing out of the
          gutter between the halves. */}
      <motion.div
        aria-hidden="true"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: live ? 1 : 0 }}
        transition={{ duration: 1, delay: 0.14, ease: EASE_OUT }}
        className={`h-px w-full bg-black/15 ${imageRight ? 'origin-left' : 'origin-right'}`}
      />
    </>
  );

  /* Masked title. The band is clipped and the type slides up inside
     it, which is the one gesture every frame shares — the signature
     that holds the ten together. */
  const titleBlock = (
    <h3 className="text-balance font-display text-display-md font-bold leading-[0.96] text-ink">
      <span className="block overflow-hidden pb-[0.1em]">
        <motion.span
          className="block"
          initial={{ y: '112%' }}
          animate={{ y: live ? '0%' : '112%' }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT }}
        >
          {project.title}
        </motion.span>
      </span>
    </h3>
  );

  const prose = (
    <>
      {/* Clamped below `lg`. The summaries run from one line to four,
          and stacked that difference comes straight out of the
          picture's height — so the ten frames would each crop their
          image to a different depth. Clamping fixes the copy block's
          height, which is what lets every frame present the same
          picture shape. The full text is on the project's own page. */}
      <motion.p
        {...step(0.36, 20)}
        className="line-clamp-2 max-w-prose text-lede text-ink/70 sm:line-clamp-3 lg:line-clamp-none"
      >
        {project.summary}
      </motion.p>

      <ul className="mt-4 flex flex-wrap gap-1.5 lg:mt-7">
        {project.stack.map((s, i) => (
          <motion.li
            key={s}
            initial={{ opacity: 0, y: 14 }}
            animate={live ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 0.5, delay: 0.5 + i * 0.055, ease: EASE_OUT }}
            className="rounded border border-black/12 bg-black/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink/65"
          >
            {s}
          </motion.li>
        ))}
      </ul>

      {/* The one link in the accessibility tree, and it goes to the
          detail page rather than off-site: the live URL and the
          repository belong on the project's own page, where there is
          room to say what they are. A stretched `::after` does not
          work here — the wrapper carries a transform for the exit
          drift, which makes it the containing block, so the overlay
          would only ever cover the text column. The picture gets its
          own decorative link instead. */}
      {/* ── The control ──────────────────────────────────────────
          Three deliberate changes from the circled badge this
          replaces.

          The glyph was `ArrowUpRight`. That arrow means one thing on
          the web — this leaves the site, or opens in a new tab — and
          this link does neither: it navigates to `/projects/<slug>`,
          same site, same tab. The control was promising something it
          had no intention of doing, which is a small dishonesty the
          reader notices only by being mildly wrong-footed. A
          horizontal arrow says "forward, still here", which is what
          actually happens.

          The 32px ring came off. A filled accent circle is a loud
          answer to a quiet question, and there are ten of these on the
          page. What replaces it is cheaper and reads as more
          considered: a hairline that draws itself under the label from
          the left, and an arrow that leaves its slot to the right
          while an identical one arrives from the left. The slot is
          fixed width and clipped, so the control never changes size
          and nothing reflows around it.

          `py-4 -my-4` is hit area, not spacing. The label is 10px mono
          on one line, so the link's own box is about 14px tall — a
          third of a fingertip, and measured at 38px even with 12px of
          padding. At 16px it clears 44px. The equal negative margin
          cancels the padding exactly, so the wrapper's height and
          everything below it are untouched and the text lands where it
          always did; only the invisible target grows.

          The top margin has to live on the wrapper rather than here.
          `mt-5` and `-my-4` both set `margin-top`, and which one wins
          is decided by their order in Tailwind's generated stylesheet
          rather than by the order they are written in — a coin flip
          that would silently eat either the spacing or the hit area. */}
      <motion.div {...step(0.74, 18, 0.6)} className="mt-5 lg:mt-9">
        <Link
          href={`/projects/${project.slug}`}
          className="group/link -my-4 inline-flex items-center gap-3 py-4 font-mono text-meta-sm font-bold uppercase tracking-wider text-ink/55 transition-colors duration-300 ease-out hover:text-ink focus-visible:text-ink"
        >
          <span className="relative">
            View in detail
            <span
              aria-hidden="true"
              className="absolute -bottom-1.5 left-0 block h-px w-full origin-left scale-x-0 bg-ink transition-transform duration-500 ease-out group-hover/link:scale-x-100 group-focus-visible/link:scale-x-100"
            />
          </span>

          <span aria-hidden="true" className="relative block h-3.5 w-4 overflow-hidden">
            <ArrowRight className="absolute inset-0 h-3.5 w-4 transition-transform duration-500 ease-out group-hover/link:translate-x-[140%] group-focus-visible/link:translate-x-[140%]" />
            <ArrowRight className="absolute inset-0 h-3.5 w-4 -translate-x-[140%] transition-transform duration-500 ease-out group-hover/link:translate-x-0 group-focus-visible/link:translate-x-0" />
          </span>
        </Link>
      </motion.div>
    </>
  );

  /* Decorative link: clickable for pointer users, but `aria-hidden` +
     `tabIndex={-1}` keep it out of the accessibility tree so the frame
     exposes exactly one link. */
  const picture = (
    <Link
      href={`/projects/${project.slug}`}
      aria-hidden="true"
      tabIndex={-1}
      className="relative block h-full w-full min-w-0 overflow-hidden bg-ink"
    >
      {/* The reveal. Clip on the wrapper, drift on the image, so the
          two never fight over one transform. */}
      <motion.div
        initial={{ clipPath: hidden }}
        animate={{ clipPath: live ? 'inset(0% 0% 0% 0%)' : hidden }}
        transition={{ duration: 1.15, delay: 0.05, ease: EASE_OUT }}
        className="h-full w-full"
      >
        <MotionPicture
          sizes="(min-width: 1024px) 55vw, 100vw"
          src={project.cover}
          alt={`${project.title} — ${project.category}`}
          {...contentImage()}
          style={{ scale: imgScale }}
          className="h-full w-full object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
        />
      </motion.div>

      {/* Side by side, the record rides the picture's bottom edge and
          rises from behind it, so it reads as part of the frame
          arriving. Stacked it is a line under the picture instead —
          see `RecordLine`. */}
      {!compact && (
        <motion.div
          initial={{ y: '101%' }}
          animate={{ y: live ? '0%' : '101%' }}
          transition={{ duration: 0.9, delay: 0.55, ease: EASE_OUT }}
          className="absolute inset-x-0 bottom-0"
        >
          <Record project={project} />
        </motion.div>
      )}
    </Link>
  );

  return (
    <div
      className={`sticky top-0 h-[100svh] overflow-hidden ${surface} shadow-[0_-30px_70px_-34px_rgba(11,11,12,0.45)]`}
    >
      {/* The seam where this frame has come to rest over the last one. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 z-20 h-px bg-black/12" />

      <motion.div style={{ y: exitY }} className="group relative h-full w-full">
        {compact ? (
          /* ── Stacked ──
             Title, then the picture, then what it produced, then the
             prose. The picture takes the flex remainder, so the frame
             is exactly one viewport by construction: every other block
             is its own content height and nothing can push the last
             one past the fold. */
          <div className="flex h-full w-full flex-col">
            <div className="shrink-0 px-gutter pt-[calc(var(--nav-h)+1.25rem)]">
              {headerRow}
              <div className="pt-4">{titleBlock}</div>
            </div>

            <div className="mt-4 flex min-h-0 w-full min-w-0 flex-1">{picture}</div>

            <motion.div {...step(0.55, 12, 0.6)} className="shrink-0">
              <RecordLine project={project} />
            </motion.div>

            <div className="shrink-0 px-gutter pb-5 pt-4">{prose}</div>
          </div>
        ) : (
          /* ── Side by side ──
             Odd frames put the picture on the right, even frames on
             the left. Copy stays first in the DOM either way, so
             reading and tab order never depend on which side the
             picture happens to be. */
          <div className={`flex h-full w-full ${imageRight ? 'flex-row' : 'flex-row-reverse'}`}>
            <div
              className={`flex w-1/2 flex-col px-gutter pt-[calc(var(--nav-h)+1.75rem)] ${
                imageRight ? `${SHELL_PAD_L} lg:pr-12` : `${SHELL_PAD_R} lg:pl-12`
              }`}
            >
              {/* Pinned at a constant height in every frame, so the
                  rule lands on the same line no matter how long the
                  copy is. */}
              <div className="shrink-0">{headerRow}</div>

              <div className="flex min-h-0 flex-1 flex-col justify-center py-8">
                {titleBlock}
                <div className="mt-5">{prose}</div>
              </div>
            </div>

            <div className="h-full w-1/2 min-w-0 flex-none">{picture}</div>
          </div>
        )}
      </motion.div>

      <motion.div
        aria-hidden="true"
        style={{ opacity: dim }}
        className="pointer-events-none absolute inset-0 z-30 bg-ink"
      />
    </div>
  );
}

export function SelectedWorks() {
  const phone = useMediaQuery(PHONE_QUERY);
  const deckRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: deckRef,
    offset: ['start start', 'end end'],
  });
  /* Separate track for "is the deck on screen at all", used to fade the
     progress rail in and out. */
  const { scrollYProgress: onScreen } = useScroll({
    target: deckRef,
    offset: ['start end', 'end start'],
  });
  const railOpacity = useTransform(onScreen, [0, 0.04, 0.96, 1], [0, 1, 1, 0], { clamp: true });

  const jumpTo = (index: number) => {
    const el = deckRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (index * UNIT * window.innerHeight) / 100 });
  };

  /* ── Phones get the list, not the deck ──────────────────────────
     Below `md` this section is replaced wholesale by a static list.
     The reasoning is in WorksListMobile.tsx; the short version is that
     ten pinned full-viewport frames with scroll-linked transforms is
     the right idea on a large screen and the wrong one on a phone,
     where it fights the browser's own scroll handling and makes the
     section twenty screens tall.

     The return is placed *after* every hook above, deliberately: React
     requires the same hooks to run in the same order on every render,
     and this component's `useScroll` subscriptions must be created
     whether or not the deck is what gets rendered. The hooks are
     cheap; the deck's ten frames are not, and those are what this
     skips. */
  if (phone) return <WorksListMobile />;

  return (
    <section
      id="work"
      className="relative z-10 bg-bone text-ink on-light"
      style={{ scrollMarginTop: '0px' }}
    >
      {/* Height comes from the layers themselves — one viewport plus a
          dwell each — so the scroll length and the number of projects
          can never drift apart. */}
      <div ref={deckRef} className="relative">
        <OpeningFrame progress={scrollYProgress} />
        {PROJECTS.map((project, i) => (
          <React.Fragment key={project.slug}>
            {/* The hold. Invisible: the frame above is pinned over it. */}
            <div aria-hidden="true" className={SPACER} />
            <ProjectFrame project={project} index={i + 1} progress={scrollYProgress} />
          </React.Fragment>
        ))}
        {/* The last project's hold. */}
        <div aria-hidden="true" className={SPACER} />
      </div>

      <DeckProgress progress={scrollYProgress} visible={railOpacity} onJump={jumpTo} />
    </section>
  );
}
