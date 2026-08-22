import { useEffect, useState } from 'react';

/**
 * Subscribes to a CSS media query.
 *
 * For deciding whether to *render* something, not how to style it —
 * styling belongs in a Tailwind breakpoint, which costs nothing. This
 * is for the cases where an element should not exist at all on a
 * narrow screen, because mounting it costs real work: a blurred layer,
 * a masked copy, anything the compositor has to keep a texture for.
 *
 * Resolved synchronously in the initialiser rather than in the effect.
 * That is load-bearing: several callers switch layout on the result,
 * and a hook that reported `false` until after the first paint would
 * render the wide branch for a frame on every phone — a visible flash
 * and a layout shift on exactly the devices this is used to protect.
 *
 * The `typeof window` guard is what makes it safe to render on a
 * server, where the first paint resolves to `false` and the effect
 * corrects it on the client. Keep the guard: it is the one line that
 * has to survive the move to a framework that renders ahead of time.
 *
 * This replaced four identical copies of itself, one each in
 * HeroSection, SelectedWorks, ExperienceRoles and ProjectPage.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);

    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [query]);

  return matches;
}
