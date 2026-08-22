import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { SectionHeader } from './primitives';
import { riseIn, viewportOnce } from '../lib/motion';
import { EDUCATION } from '../lib/certifications';

/* ─────────────────────────────────────────────────────────────────
   Education.

   Split out of the old three-card "Credentials" grid, which mixed a
   degree, a second degree and a Microsoft certificate into one row — three
   different kinds of claim sharing one card template, so none of them
   read as what it was. Education is a chronology, so it is drawn as
   one: a single spine, four stops, newest first.

   The spine fills as the section scrolls. That is scroll-*position*
   driven rather than an autoplaying animation, so it stays honest for
   reduced-motion users — but they get it filled outright instead of
   tracking the wheel, since a line that moves under scroll is still
   motion to someone who asked for none.

   Rail geometry: the node is 14px, centred on a 1px line at x=7px, and
   every row is padded 40px to clear it. Those three numbers are the
   only ones that have to agree, which is why they are not spread
   across four grid-column definitions like the first attempt.
   ───────────────────────────────────────────────────────────────── */

const RAIL_LEFT = 'left-[7px]';

export function EducationTimeline() {
  const listRef = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ['start 78%', 'end 62%'],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      id="education"
      className="relative z-10 bg-bone py-22 text-ink on-light sm:py-30"
      style={{ scrollMarginTop: 'var(--nav-h)' }}
    >
      <div className="mx-auto w-full max-w-shell px-gutter">
        <SectionHeader
          kicker="Education"
          tone="light"
          title={<>Where the fundamentals came from.</>}
          aside={
            <>
              Two degrees running in parallel — a computer engineering core at VIT, and an
              artificial intelligence major at IIT Ropar taken alongside it.
            </>
          }
        />

        <div className="relative">
          {/* The rail. Track and fill are separate elements so the fill
              can scale without the track scaling with it. */}
          <div
            aria-hidden="true"
            className={`absolute ${RAIL_LEFT} top-3 bottom-3 w-px bg-black/12`}
          >
            <motion.div
              className="h-full w-full origin-top bg-ink"
              style={{ scaleY: reduced ? 1 : scaleY }}
            />
          </div>

          <motion.ol
            ref={listRef}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
            className="flex flex-col"
          >
            {EDUCATION.map((item) => (
              <motion.li
                key={item.id}
                variants={riseIn}
                className="group relative pb-12 pl-10 last:pb-0 sm:pb-14"
              >
                {/* Node. Filled for anything still in progress, hollow
                    for anything finished — the same convention the
                    experience section uses for a current role. */}
                <span
                  aria-hidden="true"
                  className={`absolute ${RAIL_LEFT} top-[0.4rem] grid h-3.5 w-3.5 -translate-x-1/2 place-items-center rounded-full border-2 border-ink bg-bone transition-colors duration-300 group-hover:bg-ink`}
                >
                  {item.current && (
                    <span className="h-1.5 w-1.5 rounded-full bg-ink transition-colors duration-300 group-hover:bg-bone" />
                  )}
                </span>

                <div className="border-b border-black/8 pb-10 group-last:border-0 group-last:pb-0 sm:pb-12">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-12">
                    {/* Left: the institution and what was read there. */}
                    <div className="max-w-2xl">
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-meta-sm uppercase text-ink/55">
                        <span>{item.period}</span>
                        <span aria-hidden="true" className="h-px w-4 bg-black/20" />
                        <span>{item.place}</span>
                        {item.current && (
                          <span className="rounded-full border border-black/15 px-2 py-0.5 text-ink/70">
                            In progress
                          </span>
                        )}
                      </p>

                      <h3 className="mt-4 font-display text-display-sm font-bold leading-tight text-ink">
                        {item.institution}
                      </h3>
                      <p className="mt-2 text-lede font-medium text-ink/75">
                        {item.qualification}
                      </p>
                      <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink/60">
                        {item.note}
                      </p>
                    </div>

                    {/* Right: the one number a reviewer scans for. Always
                        printed with the scale it was awarded on — "8.17"
                        alone reads as a fail on a 4-point scale. */}
                    <div className="shrink-0 border-l-2 border-black/12 pl-5 transition-colors duration-300 group-hover:border-ink sm:min-w-[8.5rem] sm:pl-6">
                      <p className="font-mono text-meta-sm uppercase text-ink/55">
                        {item.metricLabel}
                      </p>
                      <p className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="font-display text-display-sm font-bold leading-none text-ink">
                          {item.metric}
                        </span>
                        {item.metricScale && (
                          <span className="font-mono text-sm text-ink/50">{item.metricScale}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  );
}
