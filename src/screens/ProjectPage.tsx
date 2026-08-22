import React, { useEffect, useRef, useState } from 'react';
import { Link } from '../components/Link';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
} from 'motion/react';
import {
  ArrowUpRight,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { getProject, neighbours, type GalleryItem, type Project } from '../lib/projects';
import { EASE_OUT, viewportOnce } from '../lib/motion';
import { NotFound } from './NotFound';
import { Picture, MotionPicture } from '../components/Picture';
import { useMediaQuery } from '../lib/useMediaQuery';

/* ─────────────────────────────────────────────────────────────────
   Project detail — /projects/<slug>

   The deck on the home page names the project in one screen; this is
   where it is explained. The order is the order a reviewer actually
   reads in: what it is, what it had to solve, how it was built, what
   it is built out of, what it looks like, what it produced.

   Chapters alternate ink and bone in pairs, the same rhythm the home
   page uses, so a project page reads as part of the site rather than as
   a document bolted onto it.

   Two persistent affordances, both earned rather than decorative:
     · a reading-progress hairline, because these pages are long
     · a sticky bar carrying the project name and its real links, so
       "where can I see this" is never more than one glance away

   All content comes from src/lib/projects.ts. Nothing here is
   project-specific, so a new project is a data change, not a
   component.
   ───────────────────────────────────────────────────────────────── */

/* ── Shared reveal ────────────────────────────────────────────────
   One entrance for the whole page. `once` so nothing re-animates on
   the way back up. */
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.75, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Section heading used by every chapter, light or dark. */
function ChapterHead({
  kicker,
  title,
  dark,
  aside,
}: {
  kicker: string;
  title: string;
  dark: boolean;
  aside?: string;
}) {
  return (
    <Reveal className={`mb-12 border-t pt-6 ${dark ? 'border-white/12' : 'border-black/12'}`}>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className={`eyebrow mb-5 ${dark ? 'text-bone-raised/55' : 'text-ink/55'}`}>{kicker}</p>
          <h2 className="max-w-[18ch] text-balance font-display text-display-md font-bold">
            {title}
          </h2>
        </div>
        {aside && (
          <p
            className={`max-w-sm text-sm leading-relaxed md:text-right ${
              dark ? 'text-bone-raised/60' : 'text-ink/60'
            }`}
          >
            {aside}
          </p>
        )}
      </div>
    </Reveal>
  );
}

/* ── Reading progress ─────────────────────────────────────────── */
function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 30, mass: 0.4 });
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-accent"
    />
  );
}

/* ── Removed: the sticky project bar ──────────────────────────────
   A second bar pinned under the nav, carrying the project's name, a
   back arrow and its live/source links, for the whole length of the
   page. Two stacked bars is one more than the page needs, and nothing
   in it was only there:

     · the links are already full-size buttons in the hero, from the
       same `project.links` array — this was a duplicate of them
     · the title is the page's own `h1`, and the browser tab
     · the back arrow is the nav's "Work", which is present on these
       routes from the first pixel

   The reading-progress hairline stays. That one has no equivalent
   anywhere else on the page. */

/* ── Hero film ────────────────────────────────────────────────────
   A project that declares `heroVideo` plays it behind the title
   instead of showing a still.

   Three things make it safe to declare a film before the file is
   actually there:

     · the cover image is always rendered underneath, so the hero is
       never empty — the film is a layer on top of it, not a
       replacement for it
     · a HEAD request decides whether to mount the <video> at all.
       Mounting one against a missing file works (the cover shows
       through) but logs a 404 as a console *error*; a failed `fetch`
       resolves quietly, so this keeps the console clean while the
       footage is still on its way
     · the film only fades up once it is genuinely playing, so a slow
       connection shows the still rather than a black rectangle

   Drop the file in and it appears. Nothing to change in code. */
function useFileExists(src: string | undefined) {
  const [exists, setExists] = useState(false);

  useEffect(() => {
    if (!src) return;
    let live = true;

    fetch(src, { method: 'HEAD' })
      .then((res) => {
        /* A 200 is not enough. This app is served with an SPA fallback
           — it has to be, or a hard refresh on /projects/netra 404s at
           the CDN — which means a *missing* file comes back as 200
           index.html rather than as a 404. The content type is what
           actually distinguishes "here is your video" from "here is
           the app again"; anything HTML is the fallback answering. */
        const type = res.headers.get('content-type') ?? '';
        if (live) setExists(res.ok && !type.includes('text/html'));
      })
      .catch(() => live && setExists(false));

    return () => {
      live = false;
    };
  }, [src]);

  return exists;
}

/* Same hook as HeroSection and ExperienceRoles: one DOM copy placed by
   a JS media query, rather than two copies toggled with `hidden` /
   `sm:block`. Two copies would put both paragraphs in the markup, which
   a crawler reads as the page saying itself twice. */

/** Matches the `sm` breakpoint the rest of this page switches on. */
const COMPACT_QUERY = '(max-width: 639px)';

/** Pause and sound, because the film starts on its own. */
function FilmControls({
  paused,
  muted,
  onTogglePlay,
  onToggleSound,
}: {
  paused: boolean;
  muted: boolean;
  onTogglePlay: () => void;
  onToggleSound: () => void;
}) {
  const button =
    'grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-ink/50 text-bone-raised backdrop-blur-md transition-colors duration-200 hover:border-white/45 hover:bg-ink/70';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6, ease: EASE_OUT }}
      className="absolute bottom-6 right-gutter z-20 flex items-center gap-2"
    >
      {/* Auto-playing motion longer than five seconds needs a stop,
          so this is a requirement rather than a flourish. */}
      <button type="button" onClick={onTogglePlay} className={button} aria-label={paused ? 'Play showreel' : 'Pause showreel'}>
        {paused ? <Play className="ml-0.5 h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
      </button>
      <button type="button" onClick={onToggleSound} className={button} aria-label={muted ? 'Unmute showreel' : 'Mute showreel'}>
        {muted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
      </button>
    </motion.div>
  );
}

/* ── Hero ─────────────────────────────────────────────────────── */
function Hero({ project }: { project: Project }) {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  /* The image drifts slower than the page and grows very slightly, so
     the title separates from it as you leave rather than travelling
     with it as one flat plate. */
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  /* Nobody gets an unrequested moving background if they have asked
     the system for less motion. */
  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  /* The hero paragraph is the cover's whole problem on a phone. The
     lede runs 180 to 450 characters — five lines on the shortest
     project, eleven on DineGuru — and at that length it covers most of
     a portrait frame, so the picture the hero is built around is
     reduced to a strip at the top and whatever shows between the
     descenders.

     `summary` is the answer and it is already written. Every project
     carries one: an authored single line doing exactly this job on the
     deck frame, 111 to 138 characters, which measures three lines at
     390 and four at 320 — against five to eleven for the lede. Nothing
     is invented and nothing is truncated; the full lede still opens the
     page from `sm` up, where there is room to read it. */
  const compact = useMediaQuery(COMPACT_QUERY);
  const standfirst = compact ? project.summary : project.lede;

  const film = reducedMotion ? undefined : project.heroVideo;
  const filmReady = useFileExists(film?.src);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  /* React does not reliably reflect `muted` onto the element, and an
     unmuted autoplay is blocked outright, so it is set by hand. */
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted, filmReady]);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setPaused(false);
    } else {
      el.pause();
      setPaused(true);
    }
  };

  return (
    <header
      ref={ref}
      className="relative flex min-h-[86svh] flex-col justify-end overflow-hidden bg-ink pt-[var(--nav-h)]"
    >
      <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0">
        <Picture
          sizes="100vw"
          src={project.cover}
          alt=""
          className="h-full w-full object-cover object-center"
          decoding="async"
        />

        {film && filmReady && (
          <motion.video
            ref={videoRef}
            src={film.src}
            poster={film.poster ?? project.cover}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`${project.title} showreel`}
            initial={{ opacity: 0 }}
            animate={{ opacity: playing ? 1 : 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT }}
            onPlaying={() => setPlaying(true)}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        )}
      </motion.div>

      {/* Two scrims, not one: a flat wash for overall legibility and a
          bottom ramp so the title never fights the picture under it.
          The film sits under both — a showreel is the backdrop to the
          title here, not the subject.

          The mobile ramp is the tighter of the two, not the heavier one.
          The desktop numbers assume copy sitting in the bottom third of
          a wide frame; the phone hero now carries a three-line
          standfirst instead of a ten-line lede, so the copy lands in
          that bottom third too — and a ramp only has to cover the height
          the words actually occupy. `h-[58%]` puts the full-strength end
          under the title and the standfirst and hands the top 42% of the
          frame back to the picture, which on these covers is where the
          product itself is.

          Checked rather than assumed: the paragraph was hidden and the
          pixels behind it sampled on all ten covers at 320 and 390. The
          worst case is the brightest pixel under the copy on Saturdays
          at 320 — rgb(70,70,70), which the text clears at 5.6:1. Every
          other reading is 6:1 or better. */}
      <div aria-hidden="true" className="absolute inset-0 bg-ink/55" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-ink via-ink/88 to-transparent sm:h-2/3 sm:via-ink/80"
      />

      {film && filmReady && playing && (
        <FilmControls
          paused={paused}
          muted={muted}
          onTogglePlay={togglePlay}
          onToggleSound={() => setMuted((m) => !m)}
        />
      )}

      <motion.div
        style={{ y: copyY }}
        className="relative mx-auto w-full max-w-shell px-gutter pb-12 pt-16 sm:pb-20 sm:pt-24"
      >
        {/* `flex-wrap`, because the second crumb is the project's own
            category and two of them ("Consumer food delivery", "Machine
            learning · research") already fill the 280px a 320px phone
            has left after the gutters. Without it the trail pushed the
            hero's own scroll width past the viewport. */}
        <motion.nav
          aria-label="Breadcrumb"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-meta-sm uppercase tracking-wider text-bone-raised/50 sm:mb-8"
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          {/* `py-4 -my-4` is hit area, not spacing. The crumb is 10px
              mono on one line, so its box was 14px tall — a real link,
              on a phone, a third the height of a fingertip, and the only
              control on the page that measured under 30px. The padding
              takes the target to 46px and the equal negative margin
              hands the space straight back, so the trail sits exactly
              where it did. */}
          <Link
            href="/#work"
            className="-my-4 py-4 transition-colors hover:text-bone-raised"
          >
            Selected work
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-bone-raised/80">{project.category}</span>
        </motion.nav>

        <h1 className="max-w-[15ch] text-balance font-display text-display-xl font-bold leading-[0.9] text-bone-raised">
          <span className="block overflow-hidden pb-[0.08em]">
            <motion.span
              className="block"
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 1, delay: 0.08, ease: EASE_OUT }}
            >
              {project.title}
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT }}
          className="mt-6 max-w-2xl text-lede text-bone-raised/75 sm:mt-8"
        >
          {standfirst}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.44, ease: EASE_OUT }}
          className="mt-8 flex flex-wrap items-center gap-2.5 sm:mt-10 sm:gap-3"
        >
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 font-mono text-meta-sm font-bold uppercase transition-colors duration-200 ${
                link.kind === 'live'
                  ? 'bg-accent text-ink hover:bg-white'
                  : 'border border-white/20 text-bone-raised hover:border-white/45'
              }`}
            >
              {link.label}
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          ))}
        </motion.div>
      </motion.div>
    </header>
  );
}

/* ── At a glance ──────────────────────────────────────────────── */
function Facts({ project }: { project: Project }) {
  return (
    <section className="border-y border-white/10 bg-ink-raised">
      {/* `px-gutter` belongs on a wrapper, not on the grid. The grid
          paints `bg-white/10` and lets a 1px gap show through it to draw
          the dividers — with the padding on that same element, the lit
          background also filled both gutters, so the strip carried a
          vertical grey bar down each side of the page at every width. */}
      <div className="mx-auto w-full max-w-shell px-gutter">
        {/* Three across, not four. The Role cell was dropped from every
            project — nine of the ten said "Developer" or a synonym — and
            a four-column grid holding three items leaves a lit gap-px
            rule running down an empty cell.

            Three across at *every* width, including 320px. Stacked, this
            was a 350px column of three near-empty rows wedged between
            the hero and the first chapter — three-quarters of each row
            was blank, and the reader had to scroll a screen to collect
            three words. Across, it is a single band answering "what is
            this, in three facts" in one glance, which is the only job
            the strip has. */}
        <div className="grid grid-cols-3 gap-px bg-white/10">
          {project.facts.map((fact, i) => {
            /* Padding on the inner faces only. A uniform `px` indents
               the first label and the last value away from the gutter
               every other section on the page starts and ends on, so
               the band read as inset by 8px at mobile and 24px at
               desktop — visible against the chapter headings directly
               above and below it. The outer faces are flush; only the
               faces that meet a divider are padded off it. */
            const edge =
              i === 0
                ? 'pr-2 sm:pr-5 lg:pr-6'
                : i === project.facts.length - 1
                  ? 'pl-2 sm:pl-5 lg:pl-6'
                  : 'px-2 sm:px-5 lg:px-6';

            return (
            <Reveal key={fact.label} delay={i * 0.06} className="bg-ink-raised">
              <div className={`flex h-full flex-col py-7 sm:py-8 ${edge}`}>
                {/* Two lines are reserved for the label below `sm`.
                    "Backend tests" and "Recognition" wrap where "Status"
                    and "Build" do not, and a label that wraps in one cell
                    only drops that cell's value half a line below its
                    neighbours — three figures that *almost* line up read
                    as a fault, not as a set. Above `sm` every label fits
                    on one line, so the reservation is dropped. */}
                <p className="min-h-[2.6em] font-mono text-[0.5625rem] uppercase leading-[1.3] tracking-[0.1em] text-bone-raised/55 sm:min-h-0 sm:text-meta-sm sm:tracking-wider">
                  {fact.label}
                </p>
                {/* `break-words` is the floor, not the plan: at 320px a
                    cell is about 77px of content and the longest value
                    in the set ("SASRec transformer") has an 11-character
                    word in it. The clamp keeps that on one line at any
                    real phone width; the break is what stops the one
                    that cannot from painting over the divider. */}
                <p className="mt-2 text-balance break-words font-display text-[clamp(0.875rem,4vw,1.25rem)] font-bold leading-[1.15] tracking-tight text-bone-raised sm:mt-3 sm:text-display-sm">
                  {fact.value}
                </p>
              </div>
            </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}


/* ── The problem ──────────────────────────────────────────────── */
function Problem({ project }: { project: Project }) {
  return (
    <section className="bg-bone text-ink on-light">
      <div className="mx-auto max-w-shell px-gutter py-24 sm:py-32">
        <ChapterHead kicker="The problem" title="What it had to solve" dark={false} />
        <Reveal>
          <p className="max-w-4xl text-balance font-display text-display-sm font-bold leading-[1.28] text-ink/85">
            {project.problem}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── How it is made ───────────────────────────────────────────── */
function Build({ project }: { project: Project }) {
  return (
    <section className="bg-bone-sunk text-ink on-light">
      <div className="mx-auto max-w-shell px-gutter py-24 sm:py-32">
        <ChapterHead
          kicker="How it is made"
          title="The decisions that shaped it"
          dark={false}
          aside="Each of these is a choice with a cost — the reason it was made is the interesting part, not the technology named."
        />

        <div className="flex flex-col">
          {project.build.map((block, i) => (
            <Reveal key={block.title} delay={0.04}>
              {/* Three children over a two-column grid at `md`: without
                  an explicit column the body wraps onto row two of the
                  *number* column and gets squeezed into 5rem. It has to
                  be placed by hand at every breakpoint that has fewer
                  columns than children. */}
              <div className="grid gap-6 border-t border-black/12 py-10 md:grid-cols-[5rem_1fr] lg:grid-cols-[7rem_22rem_1fr] lg:gap-10">
                <span className="font-mono text-meta-sm text-ink/35">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-balance font-display text-display-sm font-bold leading-tight text-ink">
                  {block.title}
                </h3>
                <p className="max-w-prose text-lede text-ink/70 md:col-start-2 lg:col-start-3 lg:row-start-1">
                  {block.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Architecture ─────────────────────────────────────────────── */
function Architecture({ project }: { project: Project }) {
  return (
    <section className="bg-ink">
      <div className="mx-auto max-w-shell px-gutter py-24 sm:py-32">
        <ChapterHead
          kicker="Architecture"
          title="How the pieces sit together"
          dark
          aside="Top to bottom, closest to the user first."
        />

        <div className="flex flex-col">
          {project.architecture.map((row, i) => (
            <Reveal key={row.layer} delay={i * 0.05}>
              <div className="group grid gap-3 border-t border-white/10 py-7 transition-colors duration-300 hover:bg-white/[0.03] md:grid-cols-[12rem_1fr] md:gap-10">
                <p className="font-mono text-meta-sm uppercase tracking-wider text-accent">
                  {row.layer}
                </p>
                <p className="text-lede text-bone-raised/70">{row.detail}</p>
              </div>
            </Reveal>
          ))}
          <div className="border-t border-white/10" />
        </div>
      </div>
    </section>
  );
}

/* ── Features + stack ─────────────────────────────────────────── */
function Capabilities({ project }: { project: Project }) {
  return (
    <section className="bg-bone text-ink on-light">
      <div className="mx-auto max-w-shell px-gutter py-24 sm:py-32">
        <ChapterHead kicker="What it does" title="Built into the product" dark={false} />

        <div className="grid gap-px bg-black/12 sm:grid-cols-2">
          {project.features.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 0.05} className="bg-bone">
              {/* No horizontal padding below `sm`. The grid is a single
                  column there, so the cell padding bought nothing — it
                  only pushed every feature 24px inboard of the gutter
                  the chapter heading above it sits on, which reads as a
                  block of text that has slipped sideways. From `sm` the
                  grid is genuinely two columns and the padding is what
                  keeps them off the divider between them. */}
              <div className="h-full py-8 sm:px-8 sm:py-9">
                <p className="font-mono text-meta-sm text-ink/35">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-4 font-display text-display-sm font-bold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-3 text-lede text-ink/65">{feature.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-20">
          <ChapterHead kicker="Stack" title="What it is built out of" dark={false} />
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {project.stackDetail.map((group, i) => (
              <Reveal key={group.group} delay={i * 0.06}>
                <p className="mb-4 font-mono text-meta-sm uppercase tracking-wider text-ink/45">
                  {group.group}
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded border border-black/12 bg-black/[0.04] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ink/70"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Walkthrough ──────────────────────────────────────────────────
   Mounts only when a project declares `video`. See the note at the
   top of src/lib/projects.ts for how to turn it on. */
function Walkthrough({ project }: { project: Project }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  if (!project.video) return null;
  const { src, poster, caption } = project.video;

  const start = () => {
    setPlaying(true);
    /* Play after the poster has been swapped out, otherwise Safari
       treats the call as detached from the gesture. */
    requestAnimationFrame(() => videoRef.current?.play());
  };

  return (
    <section className="bg-ink">
      <div className="mx-auto max-w-shell px-gutter py-24 sm:py-32">
        <ChapterHead kicker="Walkthrough" title="The product, running" dark />
        <Reveal>
          <figure>
            <div className="relative aspect-video overflow-hidden bg-ink-sunk">
              <video
                ref={videoRef}
                src={src}
                poster={poster}
                controls={playing}
                playsInline
                preload="none"
                className="h-full w-full object-cover"
              />
              {!playing && (
                <button
                  type="button"
                  onClick={start}
                  className="group absolute inset-0 grid place-items-center bg-ink/30 transition-colors duration-300 hover:bg-ink/15"
                  aria-label="Play walkthrough"
                >
                  <span className="grid h-20 w-20 place-items-center rounded-full bg-accent text-ink transition-transform duration-300 ease-out group-hover:scale-110">
                    <Play className="ml-1 h-7 w-7" aria-hidden="true" />
                  </span>
                </button>
              )}
            </div>
            <figcaption className="mt-4 font-mono text-meta-sm uppercase tracking-wider text-bone-raised/45">
              {caption}
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Gallery ──────────────────────────────────────────────────── */
function Gallery({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: (index: number) => void;
}) {
  return (
    <section className="bg-ink">
      <div className="mx-auto max-w-shell px-gutter py-24 sm:py-32">
        <ChapterHead
          kicker="Gallery"
          title="What it looks like"
          dark
          aside="Click any image to open it full size."
        />

        <div className="flex flex-col gap-6">
          {project.gallery.map((item, i) => (
            <Reveal key={item.src + i}>
              <figure>
                <button
                  type="button"
                  onClick={() => onOpen(i)}
                  className="group block w-full overflow-hidden bg-ink-sunk"
                  aria-label={`Open image: ${item.caption}`}
                >
                  <Picture
                    sizes="(min-width: 640px) 48vw, 95vw"
                    src={item.src}
                    alt={item.caption}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[16/10] w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.02]"
                  />
                </button>
                <figcaption className="mt-4 flex items-baseline gap-3">
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-accent">
                    {item.kind === 'product' ? 'Product' : 'Context'}
                  </span>
                  <span className="text-sm text-bone-raised/55">{item.caption}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Lightbox ─────────────────────────────────────────────────── */
function Lightbox({
  items,
  index,
  onClose,
  onStep,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onStep(1);
      if (e.key === 'ArrowLeft') onStep(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, onStep]);

  const item = items[index];

  /* Backdrop is `bg-ink/95`, not `/96`: the opacity modifier reads the
     theme's opacity scale, and a value that is not on it emits no CSS
     at all. This backdrop blurred the page behind it without ever
     darkening it. */
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={item.caption}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
      className="fixed inset-0 z-[80] flex flex-col bg-ink/95 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex h-[var(--nav-h)] shrink-0 items-center justify-between px-gutter">
        <span className="font-mono text-meta-sm uppercase tracking-wider text-bone-raised/50">
          {index + 1} / {items.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close image"
          className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-bone-raised transition-colors hover:bg-white/10"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div
        className="flex min-h-0 flex-1 items-center justify-center px-gutter pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <MotionPicture
          sizes="(min-width: 1024px) 80vw, 95vw"
          key={item.src}
          src={item.src}
          alt={item.caption}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div
        className="flex shrink-0 items-center justify-between gap-6 px-gutter pb-8 pt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="max-w-xl text-sm text-bone-raised/60">{item.caption}</p>
        {items.length > 1 && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onStep(-1)}
              aria-label="Previous image"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-bone-raised transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onStep(1)}
              aria-label="Next image"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-bone-raised transition-colors hover:bg-white/10"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Results ──────────────────────────────────────────────────── */
function Results({ project }: { project: Project }) {
  return (
    <section className="border-t border-white/10 bg-ink-raised">
      <div className="mx-auto max-w-shell px-gutter py-24 sm:py-32">
        <ChapterHead kicker="Outcome" title="What it produced" dark />
        {/* These stay stacked below `sm`, unlike the facts strip up the
            page. Two reasons, and they are worth separating.

            Three across does not work here. A fact is one or two words
            and lives happily in a 77px column; a result carries a whole
            clause — "Tenancy resolved from memberships, never from
            input" — which at a third of a 320px screen becomes a
            two-word-wide ribbon eight lines deep.

            Figure beside clause does not work either, though it looks
            right on the projects whose figures happen to match. Each row
            sizes its own figure, so the clause column starts wherever
            that row's figure happens to end: measured across the ten
            projects the drift reached 102px at 320px, between "One" and
            "Open source" on the same strip. Three clauses beginning at
            three different places is worse than three clauses beginning
            below their figures.

            So: stacked, but tight. `py-7` against the old `py-10`,
            `mt-3` against `mt-5`, and the clause at 15px rather than the
            20px lede — 814px down to 674px at 390, with every figure and
            every clause landing on one left edge. */}
        <div className="grid gap-px bg-white/10 sm:grid-cols-3">
          {project.results.map((result, i) => (
            <Reveal key={result.label} delay={i * 0.08} className="bg-ink-raised">
              <div className="h-full py-7 sm:px-8 sm:py-10">
                <p className="font-display text-[1.625rem] font-bold leading-none tracking-tight text-accent sm:text-display-md">
                  {result.value}
                </p>
                <p className="mt-3 text-[0.9375rem] leading-snug text-bone-raised/60 sm:mt-5 sm:max-w-xs sm:text-lede">
                  {result.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Next project ──────────────────────────────────────────── */
function Pager({ slug }: { slug: string }) {
  const { next } = neighbours(slug);
  if (!next) return null;

  return (
    <section className="border-t border-white/10 bg-ink">
      <Link href={`/projects/${next.slug}`} className="group block">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Picture
              sizes="100vw"
              src={next.cover}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-center opacity-25 transition-all duration-[1400ms] ease-out group-hover:scale-105 group-hover:opacity-40"
            />
          </div>
          {/* Three stops rather than two: the two-stop ramp left the top
              of the next project's cover bright enough to read through
              its own title. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/55"
          />

          <div className="relative mx-auto flex max-w-shell flex-col gap-5 px-gutter py-24 sm:py-32">
            <p className="eyebrow text-bone-raised/50">Next project</p>
            <h2 className="max-w-[16ch] text-balance font-display text-display-lg font-bold leading-[0.94] text-bone-raised">
              {next.title}
            </h2>
            <span className="mt-2 inline-flex items-center gap-3 font-mono text-meta-sm font-bold uppercase text-bone-raised/70 transition-colors group-hover:text-bone-raised">
              Read it
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/20 transition-all duration-300 ease-out group-hover:border-transparent group-hover:bg-accent group-hover:text-ink">
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export function ProjectPage({ slug }: { slug: string }) {
  /* The slug arrives as a prop rather than out of a router hook. App
     already has the pathname — it needs it to decide that this page is
     what renders at all — so parsing the same string a second time
     here would be a second place for the two to disagree. It also
     keeps this component a plain function of its input, which is what
     makes it testable and what makes it possible to render it from
     anywhere. */
  const project = getProject(slug);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (!project) return;
    const previous = document.title;
    document.title = `${project.title} — Divyakush Punjabi`;
    return () => {
      document.title = previous;
    };
  }, [project]);

  /* An unknown slug is a 404, not a blank page. */
  if (!project) return <NotFound />;

  const step = (delta: number) =>
    setLightbox((current) => {
      if (current === null) return current;
      const total = project.gallery.length;
      return (current + delta + total) % total;
    });

  return (
    <>
      <ReadingProgress />

      <main id="main">
        <Hero project={project} />
        <Facts project={project} />
        <Problem project={project} />
        <Build project={project} />
        <Architecture project={project} />
        <Capabilities project={project} />
        <Walkthrough project={project} />
        <Gallery project={project} onOpen={setLightbox} />
        <Results project={project} />
        <Pager slug={project.slug} />
      </main>

      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox
            items={project.gallery}
            index={lightbox}
            onClose={() => setLightbox(null)}
            onStep={step}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default ProjectPage;
