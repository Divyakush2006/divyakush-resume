import { useEffect, useState } from 'react';

export type IntroPhase = 'letters' | 'reveal' | 'done';

/* ── Intro timing ─────────────────────────────────────────────────
   The two numbers that stage the whole sequence:

     T_REVEAL  letters have landed; the name lifts, the portrait rises
               out of the floor and starts unblurring
     T_DONE    everything settled; floating UI fades in, page usable

   These are the original 1800 / 3600. They had been compressed to
   750 / 1500, which broke the choreography rather than tightening it:
   the letters ride an overdamped spring (stiffness 58, damping 15)
   with a 45ms stagger, so the last one does not settle until ~1.6s.
   Firing T_REVEAL at 750ms lifted the wordmark and raised the portrait
   while the letters were still sliding in, and T_DONE at 1500ms then
   dropped the cards, rails and buttons on top of that — three beats
   playing at once instead of one after another.

   If this ever needs shortening, the letter spring has to be made to
   settle faster first; T_REVEAL cannot lead it. */
const T_REVEAL = 1800;
const T_DONE = 3600;

/**
 * Drives the hero's staged intro.
 *
 * The intro plays on every load, by design — it is the first thing the
 * site says, and a reader who refreshes should see it again. It was
 * previously gated behind a `dk:intro-played` sessionStorage flag, which
 * meant it ran once per tab and never again, so in practice most visits
 * (and every refresh while working on it) skipped it entirely.
 *
 * Two guards remain, and both matter:
 *  · It never blocks the page. Any scroll, click, keypress or touch
 *    snaps straight to the finished state.
 *  · prefers-reduced-motion starts at 'done', so reduced-motion users
 *    never see a frame of the animated state.
 *
 * Returns the current phase plus `instant`, which tells the hero to
 * render final values outright rather than transition to them.
 */
export function useIntroSequence(): { phase: IntroPhase; instant: boolean } {
  // Resolve the "should we animate at all" question before first paint so
  // reduced-motion users never see a frame of the animated state.
  const [instant] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [phase, setPhase] = useState<IntroPhase>(() => (instant ? 'done' : 'letters'));

  useEffect(() => {
    if (instant) return;

    const timers = [
      window.setTimeout(() => setPhase('reveal'), T_REVEAL),
      window.setTimeout(() => setPhase('done'), T_DONE),
    ];

    const finish = () => {
      timers.forEach(clearTimeout);
      setPhase('done');
    };

    // Any intent to interact ends the intro immediately.
    const opts = { passive: true, once: true } as const;
    window.addEventListener('wheel', finish, opts);
    window.addEventListener('touchstart', finish, opts);
    window.addEventListener('pointerdown', finish, opts);
    window.addEventListener('keydown', finish, { once: true });
    window.addEventListener('scroll', finish, opts);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('wheel', finish);
      window.removeEventListener('touchstart', finish);
      window.removeEventListener('pointerdown', finish);
      window.removeEventListener('keydown', finish);
      window.removeEventListener('scroll', finish);
    };
  }, [instant]);

  return { phase, instant };
}
