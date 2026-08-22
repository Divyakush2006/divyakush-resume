/* Visual baseline / comparison for the Next.js port.
 *
 * The port's hard requirement is that nothing on screen changes. That
 * is a claim about pixels, so it is checked in pixels rather than by
 * reading the diff and hoping.
 *
 * Every route is captured full-page at a phone and a desktop width with
 * `prefers-reduced-motion: reduce`. Reduced motion is not a compromise
 * here, it is what makes the comparison possible: it parks the carousel
 * autoplay, skips the hero's timed intro and collapses every transition
 * to zero duration, so two runs of the same build produce byte-identical
 * files. Without it the carousel is at a different slide and the hero at
 * a different point in its reveal every time, and every diff is noise.
 *
 *   node scripts/snapshot.mjs <dir> [base]
 *
 * Writes <dir>/<route>-<width>.png. Run it once against the Vite build
 * and once against the Next build, then diff the two directories with
 * scripts/snapshot-diff.mjs.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';
const OUT = process.argv[2];
const BASE = process.argv[3] || 'http://localhost:5188';
if (!OUT) throw new Error('usage: node scripts/snapshot.mjs <dir> [base]');

const PROJECTS = [
  'saturdays', 'dineguru', 'governai-research-atlas', 'governai-studio',
  'content-recommendation-engine', 'rockfall-prediction', 'netra', 'algoverse',
  'smart-home-automation', 'adaptive-traffic-controller',
];
const INSIGHTS = [
  'nec-iit-bombay', 'nec-visionary-ventures', 'devjams', 'iit-ropar-major',
  'startup-summit', 'summit-floor', 'first-internship', 'electroutsav',
  'submissions-closed', 'smart-india-hack', 'iit-ropar-convocation',
  'iit-ropar-complete',
];
const ROUTES = [
  '/',
  ...PROJECTS.map((s) => `/projects/${s}`),
  ...INSIGHTS.map((s) => `/insights/${s}`),
  '/no-such-page',
];

fs.mkdirSync(OUT, { recursive: true });
/* Subpixel antialiasing is not deterministic here. Chromium picks
   between grayscale and LCD/RGB antialiasing per layer, and whether a
   given run of text gets its own compositing layer depends on whether
   an animation happened to leave a transform behind on an ancestor.
   Two runs of the same build disagreed on three chip labels on one
   project page: colour fringing on the glyph edges, identical
   geometry, invisible at 1x and loud to a pixel comparison.

   --disable-lcd-text forces grayscale everywhere, which makes the
   comparison answer the question it is being asked — did the layout
   or the content change. It does not change what a reader sees,
   because a reader is not running this script. */
const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--disable-lcd-text', '--force-color-profile=srgb'],
});

let n = 0;
for (const [w, h, tag] of [[390, 844, 'phone'], [1440, 900, 'desktop']]) {
  for (const route of ROUTES) {
    /* A context per page, not per viewport, and the cost — a few
       seconds across forty-eight captures — buys the only thing that
       matters here, which is that two runs mean the same thing.

       Sharing one context shares its HTTP cache, and a warm cache
       changes which rung of an image ladder the browser picks: it will
       paint a 400w rendition it already holds rather than fetch the
       800w the `sizes` attribute asks for. Which rung a given page got
       then depended on what the pages before it had happened to load,
       and one insight overlay came out resampled differently between
       two runs of the same build. Cold, both builds pick the same file
       every time — verified before this was changed. */
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      isMobile: w < 768,
      hasTouch: w < 768,
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();

    /* The footer carries a live IST clock, so two captures a minute
       apart differ by two glyphs and the comparison reports it as a
       change.

       The obvious fix — freeze the global Date — breaks the page. The
       animation library reads the clock to compute frame deltas, and a
       clock that never advances produces a zero delta, which produced
       an offset outside [0,1] and a thrown error out of
       Element.animate(). Thirteen pages rendered as an empty viewport.

       So the patch is as narrow as the problem: any formatter asking
       for Asia/Kolkata — which is the clock, and nothing else on the
       site — is pinned to one instant. Every other use of time,
       including every animation, runs on the real clock. */
    await page.addInitScript(() => {
      const RealDTF = Intl.DateTimeFormat;
      const FIXED = new Date('2026-01-01T12:00:00+05:30');
      function Pinned(locale, options) {
        const real = new RealDTF(locale, options);
        if (!options || options.timeZone !== 'Asia/Kolkata') return real;
        const text = real.format(FIXED);
        return {
          format: () => text,
          formatToParts: () => real.formatToParts(FIXED),
          resolvedOptions: () => real.resolvedOptions(),
        };
      }
      Pinned.supportedLocalesOf = RealDTF.supportedLocalesOf.bind(RealDTF);
      Intl.DateTimeFormat = Pinned;
    });

    /* Nothing lazy-loads during a capture.

       Most images below the fold carry loading="lazy", which is right
       for a reader and wrong for a comparison: whether one has loaded
       by the time the shutter opens depends on a race. On an insight
       route the race is unwinnable — the story overlay pins the body
       with `position: fixed`, so the scroll-through moves nothing, no
       lazy image ever enters the viewport, and the covers behind the
       overlay stay empty. Which build won that race decided whether
       ten project covers appeared, and it reported as a 1.8% pixel
       difference on two pages.

       Both builds mark exactly the same 32 images lazy and load
       exactly the same 27 once the overlay is closed — verified
       before this was added — so the attribute is not what differed.
       Stripping it removes the timing, not the behaviour: every image
       is fetched, the wait below can actually reach "all complete",
       and the capture shows the page rather than the race. */
    await page.addInitScript(() => {
      const strip = (node) => {
        if (node.tagName === 'IMG') node.removeAttribute('loading');
        node.querySelectorAll?.('img[loading]').forEach((i) => i.removeAttribute('loading'));
      };
      new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) if (node.nodeType === 1) strip(node);
        }
      }).observe(document, { childList: true, subtree: true });
    });

    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
    await page.goto(BASE + route, { waitUntil: 'networkidle' }).catch(() => {});
    /* Long enough for the app to boot and, on an insight route, for
       the story overlay to mount — which is what the check below is
       asking about. */
    await page.waitForTimeout(1800);

    /* Scroll the whole page once so every whileInView reveal has
       fired, then return to the top — except where a modal is up.

       `/insights/<slug>` opens a story over the portfolio, and the
       overlay pins the body with `position: fixed` and a negative
       `top` equal to the scroll offset at the moment it mounted. So
       scrolling here does not scroll: it races the overlay. Whatever
       offset the page reached before the pin engaged becomes the
       offset the whole document is frozen at, and the deck behind the
       overlay is scroll-linked — so a few hundred pixels of head
       start changes which frame is showing and which are dimmed.
       Seven desktop captures differed on exactly that, in both
       directions across runs.

       With the modal up there is nothing to reveal by scrolling
       anyway — it covers the page — so the scroll is skipped and the
       pin lands at 0 every time, in every build. */
    const modal = await page
      .locator('[role="dialog"][aria-modal="true"]')
      .count()
      .catch(() => 0);

    if (!modal) {
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 40));
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
    }
    /* Wait for the pictures themselves, not for the network to go
       quiet. `networkidle` fires when requests stop, which on a warm
       cache is before a large WebP has been decoded and painted — so
       the first run against a cold server caught five overlays with an
       empty frame and every run after it caught them full. That is the
       harness being timing-dependent, and a comparison harness that
       depends on cache warmth cannot tell a regression from a race.

       `img.complete` is true once the image is fully decoded or has
       failed, which is the state a screenshot needs. The timeout is a
       ceiling, not the normal path. */
    await page
      .waitForFunction(
        () => [...document.images].every((i) => i.complete),
        null,
        { timeout: 15000 },
      )
      .catch(() => console.log(`  ! ${route} ${tag}: images still loading at 15s`));
    await page.waitForTimeout(600);

    const name = (route === '/' ? 'home' : route.slice(1).replace(/\//g, '_')) + `-${tag}.png`;

    /* A modal route is captured at viewport size, not full page, and
       this is the last of the harness's determinism problems rather
       than a shortcut.

       A full-page capture works by asking Chromium to render beyond the
       viewport. On these routes the body is pinned with
       `position: fixed` for the scroll lock, so "beyond the viewport"
       is not a well-defined thing: the document still lays out to
       27,000px, the compositor is asked to paint all of it at once, and
       the scroll-linked deck behind the overlay resolves differently
       depending on how that pass runs. Captured twice from the same
       build, the same route differed by 1.4%. Captured once from each
       build, the two were identical to the pixel — which is the whole
       problem: the noise was larger than the signal.

       The viewport is also the honest frame. The overlay is fixed and
       covers the screen, so what a reader sees on this URL is one
       screenful; the page underneath is already captured in full by the
       `/` route. */
    await page.screenshot({ path: path.join(OUT, name), fullPage: !modal });
    if (errors.length) console.log(`  ! ${route} ${tag}: ${errors[0]}`);
    await ctx.close();
    n++;
  }
}

await browser.close();
console.log(`${n} snapshots -> ${OUT}`);
