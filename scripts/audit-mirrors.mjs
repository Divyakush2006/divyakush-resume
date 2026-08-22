/* Are the carousel's side mirrors doing anything, and are they drawn
   only where they are?

   The mirrors fill the slack either side of a photograph narrower than
   the card it sits in. The fitted box is

       width = min(100cqw, 100cqh * ratio)

   so when `100cqh * ratio` is at or above the card's width, the photo
   already spans the card, the fitted box is the full width, and the
   two mirrors would sit entirely outside it — clipped, invisible, and
   still costing a blur(24px) and a mask each.

   This script existed to answer one question — do the mirrors show
   anything on a phone? — and the answer was no, because every
   photograph in the deck was landscape and a phone's card is portrait.
   That justified a 768px gate.

   A portrait photograph then joined the deck, and the premise stopped
   holding: at 0.66 in a 0.86 card it leaves real slack down both sides
   of a phone. The gate is now the measurement itself (`cardAspect` vs
   the picture's ratio, in InsightsCarousel), so the question this
   script asks has changed with it. It is no longer "which widths?" but
   the invariant:

       a mirror is mounted if, and only if, there is slack to fill

   Both directions are failures. Mirrors with no slack are the pure
   cost the gate was built to remove; slack with no mirrors is a bare
   column of card ink where the picture should be running out of frame.

   Two slides are checked at every width: the landscape one the deck
   opens on, and the portrait one, which is the only entry in the set
   that leaves columns on a phone. */
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';
const BASE = process.argv[2] || 'http://localhost:5188';

/* Landscape first — that is what the deck opens on — then the portrait
   entry, reached by its own URL and closed back to the deck. */
const SLIDES = [
  { label: 'landscape slide', url: '/' },
  { label: 'portrait slide', url: '/insights/iit-ropar-convocation', escape: true },
];

const browser = await chromium.launch({ executablePath: EXE });
let failures = 0;

for (const [w, h, label] of [
  [390, 844, 'phone'],
  [430, 932, 'large phone'],
  [768, 1024, 'tablet'],
  [1440, 900, 'desktop'],
]) {
  console.log(`\n${label} (${w}px)`);

  for (const slide of SLIDES) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700,
    });
    const page = await ctx.newPage();
    await page.goto(BASE + slide.url, { waitUntil: 'networkidle' });
    if (slide.escape) {
      /* The URL opens the story over the deck; Escape returns to the
         deck with that slide centred, which is the state to measure. */
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
    }
    await page.evaluate(() => {
      const el = document.getElementById('insights');
      if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    await page.waitForTimeout(2500);

    const r = await page.evaluate(() => {
      /* The mirror wrappers are the aria-hidden divs holding a blurred
         copy; find them via the blurred images themselves. */
      const blurred = [...document.querySelectorAll('#insights img')]
        .filter((i) => getComputedStyle(i).filter.includes('blur'));

      /* Only the centre card can be measured for slack: the fitted box
         is only rendered where a mirror is, so a card without mirrors
         has nothing to measure against. The card's own width and the
         image's natural ratio give the same answer for every slide. */
      const cards = [...document.querySelectorAll('#insights article')];
      const centre = cards.find((c) => c.getAttribute('aria-hidden') === null);
      const img = centre?.querySelector('img:not([aria-hidden="true"])');
      const cr = centre?.getBoundingClientRect();
      if (!cr || !img || !img.naturalWidth) return { blurredCount: blurred.length };

      const ratio = img.naturalWidth / img.naturalHeight;
      const fittedW = Math.min(cr.width, cr.height * ratio);
      return {
        blurredCount: blurred.length,
        cardW: Math.round(cr.width),
        cardH: Math.round(cr.height),
        photoRatio: ratio,
        fittedW: Math.round(fittedW),
        sideSlack: Math.round((cr.width - fittedW) / 2),
        fills: getComputedStyle(img).objectFit === 'cover',
      };
    });

    if (r.cardW === undefined) {
      console.log(`  ${slide.label.padEnd(16)} could not measure`);
      failures++;
      await ctx.close();
      continue;
    }

    /* A photograph set to cover the card has no slack by construction,
       and correctly draws no mirrors. */
    const wants = !r.fills && r.sideSlack > 1;
    const has = r.blurredCount > 0;
    const ok = wants === has;
    if (!ok) failures++;

    console.log(
      `  ${slide.label.padEnd(16)} card ${r.cardW}x${r.cardH}  photo ${r.photoRatio.toFixed(2)}` +
        `${r.fills ? ' (fills)' : ''}  fits to ${r.fittedW}px  side slack ${r.sideSlack}px` +
        `  mirrors ${r.blurredCount}  ${ok ? 'ok' : 'MISMATCH'}`,
    );

    await ctx.close();
  }
}

await browser.close();
console.log(
  failures
    ? `\n${failures} mismatch(es): a mirror is mounted without slack, or slack is left unfilled\n`
    : '\nevery slide draws mirrors if and only if it has slack to fill\n',
);
process.exit(failures ? 1 : 0);
