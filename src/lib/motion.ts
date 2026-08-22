import type { Transition, Variants } from 'motion/react';

/* ─────────────────────────────────────────────────────────────────
   Motion tokens.

   Every section previously hand-rolled its own duration, delay and
   easing, so nothing felt like it belonged to the same site. These
   are the only timings the site is allowed to use.
   ───────────────────────────────────────────────────────────────── */

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const DUR = {
  fast: 0.28,
  base: 0.5,
  slow: 0.75,
} as const;

export const spring: Transition = {
  type: 'spring',
  stiffness: 240,
  damping: 26,
  mass: 0.7,
};

/** Standard "rise into view" used by every section block. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.slow, ease: EASE_OUT },
  },
};

/**
 * Shared viewport config. `once: true` so sections never re-animate on
 * scroll-up (the old build re-triggered and felt twitchy), and a small
 * negative margin so the reveal fires slightly before the block lands.
 */
export const viewportOnce = { once: true, margin: '-12% 0px -12% 0px' } as const;
