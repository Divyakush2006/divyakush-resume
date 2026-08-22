/* ─────────────────────────────────────────────────────────────────
   Insight slide plates.

   Generates one 16:10 SVG per slide into `public/insights/`.

   These are NOT photographs and they are deliberately not pretending
   to be. Every slide in this section describes a real milestone, and
   the photograph belonging to it is Divyakush's to supply — so the
   stand-in is an abstract typographic plate rather than a stock photo
   of somebody else's conference. A stock crowd shot captioned
   "National Entrepreneurship Challenge, Mumbai" would read as
   documentation of an event it does not document, which is exactly the
   defect that got `hackathon_win.webp` removed from this repo.

   The plate carries no title text: the carousel overlays the location,
   title and description itself, so dropping a real photograph in over
   the file needs no other change and loses nothing.

   Run:  node scripts/generate-insight-plates.mjs
   ───────────────────────────────────────────────────────────────── */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/insights');

/* Slugs must match `slug` in src/lib/insights.ts. `tint` stays within
   a narrow, desaturated range — twelve of these run past in sequence,
   and a full spectrum would read as a screensaver. */
const PLATES = [
  { slug: 'vit-begins',       year: '2024', tint: '#2E3A45' },
  { slug: 'iit-ropar-major',  year: '2025', tint: '#333F38' },
  { slug: 'devjams',          year: '2024', tint: '#3A3446' },
  { slug: 'nec-iit-bombay',   year: '2025', tint: '#45372E' },
  { slug: 'smart-india-hack', year: '2025', tint: '#2C3B42' },
  { slug: 'ey-techathon',     year: '2025', tint: '#3E3A2C' },
  { slug: 'first-internship', year: '2025', tint: '#2F3944' },
  { slug: 'startup-summit',   year: '2025', tint: '#31404A' },
  { slug: 'summit-floor',     year: '2025', tint: '#2B3E3C' },
  { slug: 'submissions-closed', year: '2025', tint: '#3B3346' },
  { slug: 'iit-ropar-complete', year: '2026', tint: '#333F38' },
  { slug: 'saturdays',        year: '2026', tint: '#2E3F35' },
];

function plate(p, i) {
  const W = 1600;
  const H = 1000;
  const n = String(i + 1).padStart(2, '0');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Placeholder plate ${n}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.tint}"/>
      <stop offset="0.55" stop-color="#141416"/>
      <stop offset="1" stop-color="#0B0B0C"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.72" cy="0.22" r="0.62">
      <stop offset="0" stop-color="${p.tint}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${p.tint}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="1.6" cy="1.6" r="1.6" fill="#F4F2EC" fill-opacity="0.07"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>

  <!-- Year, faint: atmosphere, not a label. Held at 260/0.035 — at
       440/0.05 three plates in a row read as one giant date scrolling
       across the deck, which is not what the eye should land on. -->
  <text x="${W - 96}" y="${H - 210}" text-anchor="end"
        font-family="Inter, Helvetica Neue, Arial, sans-serif" font-size="260" font-weight="900"
        fill="#F4F2EC" fill-opacity="0.035" letter-spacing="-14">${p.year}</text>

  <!-- Index -->
  <text x="96" y="140" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="30"
        fill="#F4F2EC" fill-opacity="0.4" letter-spacing="6">${n}</text>

  <!-- Corner rules -->
  <g stroke="#F4F2EC" stroke-opacity="0.16" stroke-width="2" fill="none">
    <path d="M96,196 L96,244"/>
    <path d="M${W - 96},196 L${W - 96},244"/>
  </g>

  <!-- Standing marker, so nobody mistakes a plate for a photograph.
       Top-right, because the carousel lays a caption gradient over the
       bottom third and this was invisible on the one slide that
       mattered — the centre one. It disappears the moment a real
       photograph replaces the file. -->
  <g transform="translate(${W - 96}, 132)">
    <rect x="-228" y="-26" width="228" height="40" rx="20" fill="#F4F2EC" fill-opacity="0.07"/>
    <text x="-114" y="0" text-anchor="middle" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="15"
          fill="#F4F2EC" fill-opacity="0.45" letter-spacing="2.2">PHOTOGRAPH TO FOLLOW</text>
  </g>
</svg>
`;
}

mkdirSync(OUT, { recursive: true });
PLATES.forEach((p, i) => writeFileSync(resolve(OUT, `${p.slug}.svg`), plate(p, i), 'utf8'));
console.log(`wrote ${PLATES.length} plates to public/insights/`);
