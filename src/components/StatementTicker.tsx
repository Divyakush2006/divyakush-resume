import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate, type MotionValue } from 'motion/react';
import { METRICS } from '../lib/content';

/* ─────────────────────────────────────────────────────────────────
   Scroll-paced manifesto.

   Composition:
     · The sentence is the entire section. The numbered eyebrow and the
       Scroll / Building-since progress rail are both gone — they were
       chrome bracketing a single line of copy, and with them removed
       the statement stands on its own, which is the whole point of it.
     · Centred display lockup rather than a left-ragged paragraph — the
       arrangement a company statement page uses.
     · The dot field is gone. It was a texture competing with the one
       thing this section exists to show, and at 44px spacing it read
       as screen noise in screenshots rather than as atmosphere.
     · Type is a size up (display-xl) with a measure held in `ch`, so
       the sentence breaks into three or four balanced lines at every
       width instead of one long rag.

   The reveal still runs word by word off scroll position, but each
   word now resolves from soft to sharp rather than only fading, and
   the whole sentence is guaranteed to finish before the section
   unpins — see REVEAL_END.
   ───────────────────────────────────────────────────────────────── */

/* Word reveal window, as a fraction of the section's pinned scroll.
   Ending at 0.82 leaves the last stretch of the pin for the finished
   sentence to simply be read. */
const REVEAL_START = 0.05;
const REVEAL_END = 0.82;
/* How much of the window one word occupies. Larger overlaps the words
   into a wave; smaller makes them tick over one at a time. */
const WORD_SPAN = 0.13;

interface WordProps {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  accent: boolean;
}

/* useTransform cannot run inside .map(), so each word owns a component. */
function Word({ word, index, total, progress, accent }: WordProps) {
  const band = REVEAL_END - REVEAL_START - WORD_SPAN;
  const start = REVEAL_START + (index / Math.max(total - 1, 1)) * band;
  const end = start + WORD_SPAN;

  const opacity = useTransform(progress, [start, end], [0.12, 1], { clamp: true });
  const y = useTransform(progress, [start, end], ['0.3em', '0em'], { clamp: true });
  const blurPx = useTransform(progress, [start, end], [7, 0], { clamp: true });
  const filter = useMotionTemplate`blur(${blurPx}px)`;

  return (
    <motion.span
      style={{ opacity, y, filter }}
      className={`inline-block will-change-[opacity,transform,filter] ${
        accent ? 'text-accent' : 'text-bone-raised'
      }`}
    >
      {word}
    </motion.span>
  );
}

export function StatementTicker() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const statement = `${METRICS.yearsShipping} years turning backend complexity into products that ship.`;
  const words = statement.split(' ');
  const accentWords = new Set(['products', 'ship.']);

  return (
    <div ref={ref} className="relative z-10 h-[170vh] bg-ink">
      <div className="sticky top-0 flex h-[100svh] w-full flex-col items-center justify-center overflow-hidden">
        {/* Framing rails — the only decoration this section gets. */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-gutter hidden w-px bg-white/8 lg:block"
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-gutter hidden w-px bg-white/8 lg:block"
        />

        <div className="mx-auto w-full max-w-shell px-gutter text-center">
          {/* `max-w-[17ch]` keeps the sentence to three or four lines at
              every width — the balance point for a centred lockup. */}
          <h2 className="mx-auto max-w-[17ch] text-balance font-display text-display-xl font-bold">
            {/* Announced as one sentence; the animated words are decorative. */}
            <span className="sr-only">{statement}</span>
            <span
              aria-hidden="true"
              className="flex flex-wrap justify-center gap-x-[0.26em] gap-y-[0.06em]"
            >
              {words.map((word, i) => (
                <Word
                  key={i}
                  word={word}
                  index={i}
                  total={words.length}
                  progress={scrollYProgress}
                  accent={accentWords.has(word.toLowerCase())}
                />
              ))}
            </span>
          </h2>
        </div>
      </div>
    </div>
  );
}
