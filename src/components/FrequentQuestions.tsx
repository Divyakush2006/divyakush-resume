import React from 'react';
import { motion } from 'motion/react';
import { SectionHeader } from './primitives';
import { riseIn, viewportOnce } from '../lib/motion';
import { FAQ } from '../lib/faq';

/* ─────────────────────────────────────────────────────────────────
   The questions, on the page.

   ── Why this section exists at all ────────────────────────────────
   `src/lib/seo.ts` publishes these eight questions as FAQPage
   structured data. That markup is only legitimate while the same text
   is on the page for a person to read — Google's policy treats marked-up
   text a visitor cannot reach as hidden content, and that is one of the
   violations enforced by hand rather than by silently dropping the
   block.

   So this is not a section that was wanted and then marked up. It is
   the half of the FAQ a human reads, and it ships in the same change as
   the half a crawler reads, from the same array in `src/lib/faq.ts`.
   Neither half can be edited without the other.

   ── <details>, not a JavaScript accordion ─────────────────────────
   Three reasons, in order of how much they matter here:

     1. The answers are in the DOM whether or not the summary is open,
        whether or not the bundle has run, and whether or not the reader
        is a browser. Half the audience for this section — Bingbot, the
        LinkedIn unfurler, GPTBot, ClaudeBot, PerplexityBot, all of them
        welcomed by name in `public/robots.txt` — never executes
        JavaScript. A state-driven accordion would render eight
        questions and no answers to every one of them, which is the
        exact failure this section exists to avoid.

     2. Collapsed content in a `<details>` is explicitly allowed by
        Google's own FAQ guidance. Content hidden behind a script that
        never runs for the crawler is not.

     3. It is keyboard-operable, screen-reader-announced and
        find-in-page-able for free, correctly, in every browser. A
        hand-rolled accordion gets there on a good day with four ARIA
        attributes and a `aria-expanded` that somebody has to remember
        to update.

   The marker is drawn rather than defaulted — `list-none` plus the
   Webkit pseudo-element, because Safari ignores the former on its own —
   so the disclosure triangle does not appear next to a serif heading in
   a layout that has no other browser chrome in it.

   ── Placement ─────────────────────────────────────────────────────
   Last before the contact takeover. By that point the page has made
   every claim these answers summarise, so the section reads as a
   recapitulation for somebody who skimmed rather than as an
   introduction to a page they have not read yet — and the reader who
   arrived from a search for the name, which is the reader this section
   is for, has the answer to "is this the right person" without scrolling
   back up.
   ───────────────────────────────────────────────────────────────── */

export function FrequentQuestions() {
  return (
    <section
      id="questions"
      className="relative z-10 bg-bone py-22 text-ink on-light sm:py-30"
      style={{ scrollMarginTop: 'var(--nav-h)' }}
    >
      <div className="mx-auto w-full max-w-shell px-gutter">
        <SectionHeader
          kicker="Questions"
          tone="light"
          title={<>The short answers.</>}
          aside={
            <>
              Everything below is stated somewhere further up this page with the evidence attached.
              This is the same record, answered directly.
            </>
          }
        />

        <motion.dl
          variants={riseIn}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          /* Left-aligned with the section header rather than centred in
             the shell. Centring it set the questions in from the left
             edge that "The short answers." starts at, and two different
             left margins in one section reads as a mistake rather than
             as a choice. */
          className="max-w-3xl border-t border-black/12"
        >
          {FAQ.map((entry) => (
            /* Namespaced, and the prefix is not cosmetic. Three of the
               eight ids in `faq.ts` — education, experience, contact —
               are the ids of sections that already exist on this page,
               so rendering them bare put four documents into the export
               with duplicate ids. `npm run audit` caught it; a reader
               would have caught it by clicking a footer link to
               #contact and landing on a collapsed question. */
            <details key={entry.id} id={`faq-${entry.id}`} className="group border-b border-black/12">
              <summary
                className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden"
              >
                {/* <dt> inside <summary> keeps the definition-list
                    semantics the section is built on while letting the
                    whole row be the disclosure control. */}
                <dt className="font-display text-lede font-semibold text-balance">
                  {entry.question}
                </dt>

                {/* Rotates to an ×. Decorative, so it is hidden from
                    assistive tech — <details> already announces its own
                    expanded state, and a second announcement is noise. */}
                {/* text-meta-sm is 10px — the site's smallest token, and
                    correct for a nav label but not for the only affordance
                    telling a reader this row opens. At that size it read as
                    a speck of dust in the right margin. */}
                <span
                  aria-hidden="true"
                  /* font-normal, not font-light: 300 is not one of the
                     weights the site loads, so `font-light` asked the
                     browser to synthesise one — a fake weight, and a
                     reason to fetch a face nothing else on the site
                     uses. At this size the difference is invisible. */
                  className="shrink-0 select-none text-xl font-normal leading-none text-ink/35 transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>

              <dd className="pb-7 pr-10">
                {entry.answer.map((paragraph, i) => (
                  <p key={i} className="mt-0 text-sm leading-relaxed text-ink/70 [&+&]:mt-4">
                    {paragraph}
                  </p>
                ))}
              </dd>
            </details>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}

export default FrequentQuestions;
