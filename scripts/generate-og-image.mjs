/* ─────────────────────────────────────────────────────────────────
   The 1200×630 cards this site shares: one for the site, one per
   project.

   The head declared `twitter:card = summary_large_image` and then
   shipped no image, so every link posted to LinkedIn, Slack or X
   unfurled as a blank rectangle with a title under it. That is the
   cheapest impression on the internet to lose.

   Rendered here rather than designed in a tool: they have to restate
   the site's own type and palette exactly, and the site's palette is in
   tailwind.config.js. Run it again if either changes.

   ── Why the project cards exist ───────────────────────────────────
   Every project page used to share the site card. The note in
   `app/_seo/metadata.ts` explaining that was right about the thing it
   was arguing against — a raw 16:10 screenshot dropped into a 1200×630
   slot gets cropped differently by every platform and reads as an
   accident — and wrong about the conclusion, because a screenshot was
   never the only alternative.

   A generated card is not a screenshot. It is the same designed
   1200×630 surface with the project's own name and descriptor set into
   it. So a link to Netra now unfurls as Netra, and the SERP thumbnail
   on a project result says what the project is instead of repeating
   the site's byline on all ten.

     node scripts/generate-og-image.mjs

   Output: public/og-image.png, public/og/<slug>.png
   ───────────────────────────────────────────────────────────────── */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';
const OUT = path.join(ROOT, 'public', 'og-image.png');
const OG_DIR = path.join(ROOT, 'public', 'og');

/* The project list is TypeScript and this is a plain node script, so the
   three fields a card needs are read out of the source rather than
   adding a transpile step for them.

   Split on the slug and pull each field out of its own chunk, rather
   than matching one regex across the whole record. Field order in
   projects.ts is not a contract — `topics` was added between `slug` and
   `title` and a single ordered pattern silently matched nothing, which
   is exactly the failure mode a card generator must not have. This
   cares only that the fields exist somewhere in the record.

   A parser that returns nothing looks identical to a project list that
   is empty, so it refuses to be quiet about it below. */
function projects() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'projects.ts'), 'utf8');
  const field = (chunk, name) => chunk.match(new RegExp(`\\n\\s*${name}: '([^']*)'`))?.[1];

  return src
    .split(/\n\s*slug: '/)
    .slice(1)
    .map((rest) => {
      const slug = rest.slice(0, rest.indexOf("'"));
      /* Stop at the next record so a field is never read from the one
         after it. */
      const chunk = '\n' + rest.split(/\n\s*slug: '/)[0];
      return {
        slug,
        title: field(chunk, 'title'),
        category: field(chunk, 'category'),
        descriptor: field(chunk, 'descriptor'),
      };
    })
    .filter((p) => p.slug && p.title);
}

const INK = '#0B0B0C';
const INK_RAISED = '#141416';
const BONE = '#F4F1EC';
const ACCENT = '#C8FF00';

const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    background: ${INK};
    font-family: Inter, system-ui, sans-serif;
    color: ${BONE};
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 72px 80px;
    position: relative; overflow: hidden;
  }
  /* One soft wash off the top-left, the same gesture the site's
     sections use, so the card reads as part of the same surface. */
  .wash {
    position: absolute; top: -280px; left: -180px;
    width: 900px; height: 900px; border-radius: 50%;
    background: radial-gradient(circle, rgba(200,255,0,0.10) 0%, rgba(200,255,0,0) 68%);
  }
  .rule { position: absolute; left: 0; right: 0; height: 1px; background: rgba(244,241,236,0.10); }
  .kicker {
    font-family: 'JetBrains Mono', monospace; font-size: 22px; letter-spacing: 0.18em;
    text-transform: uppercase; color: ${ACCENT};
  }
  h1 { font-size: 104px; font-weight: 800; letter-spacing: -0.045em; line-height: 0.98; }
  h1 span { color: rgba(244,241,236,0.55); font-weight: 500; }
  .role { margin-top: 26px; font-size: 34px; font-weight: 500; color: rgba(244,241,236,0.78); letter-spacing: -0.015em; }
  footer { display: flex; align-items: flex-end; justify-content: space-between; }
  .site { font-family: 'JetBrains Mono', monospace; font-size: 24px; color: rgba(244,241,236,0.55); letter-spacing: 0.04em; }
  .marks { display: flex; gap: 14px; }
  .mark {
    font-family: 'JetBrains Mono', monospace; font-size: 18px; letter-spacing: 0.10em;
    text-transform: uppercase; color: rgba(244,241,236,0.62);
    border: 1px solid rgba(244,241,236,0.16); border-radius: 999px;
    padding: 10px 18px; background: ${INK_RAISED};
  }
</style></head>
<body>
  <div class="wash"></div>
  <div class="rule" style="top: 0"></div>

  <div>
    <p class="kicker">Full Stack &middot; AI Systems</p>
    <h1 style="margin-top: 30px">Divyakush<br /><span>Punjabi</span></h1>
    <p class="role">Multi-tenant SaaS, semantic retrieval, production ML.</p>
  </div>

  <footer>
    <p class="site">www.divyakush.com</p>
    <div class="marks">
      <span class="mark">VIT Vellore</span>
      <span class="mark">IIT Ropar &mdash; AI</span>
      <span class="mark">LMX Labs</span>
    </div>
  </footer>
</body></html>`;

/* The project card. Same surface, same type, same footer rule — the
   only things that change are the kicker, the name and the line under
   it, so a project card and the site card read as one family.

   The name is set at a size that depends on its length rather than a
   fixed one. "Netra" and "Adaptive Traffic Light Controller" cannot
   share a font size on a fixed-width card without one of them either
   looking lost or overflowing, and an overflowing card is worse than
   no card. */
const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function projectCard(p) {
  const name = escapeHtml(p.title);
  const line = escapeHtml(p.descriptor ?? p.category ?? '');
  const size = name.length > 28 ? 68 : name.length > 18 ? 84 : 104;

  return html
    .replace(
      '<p class="kicker">Full Stack &middot; AI Systems</p>',
      `<p class="kicker">${escapeHtml(p.category ?? '')}</p>`,
    )
    .replace(
      '<h1 style="margin-top: 30px">Divyakush<br /><span>Punjabi</span></h1>',
      `<h1 style="margin-top: 30px; font-size: ${size}px">${name}</h1>`,
    )
    .replace(
      '<p class="role">Multi-tenant SaaS, semantic retrieval, production ML.</p>',
      `<p class="role">${line}</p>`,
    )
    /* The footer keeps the bare domain. The full project path was the
       obvious thing to put here and it wrapped onto two lines on the
       longer slugs, which looks like a bug rather than a detail. */
    .replace(
      /<div class="marks">[\s\S]*?<\/div>/,
      '<div class="marks"><span class="mark" style="white-space: nowrap">Divyakush Punjabi</span></div>',
    );
}

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

const shoot = async (markup, file) => {
  await page.setContent(markup, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: file });
  return (fs.statSync(file).size / 1024).toFixed(0);
};

console.log(`og-image.png${' '.repeat(30)} 1200x630  ${await shoot(html, OUT)}KB`);

const list = projects();
/* A silent zero here would ship ten pages pointing at cards that do not
   exist, which is worse than the shared card they replaced. */
if (!list.length) {
  console.error('\nNo projects parsed out of src/lib/projects.ts — refusing to continue.');
  await browser.close();
  process.exit(1);
}

fs.mkdirSync(OG_DIR, { recursive: true });
for (const p of list) {
  const file = path.join(OG_DIR, `${p.slug}.png`);
  console.log(`og/${p.slug}.png${' '.repeat(Math.max(1, 39 - p.slug.length))}1200x630  ${await shoot(projectCard(p), file)}KB`);
}

await browser.close();
console.log(`\n${list.length + 1} card(s) rendered.`);
