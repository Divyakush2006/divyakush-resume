import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useMotionValueEvent,
} from 'motion/react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { NAV_ITEMS, PROFILE } from '../lib/content';
import { lockScroll } from '../lib/scroll-lock';
import { DUR, EASE_OUT } from '../lib/motion';
import { SectionLink } from './primitives';

/* ─────────────────────────────────────────────────────────────────
   Primary navigation.

   Replaces a navbar that had four disqualifying problems:
     · It stayed mounted at opacity 0 with pointer events enabled,
       putting an invisible 68px click-blocker across the viewport.
     · Every link pointed at an id that did not exist (#services,
       #clients, #faq), so all five were dead.
     · It was `hidden md:flex` with no mobile alternative — phones got
       no navigation whatsoever.
     · Its reveal was pinned to a fixed 180px of scroll, a number with
       no relationship to anything on the page.

   ── The bar has a beginning and an end ─────────────────────────
   By request, it does not exist over the hero or the statement that
   follows it. It mounts when the selected-work section reaches the top
   of the screen — the "Things I built that people use." frame — and
   unmounts again on the way back up. It also unmounts at the other
   end, once the footer takes the screen.

   Two things follow from that, both handled rather than assumed:

     · Unmounted, not faded. Opacity 0 was exactly the old defect —
       an invisible bar that still swallowed clicks and still took Tab
       focus. There is no element to hit or to focus here.
     · Through the opening the only routes onward are the hero's two
       CTAs (and the side rails, which need ≥1900px). The skip link
       therefore stays outside this component and is always present,
       so a keyboard user is never stranded at the top.

   The threshold is that section's own top edge, measured — not a
   pixel count. Everything above it is `100svh`, and `svh` is not
   `innerHeight` on a mobile browser with a collapsing toolbar, so any
   constant written here would be wrong on exactly the devices where
   it matters most.
   ───────────────────────────────────────────────────────────────── */

/** The section the bar rides in on. */
const REVEAL_AT = 'work';

/* ── And the one it leaves on ─────────────────────────────────────
   The footer is the outro, and the bar is not part of it: once you are
   reading the close, navigation is the footer's own index, not a strip
   pinned over it.

   "At the outro" is the footer covering the lower half of the screen,
   not the footer being visible at all. The contact form sits directly
   above it, so on a tall display the footer's first pixels appear while
   you are still filling that in — and taking the bar away mid-form,
   because something below had begun to peek, would be a change you did
   not ask for and could not undo without scrolling back up. */
const OUTRO_AT = 0.5;

export function Nav() {
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>('');
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion() ?? false;

  const pathname = usePathname() ?? '/';
  const onHome = pathname === '/';

  /* ── Reveal ───────────────────────────────────────────────────
     Only the home page has an opening to clear; a detail page starts
     at its own header, so the bar is there from the first pixel.

     The line the section has to cross is not the viewport's top edge
     but `html { scroll-padding-top }` — which is to say, exactly where
     an in-page link to this section lands.

     That definition is the whole point. The obvious version put the
     line at y=0, and it broke the nav's own links: clicking "Work"
     scrolls the section to 88px so it clears the fixed bar, which left
     it one nav-height short of the line, so the bar you had just
     clicked unmounted underneath you. Anchoring the line to the same
     value the browser scrolls to means a link to this section can
     never land on the hidden side of it. Measured from the stylesheet
     rather than repeated here, so the two cannot drift.

     Driven off motion's scroll value rather than a raw listener: it is
     already running for the page, and it batches into one rAF, so this
     is a single rect read per frame at worst. `setRevealed` with an
     unchanged boolean is a React bail-out, not a render. */
  const { scrollY } = useScroll();
  const anchorRef = useRef<HTMLElement | null>(null);
  const outroRef = useRef<HTMLElement | null>(null);
  const lineRef = useRef(0);

  const readReveal = React.useCallback(() => {
    const outro = outroRef.current;
    const atOutro =
      !!outro && outro.getBoundingClientRect().top <= window.innerHeight * OUTRO_AT;

    /* No anchor means no opening to clear — a detail page is navigable
       from its first pixel. The outro still applies there: it is the
       same footer on every route. */
    const anchor = anchorRef.current;
    const arrived = anchor ? anchor.getBoundingClientRect().top <= lineRef.current + 1 : true;

    setRevealed(arrived && !atOutro);
  }, []);

  useEffect(() => {
    anchorRef.current = onHome ? document.getElementById(REVEAL_AT) : null;
    /* By id, not by tag. `querySelector('footer')` returns the *first*
       `<footer>` in the document, and a `<footer>` inside an `<article>`
       is perfectly valid HTML — so the day one appeared in a card
       partway down the page, the bar started treating that card's
       colophon as the outro. Since `top` only ever decreases once an
       element has been passed, the bar then stayed hidden for the whole
       rest of the page. */
    outroRef.current = document.getElementById('site-footer');

    const measure = () => {
      lineRef.current =
        parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      readReveal();
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [onHome, readReveal]);

  useMotionValueEvent(scrollY, 'change', readReveal);

  /* The panel lives outside the header and would otherwise survive it,
     leaving a full-screen menu — and a locked scroll — with nothing to
     close it. */
  useEffect(() => {
    if (!revealed) setOpen(false);
  }, [revealed]);

  /* ── Scroll spy ───────────────────────────────────────────────
     Highlights the section currently occupying the middle band of the
     viewport, so the nav always reflects where the reader actually is. */
  useEffect(() => {
    /* The sections it watches only exist on the home page. */
    if (!onHome) {
      setActive('');
      return;
    }

    const ids = NAV_ITEMS.map((i) => i.href.slice(1));
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [onHome]);

  /* ── Mobile panel: lock scroll, close on Escape, restore focus ── */
  useEffect(() => {
    if (!open) return;

    /* The same lock the dialogs use, and for the same reasons. This
       used to be `body { overflow: hidden }`, which clamps the document
       scroll to zero: opening the menu halfway down the page and
       closing it again put you back at the top, and while it was open
       every scroll-linked layer on the page believed it was at the top
       too — which is how the hero's portrait came to be painted over
       whatever section the menu had been opened from. */
    const release = lockScroll();

    /* The panel locks scroll and traps Tab, so it behaves as a modal —
       which means focus has to move into it, not sit on the toggle. */
    const firstLink = panelRef.current?.querySelector<HTMLElement>('a[href]');
    firstLink?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      // Trap Tab inside the open panel.
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      release();
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Close the panel if the viewport grows past the mobile breakpoint
  // while it is open, otherwise scroll stays locked on a hidden panel.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => e.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /* It arrives by sliding out from under the top edge — the hero has
     just gone up and the bar comes in behind it, so the direction of
     travel matches what the reader is already doing. Under reduced
     motion the same beat is carried by a fade.

     Off the home page there is nothing to reveal it *from*: the bar is
     simply part of the page, so it renders in place rather than sliding
     in on every project-page load. */
  const REVEAL = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { y: '-100%' }, animate: { y: '0%' }, exit: { y: '-100%' } };

  return (
    <>
      <AnimatePresence>
        {revealed && (
          <motion.header
            key="primary-nav"
            {...REVEAL}
            initial={onHome ? REVEAL.initial : false}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
            /* One treatment now, not two. The transparent-over-bone
               variant existed solely for the stretch of scroll where
               the bar sat on the hero — a stretch that no longer
               exists. The ground is written as an arbitrary value
               rather than `bg-ink/86`: 86 is not on the theme's
               opacity scale, and Tailwind emits no rule at all for a
               modifier it cannot resolve, which would have left the
               bar fully transparent over a blur. */
            className="fixed inset-x-0 top-0 z-50 h-[var(--nav-h)] border-b border-white/10 bg-[rgba(11,11,12,0.86)] backdrop-blur-xl"
          >
            <nav
              aria-label="Primary"
              className="mx-auto flex h-full max-w-shell items-center justify-between px-gutter"
            >
              {/* Wordmark. Two words, so it is set as two words — the
                  tracking that makes the lockup read at 15px was also
                  what made the run-together version look intentional
                  rather than like a missing space. */}
              <SectionLink
                href="#top"
                /* Same hit-area trick as the footer index: the lockup's
                   line box is 23px, a pixel under the 24px minimum, and
                   the padding plus matching negative margin buys the
                   target height without moving the wordmark. */
                className="-my-1 inline-block py-1 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-bone-raised transition-colors duration-200"
              >
                Divyakush <span className="text-bone-raised/45">Punjabi</span>
              </SectionLink>

              {/* Desktop links */}
              <ul className="hidden items-center gap-9 md:flex">
                {NAV_ITEMS.map((item) => {
                  const isActive = active === item.href;
                  return (
                    <li key={item.href}>
                      <SectionLink
                        href={item.href}
                        aria-current={isActive ? 'location' : undefined}
                        className={`group relative block py-2 font-mono text-meta-sm font-bold uppercase transition-colors duration-200 ${
                          isActive
                            ? 'text-bone-raised'
                            : 'text-bone-raised/55 hover:text-bone-raised'
                        }`}
                      >
                        {item.label}
                        <span
                          aria-hidden="true"
                          className={`absolute bottom-0 left-0 h-px w-full origin-left bg-accent transition-transform duration-300 ease-out ${
                            isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                          }`}
                        />
                      </SectionLink>
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center gap-3">
                <SectionLink
                  href="#contact"
                  className="hidden rounded-full bg-accent px-5 py-2.5 font-mono text-meta-sm font-bold uppercase text-ink transition-colors duration-200 hover:bg-white sm:inline-flex"
                >
                  Get in touch
                </SectionLink>

                {/* Mobile toggle */}
                <button
                  ref={toggleRef}
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                  aria-controls="mobile-nav"
                  aria-label={open ? 'Close menu' : 'Open menu'}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-bone-raised transition-colors duration-200 hover:bg-white/10 md:hidden"
                >
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </nav>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ── Mobile panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            ref={panelRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.fast, ease: EASE_OUT }}
            className="fixed inset-0 z-40 flex flex-col bg-ink pt-[var(--nav-h)] md:hidden"
          >
            <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center px-gutter">
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: DUR.base, delay: 0.04 + i * 0.045, ease: EASE_OUT }}
                  >
                    <SectionLink
                      href={item.href}
                                            onClick={() => setOpen(false)}
                      className="flex items-baseline justify-between border-b border-white/8 py-5 font-display text-display-sm font-bold text-bone-raised"
                    >
                      {item.label}
                      <span className="font-mono text-meta-sm text-bone-raised/35">
                        0{i + 1}
                      </span>
                    </SectionLink>
                  </motion.li>
                ))}
              </ul>

              {/* One route in. The résumé download that sat here is
                  gone along with the address — the contact form is the
                  only channel now, so the menu offers only that. */}
              <div className="mt-10 flex flex-col gap-3">
                <SectionLink
                  href="#contact"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 font-mono text-meta-sm font-bold uppercase text-ink"
                >
                  Get in touch <ArrowUpRight className="h-4 w-4" />
                </SectionLink>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
