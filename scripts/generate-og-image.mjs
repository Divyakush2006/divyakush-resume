/* ─────────────────────────────────────────────────────────────────
   The 1200×630 card every share of this site renders.

   The head declared `twitter:card = summary_large_image` and then
   shipped no image, so every link posted to LinkedIn, Slack or X
   unfurled as a blank rectangle with a title under it. That is the
   cheapest impression on the internet to lose.

   Rendered once, here, rather than designed in a tool: it has to
   restate the site's own type and palette exactly, and the site's
   palette is in tailwind.config.js. Run it again if either changes.

     node scripts/generate-og-image.mjs

   Output: public/og-image.png
   ───────────────────────────────────────────────────────────────── */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';
const OUT = path.join(ROOT, 'public', 'og-image.png');

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

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.screenshot({ path: OUT });
await browser.close();

console.log(`og-image.png  1200x630  ${(fs.statSync(OUT).size / 1024).toFixed(0)}KB`);
