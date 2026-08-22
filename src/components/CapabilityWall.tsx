import React from 'react';
import { SectionHeader } from './primitives';

/* ─────────────────────────────────────────────────────────────────
   Capabilities.

   Every technology set at display size on two rows travelling against
   each other, held at the edge of legibility until the pointer picks
   one out. Matched off the old portfolio, measured rather than eyed:
   Inter 900 / 60px / -3px tracking / uppercase / 20% alpha.

   ── Only the word under the pointer ───────────────────────────────
   The highlight is plain CSS `hover:` on the word itself — no state,
   no group, no React re-render on pointer move. That is the whole
   reason it can only ever light one element: there is no shared value
   for a second word to match against.

   ── Accessibility ─────────────────────────────────────────────────
   The wall is 20% type with no action behind it, so it is marked
   decorative and the same 38 technologies are carried in a visually
   hidden list, grouped by capability. Spans rather than buttons:
   nothing here is activatable, and a button that does nothing is a
   trap for anyone tabbing through.

   ── Motion ────────────────────────────────────────────────────────
   Rows drift behind `motion-safe:` and pause under the pointer. Under
   `prefers-reduced-motion` they do not move at all, which would
   otherwise strand two thirds of each row off-screen with no way to
   reach it — so in that case the row becomes scrollable instead.
   ───────────────────────────────────────────────────────────────── */

interface Capability {
  id: number;
  title: string;
  blurb: string;
  skills: string[];
}

const CAPABILITIES: Capability[] = [
  {
    id: 1,
    title: 'Full Stack Engineering',
    blurb: 'Typed end to end, from schema to interface.',
    skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'FastAPI', 'Django', 'REST', 'Webhooks'],
  },
  {
    id: 2,
    title: 'AI & Machine Learning',
    blurb: 'Retrieval and recommendation systems in production.',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'LangChain', 'RAG', 'SASRec', 'ChromaDB'],
  },
  {
    id: 3,
    title: 'Data & Infrastructure',
    blurb: 'Multi-tenant persistence, queues, and delivery.',
    skills: ['PostgreSQL', 'MongoDB', 'Redis', 'Celery', 'Docker', 'CI/CD', 'MQTT'],
  },
  {
    id: 4,
    title: 'Interface & Product Design',
    blurb: 'Accessible component systems, not just screens.',
    skills: ['Figma', 'Radix UI', 'shadcn/ui', 'WCAG 2.2', 'Design systems', 'User research'],
  },
  {
    id: 5,
    title: 'Performance & SEO',
    blurb: 'Measured wins — 40% TTI reduction at VUBS.',
    skills: ['Vite', 'Vercel', 'Core Web Vitals', 'Technical SEO', 'Asset pipelines'],
  },
  {
    id: 6,
    title: 'Embedded & Edge AI',
    blurb: 'Vision models running off the microcontroller.',
    skills: ['YOLOv8', 'ESP32-CAM', 'Sensor fusion', 'MQTT broker', 'Verilog'],
  },
];

/* Round-robin, so neither row is one capability's worth of tools. */
const ROW_COUNT = 2;
const ROWS: string[][] = Array.from({ length: ROW_COUNT }, () => []);
CAPABILITIES.flatMap((cap) => cap.skills).forEach((name, i) => ROWS[i % ROW_COUNT].push(name));

/* One named animation per row, carrying both speed and direction.
   They cannot be composed out of `animate-marquee` plus an
   `[animation-duration:…]` / `[animation-direction:…]` utility: the
   `animate-*` class sets the `animation` shorthand, which resets both
   of those regardless of what else is applied. See the keyframes note
   in tailwind.config.js. */
const ROW_ANIMATION = ['motion-safe:animate-wall-a', 'motion-safe:animate-wall-b'];

/* Read off the old portfolio's own wall. `-0.05em` is its -3px
   expressed proportionally, so the tracking holds as the clamp steps
   the size down on narrow screens. */
const WALL_TYPE =
  'font-wall text-[clamp(2.25rem,5vw,3.75rem)] font-black uppercase leading-none tracking-[-0.05em]';

function Row({ names, animation }: { names: string[]; animation: string }) {
  return (
    /* `wall-row` / `wall-track` are hooks for the pause rule at the
       foot of index.css, which needs to outrank the `animation`
       shorthand on specificity rather than on source order. */
    <div className="wall-row flex overflow-hidden motion-reduce:overflow-x-auto">
      <div className={`wall-track flex shrink-0 ${animation}`}>
        {/* The row twice over, translated -50%, so the loop point lands
            exactly on the seam at any width. Spacing is padding inside
            each word rather than a flex gap — a gap would put extra
            space at the seam and break the loop. */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {/* Two elements, not one. The spacing has to be padding
                rather than a flex gap or the seam between the two
                tiles gets extra room and the loop jumps — but padding
                on the same element that carries `hover:` would make
                the 80px of air between two words part of a word's hit
                area, so pointing at the space between TYPESCRIPT and
                FASTAPI would light one of them. The outer span owns
                the spacing, the inner one owns the highlight, and the
                inner one is inline so its box is exactly the word. */}
            {names.map((name) => (
              <span
                key={`${copy}-${name}`}
                className={`shrink-0 select-none whitespace-nowrap px-7 sm:px-10 ${WALL_TYPE}`}
              >
                {/* The delay is declared on the hovered state only, so
                    it is asymmetric on purpose: a word waits 150ms
                    before lighting, and drops back the instant the
                    pointer leaves. Sweeping across the row therefore
                    does not strobe every word it crosses — the wall
                    only answers where you actually stop — while
                    letting go still feels immediate. */}
                <span className="text-bone-raised/20 transition-colors duration-200 ease-out hover:text-accent hover:delay-150">
                  {name}
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CapabilityWall() {
  return (
    <section
      id="capabilities"
      className="relative z-10 overflow-hidden bg-ink py-22 text-bone-raised sm:py-30"
      style={{ scrollMarginTop: 'var(--nav-h)' }}
    >
      {/* Field texture. Low enough to read as paper grain rather than
          as a pattern competing with the type. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(244,242,236,0.055)_1px,transparent_1px)] [background-size:24px_24px]"
      />

      <div className="relative mx-auto w-full max-w-shell px-gutter">
        <SectionHeader
          kicker="Capabilities"
          tone="dark"
          title={<>What I actually build with.</>}
          aside="Thirty-eight technologies across six areas — the ones I reach for daily."
        />
      </div>

      <div aria-hidden="true" className="relative mt-4">
        <div className="flex flex-col gap-10 sm:gap-14">
          {ROWS.map((names, i) => (
            <Row key={i} names={names} animation={ROW_ANIMATION[i]} />
          ))}
        </div>

        {/* Edge fades, so words enter and leave rather than being cut
            off against the gutter. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink to-transparent sm:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink to-transparent sm:w-40" />
      </div>

      {/* The wall is decorative type; this is the same 38 technologies
          as a plain grouped list, for anyone not reading it visually. */}
      <div className="sr-only">
        <h3>Technologies, by capability</h3>
        {CAPABILITIES.map((cap) => (
          <div key={cap.id}>
            <h4>{cap.title}</h4>
            <p>{cap.blurb}</p>
            <ul>
              {cap.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
