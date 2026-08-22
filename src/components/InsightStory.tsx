import { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Github, Linkedin, MapPin, X } from 'lucide-react';
import { useScrollLock } from '../lib/scroll-lock';
import { EASE_OUT } from '../lib/motion';
import type { Insight } from '../lib/insights';
import { Picture } from './Picture';

/* ─────────────────────────────────────────────────────────────────
   Story overlay — the long version of one moment.

   The card in the carousel carries a title and two lines over the
   photograph. That is the right amount of copy to lay over a picture
   and the wrong amount to explain what actually happened, which for
   most of these runs to several paragraphs and has sources worth
   linking. So the card opens.

   The photograph does not fly in from the card. It did once — a
   `layoutId` shared with the deck — and that is a fine effect
   everywhere except across a scroll lock, which is exactly where it
   was. Pinning the body zeroes the document scroll; motion measures in
   document coordinates; so on close it animated the picture back
   across the page's entire scroll offset, and a full-size photograph
   slid down the page for a second after the overlay had gone. The
   whole of it is written up in src/lib/scroll-lock.ts.

   So the frame below animates itself — opacity and a little scale,
   values known in advance — and measures nothing. It reads as the
   picture settling into the reading position, and it cannot be wrong
   about where anything is, because it never asks.

   Same contract as the certifications lightbox, deliberately — Escape
   closes, arrows step, Tab is trapped inside, focus lands on Close and
   is returned to the card that opened it, and the body is scroll-
   locked while it is up. Two dialogs on one site that behave
   differently is a worse outcome than either behaviour.
   ───────────────────────────────────────────────────────────────── */

const LINK_ICON = {
  linkedin: Linkedin,
  source: Github,
  live: ArrowUpRight,
} as const;

interface StoryProps {
  list: Insight[];
  index: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}

export function InsightStory({ list, index, onClose, onStep }: StoryProps) {
  const item = list[index];
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const reduced = useReducedMotion() ?? false;

  /* Focus lands on Close, so Escape is not the only way out for
     somebody who arrived here by keyboard. */
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

      /* Trap. Without it Tab walks out of the dialog and onto the deck
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
            {item.date}
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
        <div className="mx-auto grid w-full max-w-shell flex-1 grid-cols-1 items-start gap-10 px-gutter py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14 lg:py-12">
          {/* The photograph, whole and sharp. No mirrored fill here:
              the deck needed one because a card is a fixed box, but
              this is a reading surface and a defocused copy of the
              picture behind body copy is noise. It sticks on a desktop
              so the picture stays with the paragraphs about it. */}
          <motion.figure
            initial={reduced ? false : { opacity: 0, scale: 0.965, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.4, ease: EASE_OUT }}
            className="overflow-hidden rounded-panel border border-white/15 bg-ink-raised shadow-2xl lg:sticky lg:top-28"
          >
            <Picture
              sizes="(min-width: 1024px) 48vw, 92vw"
              src={item.image}
              alt={`${item.title}${item.location ? `, ${item.location}` : ''}`}
              decoding="async"
              className="block max-h-[62svh] w-full object-contain"
            />
          </motion.figure>

          {/* Keyed on the slug so the copy cross-fades as you step
              between moments while the frame stays put. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={item.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
            >
              {item.location && (
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/40 px-3 py-1.5 font-mono text-meta-sm uppercase text-accent">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.location}
                </p>
              )}

              <h2
                id={titleId}
                className="text-balance font-display text-display-sm font-bold text-bone-raised"
              >
                {item.title}
              </h2>

              <div className="mt-6 space-y-5">
                {item.story.map((para, i) => (
                  <p
                    key={i}
                    className="max-w-prose text-sm leading-relaxed text-bone-raised/70 sm:text-base"
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* Sources. Several of these moments are on record in a
                  post written at the time, and a couple ship as
                  repositories — a reader who wants to check rather
                  than take it on trust should not have to search. */}
              {item.links && item.links.length > 0 && (
                <ul className="mt-9 flex flex-wrap gap-3 border-t border-white/12 pt-7">
                  {item.links.map((link) => {
                    const Icon = LINK_ICON[link.kind];
                    return (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2.5 rounded-full border border-white/15 px-4 py-2.5 font-mono text-meta-sm uppercase text-bone-raised/75 transition-colors duration-200 hover:border-accent hover:text-accent"
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          {link.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer navigation.

            Both buttons carry `py-1.5 -my-1.5`. The label is a 16px
            line box next to a 16px icon, which is well under the 24px
            WCAG 2.2 minimum for a touch target — and this is the one
            control on the site that a reader uses repeatedly, on a
            phone, with a thumb. The padding buys 28px of tappable
            height and the negative margin hands it back to the layout,
            so the bar keeps its height. */}
        <div className="sticky bottom-0 flex shrink-0 items-center justify-between gap-4 border-t border-white/12 bg-ink/80 px-gutter py-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => onStep(-1)}
            className="-my-1.5 flex items-center gap-2.5 py-1.5 font-mono text-meta-sm uppercase text-bone-raised/75 transition-colors duration-200 hover:text-accent"
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
            className="-my-1.5 flex items-center gap-2.5 py-1.5 font-mono text-meta-sm uppercase text-bone-raised/75 transition-colors duration-200 hover:text-accent"
          >
            Next
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
