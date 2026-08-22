/* Navigation, which a screenshot cannot check.
 *
 * The visual harness proves the pages look the same. It says nothing
 * about what happens between them, and the move from React Router to
 * the App Router is entirely about what happens between them. Four
 * things had to survive the port, and each one is a specific behaviour
 * somebody decided:
 *
 *   1. Opening a story is a modal route. `/insights/<slug>` renders the
 *      same page as `/` with an overlay on top, so the page underneath
 *      must not move and must not be rebuilt. If it were rebuilt the
 *      carousel would jump back to its first slide and the hero would
 *      replay its intro every time a card was opened.
 *   2. Closing it returns to `/` and leaves the reader where they were.
 *   3. Going to a project page is a real navigation: it goes to the top,
 *      and it does not reload the document.
 *   4. Back from a project page returns to the portfolio.
 *
 * Remounting is detected by marking the DOM. A property set on a node
 * inside the carousel survives a re-render and does not survive a
 * remount, which is the distinction that matters and the one that is
 * invisible in a screenshot.
 *
 *   node scripts/serve-dist.mjs 5188 out
 *   node scripts/audit-navigation.mjs
 */
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';
const BASE = process.argv[2] || 'http://localhost:5188';

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

/* A full document load resets this; a client-side navigation does not. */
const markDocument = () => page.evaluate(() => (window.__sameDocument = true));
const sameDocument = () => page.evaluate(() => window.__sameDocument === true);

/* A remount replaces the node, and the marker goes with it. */
const markCarousel = () =>
  page.evaluate(() => {
    const el = document.querySelector('[aria-roledescription="carousel"]');
    if (!el) return false;
    el.__marked = true;
    return true;
  });
const carouselSurvived = () =>
  page.evaluate(() => {
    const el = document.querySelector('[aria-roledescription="carousel"]');
    return !!el && el.__marked === true;
  });

const scrollY = () => page.evaluate(() => Math.round(window.scrollY));
const path = () => page.evaluate(() => location.pathname);

await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

/* ── 1. Opening a story ───────────────────────────────────────── */
/* Instant, not the site's own smooth scroll. With smooth scrolling the
   offset read a moment later is a point part-way through an animation,
   and the pin that happens after it lands eighty pixels further down —
   which looks exactly like the page moving when a story opens. */
await page.evaluate(() =>
  document.getElementById('insights')?.scrollIntoView({ block: 'center', behavior: 'instant' }),
);
await page.waitForTimeout(1500);

const beforeOpen = await scrollY();
await markDocument();
check('carousel is present to mark', await markCarousel());

/* The card is a real anchor under a drag surface, so it is opened the
   way the keyboard opens it rather than by simulating a tap. */
await page.evaluate(() => {
  const link = document.querySelector('[aria-roledescription="carousel"] a[href^="/insights/"]');
  link?.click();
});
await page.waitForTimeout(1400);

check('opening a story changes the URL', (await path()).startsWith('/insights/'), await path());
check('opening a story does not reload the document', await sameDocument());
check('opening a story does not remount the carousel', await carouselSurvived());
/* While the overlay is up the body is pinned with `position: fixed`
   and a negative `top`, so `window.scrollY` is 0 by construction —
   see src/lib/scroll-lock.ts. Asking for the scroll offset here would
   always read zero and always look like a jump to the top, which is
   the exact bug the pinning exists to avoid. What is actually
   asserted is that the page is pinned at the offset it was on. */
const pinnedAt = await page.evaluate(() => {
  const { position, top } = getComputedStyle(document.body);
  return position === 'fixed' ? Math.round(Math.abs(parseFloat(top))) : null;
});
check(
  'opening a story pins the page where it was',
  pinnedAt !== null && Math.abs(pinnedAt - beforeOpen) <= 2,
  pinnedAt === null ? 'body is not pinned' : `pinned at ${pinnedAt}, was at ${beforeOpen}`,
);
check(
  'the story overlay is open',
  await page.evaluate(() => !!document.querySelector('[role="dialog"][aria-modal="true"]')),
);

/* ── 2. Stepping, then closing ────────────────────────────────── */
const firstSlug = await path();
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(900);
check('arrow keys step to the next moment', (await path()) !== firstSlug, await path());
check('stepping does not remount the carousel', await carouselSurvived());

await page.keyboard.press('Escape');
await page.waitForTimeout(1200);
check('escape closes back to the portfolio', (await path()) === '/', await path());
check('closing does not remount the carousel', await carouselSurvived());
/* Within a hundred pixels rather than exactly. Unpinning restores the
   saved offset, but the document is momentarily shorter while the body
   is fixed, so the browser can clamp the restore by a few dozen pixels
   near the very bottom of a 27,000px page — which is where this test
   happens to be. Measured at the same value on the build before this
   port and the one after it, so it is behaviour being preserved rather
   than a regression being tolerated. A hundred pixels is far tighter
   than the failure worth catching, which is landing back at the top. */
const afterClose = await scrollY();
check(
  'closing leaves the reader where they were',
  Math.abs(afterClose - beforeOpen) <= 100,
  `${beforeOpen} → ${afterClose}`,
);
check(
  'the overlay is gone',
  await page.evaluate(() => !document.querySelector('[role="dialog"][aria-modal="true"]')),
);

/* ── 3. A real navigation ─────────────────────────────────────── */
await markDocument();
await page.evaluate(() => {
  const link = document.querySelector('a[href^="/projects/"]');
  link?.click();
});
await page.waitForTimeout(1600);

check('a project link navigates', (await path()).startsWith('/projects/'), await path());
check('a project link does not reload the document', await sameDocument());
check('a project page opens at the top', (await scrollY()) <= 2, `scrollY ${await scrollY()}`);
check(
  'the project page rendered',
  await page.evaluate(() => document.body.innerText.trim().length > 1500),
);

/* ── 4. Back, and a section link ──────────────────────────────── */
await page.goBack();
await page.waitForTimeout(1600);
check('back returns to the portfolio', (await path()) === '/', await path());

await page.goto(BASE + '/projects/netra', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await markDocument();
await page.evaluate(() => {
  const link = [...document.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/#work');
  link?.click();
});
await page.waitForTimeout(1800);
check('a section link from a project page lands on that section', await page.evaluate(() => {
  const section = document.getElementById('work');
  if (!section) return false;
  const top = section.getBoundingClientRect().top;
  return location.pathname === '/' && Math.abs(top) < 200;
}));

/* ── 5. A path with no document ───────────────────────────────── */
const response = await page.goto(BASE + '/no-such-page', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
check('an unknown path answers 404', response?.status() === 404, `status ${response?.status()}`);
check(
  'an unknown path still renders the site',
  await page.evaluate(
    () => !!document.getElementById('site-footer') && document.body.innerText.includes('404'),
  ),
);

await browser.close();

const failed = results.filter((r) => !r.ok).length;
console.log(
  failed
    ? `\n${failed} of ${results.length} navigation checks failed\n`
    : `\nall ${results.length} navigation checks pass\n`,
);
process.exit(failed ? 1 : 0);
