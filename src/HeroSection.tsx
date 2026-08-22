import { asset } from './lib/asset';
import React from 'react';
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue, animate } from 'motion/react';
import _heroPhoto from './assets/hero-no-bg.webp';

import { PROFILE } from './lib/content';
import { useIntroSequence } from './lib/useIntroSequence';
import { Picture } from './components/Picture';
import { useMediaQuery } from './lib/useMediaQuery';
/* The same constant the build-time preload uses. If this changes and
   the preload does not, the scanner warms one rendition and the
   renderer paints another — a wasted download rather than a saved
   one. See src/lib/hero-image.ts. */
import { HERO_SIZES } from './lib/hero-image';

/* Vite resolved these imports to URL strings; Next resolves them to
   StaticImageData objects. `asset()` is the single boundary where that
   difference is settled — see src/lib/asset.ts for why it is a function
   and not a bundler setting. Everything below this block is a string,
   exactly as it was before the port. */
const heroPhoto = asset(_heroPhoto);

/* ─────────────────────────────────────────────────────────────────
   HERO — original layout and choreography, restored.

   Structure, positions and motion are the same as the first build:
   giant stretched wordmark sliding in letter by letter, portrait
   rising out of the floor and unblurring, flanking glass cards, side
   navigation, and the baseline lockup. What changed is the palette
   (bone/ink instead of beige/#FFFF23) and four defects that were
   never part of the design:

     1. Every floating layer was `fixed … z-30 pointer-events-auto`.
        They faded to opacity 0 on scroll but stayed mounted above the
        whole document, swallowing clicks on every section below. The
        stack is still pinned to the viewport — that feel IS the design
        — but it now lives in a single `pointer-events-none` overlay
        that is clipped to the hero's own bottom edge and flips to
        `visibility: hidden` once the hero is gone.
     2. The qualities card and both side-nav rails set `opacity` in
        BOTH `animate` and `style`. A MotionValue in `style` owns the
        property outright, so their intro fades never ran. Scroll and
        intro values now live on separate nested elements.
     3. Nothing responded below ~1280px: the flanking cards sat at
        `left-[23vw]`/`right-[23vw]` straight through the portrait.
        Desktop is untouched; the cards and rails now step out of the
        way on smaller screens instead of colliding.
     4. Side-nav links pointed at #services / #clients / #faq, none of
        which exist.
   ───────────────────────────────────────────────────────────────── */

/* Letter geometry for the 1000×100 viewBox. `preserveAspectRatio="none"`
   stretches this to the full width and height of the band, which is
   what produces the oversized compressed display type. */
const LETTERS = [
  { char: 'D', x: 0,   width: 130 },
  { char: 'I', x: 122, width: 45 },
  { char: 'V', x: 159, width: 130 },
  { char: 'Y', x: 281, width: 130 },
  { char: 'A', x: 403, width: 130 },
  { char: 'K', x: 525, width: 130 },
  { char: 'U', x: 647, width: 130 },
  { char: 'S', x: 769, width: 110 },
  { char: 'H', x: 871, width: 129 },
];

const QUALITIES = [
  {
    label: 'Creative',
    path: 'M12 12 L20.5 7.5 A10 10 0 1 0 20.5 16.5 Z',
  },
  {
    label: 'Reliable',
    circles: true,
  },
  {
    label: 'Strategist',
    path: 'M2 19h20v2H2v-2zm1-2h18V7l-4 4-3-6-3 6-4-4v10z',
  },
  {
    label: 'Builder',
    path: 'M12 2L4 7l8 5 8-5-8-5zm0 8l-8-5v5l8 5 8-5V5l-8 5z',
  },
  {
    label: 'Efficient',
    path: 'M12 2c0 5.52 4.48 10 10 10-5.52 0-10 4.48-10 10 0-5.52-4.48-10-10-10 5.52 0 10-4.48 10-10z',
  },
];

/* ── Intro fades run on the main thread ───────────────────────────
   Motion accelerates a plain opacity tween through the Web Animations
   API. While that animation runs, the element's *inline* opacity stays
   at the `initial` value and the WAAPI override supplies the visible
   one. At hand-off motion cancels the override a frame before it
   commits the resting value to inline style, so the `initial` 0 shows
   through for exactly one frame — a visible blink of the headline, the
   CTAs and the scrim about 4.3s into the intro. Reproduced in the
   production build, so it is not a dev-mode artifact.

   Passing `onUpdate` forces motion to drive the value from JS each
   frame instead, which removes the hand-off and the blink with it. */
const NO_WAAPI = () => {};

/* ── Compact ──────────────────────────────────────────────────────
   Below `lg` the hero is a different composition, not a squeezed
   version of the same one, and two of the differences cannot be
   expressed in CSS from the desktop markup:

     · The headline and the CTAs are positioned as percentages of the
       *portrait box*, which is `aspect-square h-[72vh]` — wider than
       a phone. `left-[6%]` of a 620px box centred in a 390px viewport
       resolves to −35px, so on every phone tested the headline was
       painted off the left edge of the screen.
     · The same two sit in the pinned overlay while the baseline
       lockup sits in flow at the foot of the section. Both are
       anchored to the bottom, neither knows about the other, and on
       a phone they land on top of each other.

   Both are fixed by putting them in the flow column above the lockup
   on small screens, which is a placement, not a style — hence a
   media query in JS rather than a class. Rendering one branch or the
   other also keeps a single copy of each link in the document; the
   `hidden`/`lg:block` version of this would have put two "Get in
   touch" links in the accessibility tree at every width. */

const COMPACT_QUERY = '(max-width: 1023px)';

function QualityIcon({ q }: { q: (typeof QUALITIES)[number] }) {
  return (
    <svg className="h-4 w-4 shrink-0 fill-current text-ink" viewBox="0 0 24 24" aria-hidden="true">
      {q.circles ? (
        <>
          <circle cx="7" cy="12" r="3.5" />
          <circle cx="17" cy="12" r="3.5" />
          <circle cx="12" cy="7" r="3.5" />
          <circle cx="12" cy="17" r="3.5" />
        </>
      ) : (
        <path d={q.path} />
      )}
    </svg>
  );
}

export function HeroSection() {
  const { phase, instant } = useIntroSequence();

  const compact = useMediaQuery(COMPACT_QUERY);

  /* A 35px blur across a portrait this size is the single most
     expensive thing in the hero, and it runs twice — once on the
     intro and again the whole way through the scroll-out. Phones
     rasterise that at device pixel ratio 2 or 3 on a GPU with a
     fraction of a laptop's fill rate, which is where the dropped
     frames on older handsets come from. Half the radius is a
     quarter of the work and, at this scale, reads the same. */
  const maxBlur = compact ? 16 : 35;

  const startupBlur = useMotionValue(instant ? 0 : maxBlur);
  const startupScale = useMotionValue(instant ? 1 : 0.82);

  const lettersLanded = phase !== 'letters';
  const introDone = phase === 'done';

  /* Drive the startup blur/scale off the phase change rather than a
     second timer, so a skipped intro lands on the final values. */
  React.useEffect(() => {
    if (instant) return;
    if (phase === 'letters') return;
    const d = phase === 'done' ? 0.2 : 0.75;
    const a1 = animate(startupBlur, 0, { duration: d, ease: 'linear' });
    const a2 = animate(startupScale, 1, { duration: d, ease: [0.16, 1, 0.3, 1] });
    return () => {
      a1.stop();
      a2.stop();
    };
  }, [phase, instant, startupBlur, startupScale]);

  const heroRef = React.useRef<HTMLElement>(null);

  /* ── Hero scroll progress ────────────────────────────────────────
     0 while the hero is pinned at the top of the viewport, 1 once it
     has scrolled completely past. Every value below is a fraction of
     that span rather than a pixel offset.

     The pixel stops this replaces (250 / 300 / 450 / 500 / 620) were
     calibrated against an ~800px viewport, and they are what produced
     the overlay bleed after a refresh. Two separate faults:

       · the portrait's fade bottomed out at opacity 0.22, not 0, so it
         never actually left;
       · the pinned layers were not hidden until 620px, well before a
         100svh hero has finished scrolling away.

     Anywhere between those two numbers a blurred ghost of the portrait
     and the glass cards sat pinned over the section below. Scrolling
     you pass through it in a few frames; a refresh drops you straight
     into the band and parks there, which is why it only ever looked
     broken on reload. On a tall display the same constants failed the
     other way, tearing the overlay down while the hero was still on
     screen. Both go away once the numbers are relative to the hero. */
  const { scrollYProgress: heroOut } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  /* ── Wordmark: lifts, flattens and fades ── */
  const nameScrollY = useTransform(heroOut, [0, 0.56], [0, -160], { clamp: true });
  const nameScaleY = useTransform(heroOut, [0, 0.56], [1, 0.2], { clamp: true });
  const nameOpacity = useTransform(heroOut, [0, 0.48], [1, 0], { clamp: true });

  /* ── Portrait: recedes, re-blurs, and clears out completely ── */
  const imageOpacity = useTransform(heroOut, [0, 0.78], [1, 0], { clamp: true });
  const scrollBlur = useTransform(heroOut, [0, 0.62], [0, maxBlur], { clamp: true });
  const scrollScale = useTransform(heroOut, [0, 0.75], [1, 0.95], { clamp: true });
  const blurVal = introDone ? scrollBlur : startupBlur;
  const scaleVal = introDone ? scrollScale : startupScale;
  const imageFilter = useMotionTemplate`blur(${blurVal}px)`;

  /* ── Chrome ── */
  const heroTextOpacity = useTransform(heroOut, [0, 0.31], [1, 0], { clamp: true });

  const leftRailY = useTransform(heroOut, [0, 0.31], [0, 60], { clamp: true });
  const leftRailOpacity = useTransform(heroOut, [0, 0.31], [1, 0], { clamp: true });
  const rightRailY = useTransform(heroOut, [0, 0.31], [0, -60], { clamp: true });
  const rightRailOpacity = useTransform(heroOut, [0, 0.31], [1, 0], { clamp: true });

  /* Decoupled drift for the flanking cards — different offsets,
     rotations and vertical travel each, as in the original. */
  const card1X = useTransform(heroOut, [0, 0.375], [0, -50], { clamp: true });
  const card1Y = useTransform(heroOut, [0, 0.375], [0, -35], { clamp: true });
  const card1Rotate = useTransform(heroOut, [0, 0.375], [0, -6], { clamp: true });
  const card1Opacity = useTransform(heroOut, [0, 0.325], [1, 0], { clamp: true });

  const card2X = useTransform(heroOut, [0, 0.375], [0, -35], { clamp: true });
  const card2Y = useTransform(heroOut, [0, 0.375], [0, 45], { clamp: true });
  const card2Rotate = useTransform(heroOut, [0, 0.375], [0, 5], { clamp: true });
  const card2Opacity = useTransform(heroOut, [0, 0.35], [1, 0], { clamp: true });

  const card3X = useTransform(heroOut, [0, 0.375], [0, 55], { clamp: true });
  const card3Y = useTransform(heroOut, [0, 0.375], [0, -25], { clamp: true });
  const card3Rotate = useTransform(heroOut, [0, 0.375], [0, 4], { clamp: true });
  const card3Opacity = useTransform(heroOut, [0, 0.34], [1, 0], { clamp: true });

  const footerLeftX = useTransform(heroOut, [0, 0.375], [0, -45], { clamp: true });
  const footerLeftOpacity = useTransform(heroOut, [0, 0.375], [1, 0], { clamp: true });
  const footerRightY = useTransform(heroOut, [0, 0.375], [0, 40], { clamp: true });
  const footerRightOpacity = useTransform(heroOut, [0, 0.375], [1, 0], { clamp: true });

  /* Once the hero has genuinely left, every pinned layer goes `hidden`.
     Opacity 0 alone still leaves them composited and hit-testable. The
     threshold is the end of the hero's own span, so it can never fire
     while the hero is still visible — nor, as before, fail to fire once
     it isn't.

     The rect check is the second half of that guarantee, and it is not
     redundant. `heroOut` is derived from the *document's* scroll
     offset, and there is a state in which that offset lies: every
     dialog on this site scroll-locks the page by pinning <body> at a
     negative top, which leaves the page looking exactly as it did and
     reports `scrollY` as 0. To this section that is indistinguishable
     from being back at the top, so `heroOut` collapses to 0 and the
     whole pinned stack — portrait, glass cards, rails — unhides itself
     over whatever section you were actually reading, and shows through
     the dialog's backdrop. Measured before this line existed: the
     portrait painted at full opacity with the hero 27,958px above the
     viewport, for as long as the dialog was up and ~150ms after it
     closed.

     So the number is checked against the thing it is a proxy for. If
     the hero's own bottom edge is above the top of the viewport, the
     hero is not on screen, and nothing that belongs to it may paint —
     whatever the scroll offset claims. The read costs a layout only on
     frames where the answer would otherwise be `visible`, which is to
     say while the hero is genuinely in view. */
  const overlayVisibility = useTransform(heroOut, (v) => {
    if (v >= 0.995) return 'hidden';
    const el = heroRef.current;
    if (el && el.getBoundingClientRect().bottom <= 0) return 'hidden';
    return 'visible';
  });

  /* ── The overlay is clipped to the hero's own bottom edge ────────
     The pinned layers are `fixed`, so they hang off the *viewport*
     floor while the hero's floor rides up with the scroll. Scroll 220px
     and the portrait's legs, the "2+ years" card and the two buttons
     are drawn across 220px of whatever section comes next — which is
     the overhang in the reported screenshot. It was there while
     scrolling too; a refresh only parks you in it, so it stops reading
     as motion and starts reading as breakage.

     Clipping the overlay at `heroOut` of the viewport height cuts it
     off exactly where the hero ends, so the pinned stack slides behind
     the next section instead of on top of it. The pinned feel is
     untouched — the layers still hold their position against the
     viewport, they just can no longer draw outside their own section. */
  const clipBottom = useTransform(heroOut, [0, 1], [0, 100], { clamp: true });
  const heroClip = useMotionTemplate`inset(0px 0px ${clipBottom}% 0px)`;

  const fade = (delay = 0) =>
    instant
      ? { duration: 0 }
      : { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const };

  /* Built once and placed in one of two parents: pinned over the
     portrait at `lg` and up, in the flow column above the lockup
     below it. Same element either way, so there is one headline and
     one pair of links in the document at any width. */
  const headlineBlock = (
    <motion.div
      key="hero-headline"
      className={
        compact
          ? 'flex flex-col items-start text-left'
          : 'pointer-events-none absolute bottom-[20%] left-[12%] flex flex-col items-start text-left'
      }
      initial={instant ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: introDone ? 1 : 0, y: introDone ? 0 : 15 }}
      transition={fade()}
      onUpdate={NO_WAAPI}
    >
      {/* Weight is already at the ceiling: the display stack ships one
          face at 700, and `font-synthesis-weight: none` is set on the
          body — so `font-black` would render identically when the CDN
          font loads and swap to Inter 900 when it does not, which is a
          different typeface, not a bolder one. Size, tracking and
          leading are the levers that actually work here.

          Tracking goes to -0.04em, which is where this site's own
          display scale sits (-0.035em to -0.045em) — the headline was
          on `tracking-tight` at -0.025em, looser than every other piece
          of display type on the page. */}
      <p className="font-display text-[2.125rem] font-bold leading-[0.98] tracking-[-0.04em] text-ink sm:text-[2.6rem] md:text-[2.8rem]">
        Full Stack,
        <br />
        Applied
        <br />
        Differently.
      </p>
    </motion.div>
  );

  const actionsBlock = (
    <motion.div
      key="hero-actions"
      className={
        compact
          ? 'flex flex-wrap items-center gap-3'
          : 'absolute bottom-6 left-[12%] z-30 flex items-center gap-3'
      }
      initial={instant ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: introDone ? 1 : 0, y: introDone ? 0 : 15 }}
      transition={fade()}
      onUpdate={NO_WAAPI}
    >
      {/* Both CTAs carry their own separation — a lifted shadow on the
          ink button, a solid ground and firmer border on the light one
          — so neither depends on whatever happens to be behind it. */}
      <a
        href="#contact"
        className="pointer-events-auto rounded-[8px] bg-ink px-6 py-3 font-mono text-meta-sm font-bold uppercase text-bone-raised shadow-[0_8px_24px_rgba(11,11,12,0.28)] transition-colors duration-200 hover:bg-ink-raised sm:px-8"
      >
        Get in touch
      </a>
      <a
        href="#work"
        className="pointer-events-auto rounded-[8px] border border-black/20 bg-bone-raised px-6 py-3 font-mono text-meta-sm font-bold uppercase text-ink shadow-[0_8px_24px_rgba(11,11,12,0.14)] transition-colors duration-200 hover:border-black/45 sm:px-8"
      >
        See the work
      </a>
    </motion.div>
  );

  return (
    <section
      ref={heroRef}
      id="top"
      className="relative flex h-[100svh] w-full flex-col justify-between overflow-hidden bg-bone p-6 pb-3 text-ink on-light sm:p-8 md:p-12"
    >
      {/* ── 1. GIANT WORDMARK ─────────────────────────────────────
          Sits in a 50vh band that lifts to -25vh once the letters
          land, exactly as before. */}
      {/* The band's height is the type size. `preserveAspectRatio="none"`
          maps a 1000×100 viewBox onto whatever box this is, so the
          vertical stretch is `10 × height ÷ width` — the number that
          decides whether the wordmark reads as confident display type
          or as something squeezed to fit.

          Desktop lands near 3× and looks deliberate. The same 40vh on
          a phone is 8.7×, because the viewport lost three quarters of
          its width and none of its height. These steps hold the ratio
          near 4× from 360px up to the `lg` breakpoint, where the
          original 50vh takes over unchanged. */}
      <motion.div
        className="pointer-events-none absolute left-0 top-[25vh] h-[19vh] w-full select-none overflow-visible sm:h-[26vh] md:h-[32vh] lg:h-[50vh]"
        animate={{ y: lettersLanded ? '-25vh' : '0vh' }}
        transition={instant ? { duration: 0 } : { duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ zIndex: lettersLanded ? 10 : 25 }}
      >
        <h1 className="sr-only">
          {PROFILE.name} — {PROFILE.role}
        </h1>

        <motion.div
          className="h-full w-full overflow-visible"
          style={{
            y: nameScrollY,
            scaleY: nameScaleY,
            opacity: nameOpacity,
            transformOrigin: 'center center',
          }}
        >
          <svg
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="h-full w-full select-none overflow-visible"
          >
            {LETTERS.map((item, i) => (
              <motion.text
                key={item.char + i}
                y="81"
                textLength={item.width}
                lengthAdjust="spacingAndGlyphs"
                fill="#0B0B0C"
                style={{ fontFamily: '"Tr 3 A", sans-serif', fontWeight: 700, letterSpacing: '-0.09em' }}
                className="select-none text-[110px]"
                initial={instant ? { attrX: item.x, opacity: 1 } : { attrX: 1000, opacity: 0 }}
                animate={{ attrX: item.x, opacity: 1 }}
                transition={
                  instant
                    ? { duration: 0 }
                    : {
                        type: 'spring',
                        stiffness: 58,
                        damping: 15,
                        mass: 0.7,
                        delay: i * 0.045,
                      }
                }
              >
                {item.char}
              </motion.text>
            ))}
          </svg>
        </motion.div>
      </motion.div>

      {/* ── PINNED OVERLAY ────────────────────────────────────────
          Every viewport-pinned layer lives in here. They used to be
          five independent `fixed` elements, each hidden on its own
          threshold; now they share one clipped, pinned box, so nothing
          in the hero can paint past the hero. Children are `absolute`
          against this full-viewport box, which is positionally
          identical to the `fixed` they replaced. */}
      <motion.div
        style={{
          visibility: overlayVisibility,
          clipPath: heroClip,
          zIndex: lettersLanded ? 20 : 15,
        }}
        className="pointer-events-none fixed inset-0"
      >
        {/* ── 2. PORTRAIT ───────────────────────────────────────────
            Still pinned to the viewport floor. Purely decorative, so the
            whole stack is pointer-events-none. */}
        {/* The phone height is not a taste call — it is the only
            value that satisfies both ends of the frame at once.

            The subject occupies the source from 4.8% of its height
            down to the file's bottom edge, so with the box on the
            floor the hairline lands at `100vh − 0.952 × height`.
            That single relation fixes everything:

              74vh on the floor  → hair at 29.5vh, 10vh below the
                                   wordmark. The gap moves to the top.
              74vh lifted 10vh   → hair meets the wordmark, but the
                                   foot stops 10vh short of the floor.
                                   The gap moves to the bottom.
              85vh on the floor  → hair at 19.1vh and the foot on the
                                   floor. No gap at either end.

            85vh is the *smallest* height with no gap: below it the
            image cannot span from the wordmark to the floor, so the
            face being ~15% larger than the 74vh step is a consequence
            of closing both gaps, not a crop decision. There is no
            more of him in the file to pull down instead — the source
            is cut at mid-chest by its own bottom edge. */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 flex aspect-square h-[85vh] -translate-x-1/2 items-end justify-center sm:h-[76vh] lg:h-[80vh]">
          <div className="relative flex h-full w-full items-end justify-center overflow-visible">
            {/* Outer: scroll-driven. Inner: intro-driven. Kept apart so
                neither cancels the other. */}
            <motion.div
              className="relative flex h-full w-full items-end justify-center"
              style={{ scale: scaleVal, filter: imageFilter, opacity: imageOpacity }}
            >
              <motion.div
                className="flex h-full w-full items-end justify-center"
                initial={instant ? false : { y: '50%', opacity: 0 }}
                animate={{
                  y: lettersLanded ? '0%' : '50%',
                  opacity: lettersLanded ? 1 : 0,
                }}
                transition={
                  instant
                    ? { duration: 0 }
                    : {
                        y: { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
                        opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                      }
                }
                onUpdate={NO_WAAPI}
              >
                <Picture
                  sizes={HERO_SIZES}
                  src={heroPhoto}
                  alt=""
                  width={1024}
                  height={1024}
                  decoding="async"
                  /* React 19 knows this attribute by its camelCase
                     name. Under React 18 it did not, and passing it
                     directly logged an unknown-property warning — hence
                     the spread of a lowercase key, which slipped past
                     the check and reached the DOM correctly. React 19
                     added the property and now warns the other way, so
                     the workaround has become the thing it was working
                     around. Written plainly. */
                  fetchPriority="high"
                  /* The drop shadow is a second filter pass over the
                     same large bitmap, on top of the blur its parent
                     already applies. It is barely readable against
                     bone and it is not worth a second rasterisation
                     on a phone GPU, so it starts at `lg`. */
                  className="h-full w-auto select-none object-cover object-top lg:drop-shadow-[0_20px_35px_rgba(0,0,0,0.12)]"
                />
              </motion.div>
            </motion.div>

            {/* Headline + buttons, over the portrait. */}
            <motion.div style={{ opacity: heroTextOpacity }} className="absolute inset-0">
              {/* Legibility pool.

                  Sized to do one job and no more: the headline's right
                  edge runs into the shoulder of the t-shirt, which is
                  within a few percent of the ink the type is set in.
                  This lifts that overlap just enough to separate them.

                  It is deliberately small and weak — centred on the
                  headline rather than the whole corner, and out of reach
                  of the face and the torso. The CTAs are excluded on
                  purpose: one is a solid ink button with bone text, the
                  other a solid bone button, and both carry their own
                  shadow, so neither needs the ground lifted for it.

                  It fades in on the same beat as the headline it serves,
                  so the portrait rises out of the floor and unblurs at
                  full contrast first, and the lift only appears once
                  there is type over the shirt to justify it. */}
              {/* Desktop only. On a phone the scrim at the foot of the
                  section does this job across the whole width, and a
                  pool sized to a headline that is no longer here would
                  only be a bright patch on the shirt. */}
              <motion.div
                aria-hidden="true"
                initial={instant ? false : { opacity: 0 }}
                animate={{ opacity: introDone ? 1 : 0 }}
                transition={fade()}
                onUpdate={NO_WAAPI}
                className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(28%_25%_at_23%_70%,rgba(232,228,218,0.9)_0%,rgba(232,228,218,0.62)_42%,rgba(232,228,218,0.22)_72%,rgba(232,228,218,0)_100%)] lg:block"
              />

              {!compact && headlineBlock}
              {!compact && actionsBlock}
            </motion.div>
          </div>
        </div>

        {/* ── Foot scrim, small screens only ────────────────────────
            The portrait is now most of a phone screen, and the bottom
            third of it is a black t-shirt with dark ink type over it.
            The desktop answer is a small radial pool behind the
            headline, which works because the headline is the only
            thing over the shirt there. On a phone the headline, both
            CTAs and the whole baseline lockup are, so the ground is
            lifted across the full width instead.

            A later sibling than the portrait, so it paints over it;
            the flow content at `z-30` sits above this whole overlay,
            so it paints over the scrim. */}
        {/* Shorter, so it starts lower and leaves more of the portrait
            unwashed — but it still reaches solid bone at the floor,
            and has to.

            Weakening the *last* stop to 88% to keep the shirt visible
            under the signature was tried and reverted: the sweater at
            that height is close to black, not the mid grey the fade
            makes it look, so 12% of it under dark ink took the
            headline's third line, the paragraph and the signature all
            to roughly unreadable. Height is the safe axis — it moves
            where the wash begins without touching how opaque it is
            where the type actually sits. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[37%] bg-gradient-to-t from-bone via-bone/85 to-transparent lg:hidden"
        />

        {/* ── 3. SIDE NAVIGATION RAILS ──────────────────────────────
            These duplicate the header nav exactly, so they are framing,
            not navigation, and they are the first thing to go when the
            margins get tight. Side by side with the glass cards they
            need roughly `0.8 × height + 1132px` of width to clear them; below
            that the right rail printed straight through the qualities
            card. Shown only once there is genuinely room for both. */}
        <div className="pointer-events-none absolute bottom-[210px] left-6 z-30 hidden select-none md:left-12 min-[1900px]:block">
          <motion.div
            style={{ opacity: leftRailOpacity, y: leftRailY }}
            className="flex items-center gap-4 font-display text-[15px] font-bold tracking-[0.08em] text-ink"
          >
            <motion.span
              initial={instant ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: introDone ? 1 : 0, x: introDone ? 0 : -10 }}
              transition={fade()}
              onUpdate={NO_WAAPI}
              className="flex items-center gap-4"
            >
              <a href="#top" className="pointer-events-auto transition-opacity hover:opacity-60">
                HOME
              </a>
              <span className="opacity-30">|</span>
              {/* Second casualty of the deleted About section. Points at
                  Insights, which is now where the personal run of years
                  actually lives. */}
              <a href="#insights" className="pointer-events-auto transition-opacity hover:opacity-60">
                MY STORY
              </a>
            </motion.span>
          </motion.div>
        </div>

        <div className="pointer-events-none absolute bottom-[210px] right-6 z-30 hidden select-none md:right-12 min-[1900px]:block">
          <motion.div
            style={{ opacity: rightRailOpacity, y: rightRailY }}
            className="flex items-center gap-4 font-display text-[15px] font-bold tracking-[0.08em] text-ink"
          >
            <motion.span
              initial={instant ? false : { opacity: 0, x: 10 }}
              animate={{ opacity: introDone ? 1 : 0, x: introDone ? 0 : 10 }}
              transition={fade()}
              onUpdate={NO_WAAPI}
              className="flex items-center gap-4"
            >
              <a href="#work" className="pointer-events-auto transition-opacity hover:opacity-60">
                WORK
              </a>
              <span className="opacity-30">|</span>
              <a href="#experience" className="pointer-events-auto transition-opacity hover:opacity-60">
                EXPERIENCE
              </a>
              <span className="opacity-30">|</span>
              <a href="#contact" className="pointer-events-auto transition-opacity hover:opacity-60">
                CONTACT
              </a>
            </motion.span>
          </motion.div>
        </div>

        {/* ── 4. FLANKING CARDS ─────────────────────────────────────
            Same positions and drift as the original. Shown from xl up,
            where there is genuinely room beside the portrait. */}
        {/* Anchored to the portrait's own box, not to `23vw`.

            The headline sits at 12% *of the portrait box*, which scales
            with viewport height, while these sat at 23% of viewport
            *width*. The two bases cross over at laptop proportions, and
            at 1280×720 the "2+ years" card landed squarely on top of
            "Applied / Differently." Deriving both from the same box —
            the portrait is `aspect-square h-[80vh]`, so its left edge is
            `50% − 40vh` — keeps the gap constant at every size. */}
        <div className="pointer-events-none absolute bottom-[110px] right-[calc(50%_+_40vh_+_2rem)] z-30 hidden flex-col items-end gap-6 xl:flex">
          {/* Projects */}
          <motion.div style={{ x: card1X, y: card1Y, rotate: card1Rotate, opacity: card1Opacity }}>
            <motion.div
              initial={instant ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: introDone ? 1 : 0, x: introDone ? 0 : -20 }}
              transition={fade()}
              onUpdate={NO_WAAPI}
              className="flex w-[170px] items-center gap-3.5 rounded-2xl border border-black/12 bg-bone-raised/70 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-lg"
            >
              <span className="shrink-0 font-display text-3xl font-bold leading-none tracking-tighter text-ink">
                DK
              </span>
              <span className="flex flex-col text-left">
                <span className="font-display text-lg font-bold leading-none text-ink">20+</span>
                <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink/65">
                  Projects
                </span>
              </span>
            </motion.div>
          </motion.div>

          {/* Experience */}
          <motion.div style={{ x: card2X, y: card2Y, rotate: card2Rotate, opacity: card2Opacity }}>
            <motion.div
              initial={instant ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: introDone ? 1 : 0, x: introDone ? 0 : -20 }}
              transition={fade(0.08)}
              onUpdate={NO_WAAPI}
              className="flex h-[155px] w-[130px] flex-col items-center justify-center gap-2.5 rounded-2xl border border-black/12 bg-bone-raised/70 p-4 text-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-lg"
            >
              <span className="font-display text-4xl font-bold leading-none tracking-tighter text-ink">
                2+
              </span>
              <span className="font-mono text-[10px] uppercase leading-[1.3] tracking-wider text-ink/65">
                Years
                <br />
                shipping
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Qualities */}
        <div className="pointer-events-none absolute bottom-[160px] left-[calc(50%_+_40vh_+_2rem)] z-30 hidden xl:block">
          <motion.div style={{ x: card3X, y: card3Y, rotate: card3Rotate, opacity: card3Opacity }}>
            <motion.ul
              initial={instant ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: introDone ? 1 : 0, x: introDone ? 0 : 20 }}
              transition={fade()}
              onUpdate={NO_WAAPI}
              className="flex w-[190px] flex-col gap-3.5 rounded-2xl border border-black/12 bg-bone-raised/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-lg"
            >
              {QUALITIES.map((q) => (
                <li
                  key={q.label}
                  className="flex items-center gap-3.5 font-display text-[13px] font-bold tracking-wide text-ink"
                >
                  <QualityIcon q={q} />
                  {q.label}
                </li>
              ))}
            </motion.ul>
          </motion.div>
        </div>
      </motion.div>

      {/* ── 5. BASELINE LOCKUP ────────────────────────────────────
          In flow rather than fixed — it already sits at the bottom of
          a full-height section, so pinning it bought nothing and cost
          a viewport-wide click blocker. */}
      {/* The column is bottom-anchored, so every gap taken out of it
          moves its top edge *down* rather than pulling its foot up —
          which is why tightening these is the same change as giving
          the portrait more room above. */}
      <div className="relative z-30 mt-auto flex flex-col items-stretch gap-2 sm:gap-7">
        {/* On a phone the headline and the CTAs are here rather than
            pinned over the portrait, stacked in the flow above the
            lockup. Ordinary layout, so they cannot land on top of it
            the way two independently bottom-anchored blocks did. The
            scroll fade that the pinned copy inherits from its parent
            is applied here instead, so both paths leave on the same
            beat. */}
        {compact && (
          <motion.div
            style={{ opacity: heroTextOpacity }}
            className="flex flex-col items-start gap-2.5"
          >
            {headlineBlock}
            {actionsBlock}
          </motion.div>
        )}

        <motion.div
          initial={instant ? false : { opacity: 0, y: -15 }}
          animate={{ opacity: introDone ? 1 : 0, y: introDone ? 0 : -15 }}
          transition={fade()}
          onUpdate={NO_WAAPI}
          /* `gap-0` below `sm`: at this size the visible space between
             the paragraph and the signature is mostly line-box
             leading, not the flex gap, so the gap is spent first and
             the leading tightened below. */
          className="flex flex-col items-start justify-between gap-0 border-t border-black/12 pt-1.5 sm:flex-row sm:items-end sm:gap-6 sm:pt-4"
        >
          {/* Below `sm` the two swap: the paragraph takes the top slot
              and the signature drops to the bottom-right corner, set
              flush right. Ordering rather than markup order, so the
              row at `sm` and up keeps the original left/right pairing
              and the reading order stays the same for a screen reader
              at every width. */}
          <motion.p
            style={{ opacity: footerLeftOpacity, x: footerLeftX }}
            className="order-2 self-end text-right font-display text-[12px] font-bold leading-tight tracking-tight text-ink sm:order-none sm:self-auto sm:text-left sm:text-[13px] sm:leading-snug"
          >
            The Full Stack Expert.
            <br />
            That's Divyakush.
          </motion.p>

          <motion.p
            style={{ opacity: footerRightOpacity, y: footerRightY }}
            className="order-1 max-w-[22rem] text-[12px] font-medium leading-tight tracking-tight text-ink/85 sm:order-none sm:text-right sm:text-[13px] sm:leading-snug"
          >
            Working closely with your team to deliver high-performance applications that merge
            complex backend logic, machine learning, and clean interface design.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
