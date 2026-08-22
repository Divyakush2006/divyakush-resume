/* What actually makes a page lag on a weak phone.

   Frame timing from a headless browser is not trustworthy — there is
   no vsync and no real compositor, so it reports impossible frame
   rates and understates paint. These four numbers are measurable and
   are the things that genuinely hurt on old hardware:

     decoded bitmap memory
       An image costs width x height x 4 bytes once decoded, whatever
       the file weighs on disk. A 2048x1152 WebP is 240KB over the wire
       and 9.4MB in memory. On a phone with 2-3GB shared between the OS
       and the browser, this is the number that causes the tab to be
       evicted and reloaded — the worst "lag" a reader can experience,
       because the page starts again.

     oversized images
       Bytes decoded that no one can see: an image rendered into a box
       far smaller than its intrinsic size. Pure waste, and it scales
       with the square of the ratio.

     expensive layers
       filter: blur and backdrop-filter each force an offscreen pass.
       These are the classic mobile-GPU killers.

     long tasks
       Main-thread blocks over 50ms during a full-page scroll. This is
       the one that makes a thumb feel like it is dragging treacle.
*/
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';
const BASE = process.argv[2] || 'http://localhost:5188';
const MB = 1048576;

const browser = await chromium.launch({ executablePath: EXE });

for (const [label, w, h, cpu] of [
  ['phone, 6x CPU', 390, 844, 6],
  ['desktop', 1440, 900, 1],
]) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700,
    deviceScaleFactor: w < 700 ? 2 : 1,
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });

  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const stats = await page.evaluate(async () => {
    let longTask = 0;
    let longCount = 0;
    const po = new PerformanceObserver((l) => {
      for (const e of l.getEntries()) { longTask += e.duration; longCount++; }
    });
    try { po.observe({ type: 'longtask', buffered: false }); } catch { /* ignore */ }

    /* Walk the page the way a reader would. */
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 90));
    }
    await new Promise((r) => setTimeout(r, 600));
    po.disconnect();

    const imgs = [...document.images].filter((i) => i.naturalWidth > 0);
    let decoded = 0;
    const oversized = [];
    for (const im of imgs) {
      decoded += im.naturalWidth * im.naturalHeight * 4;
      const r = im.getBoundingClientRect();
      const shown = Math.max(r.width, 1) * devicePixelRatio;
      if (r.width > 0 && im.naturalWidth > shown * 1.6) {
        oversized.push({
          src: (im.currentSrc || im.src).split('/').pop(),
          natural: im.naturalWidth,
          shown: Math.round(shown),
          wasteMB: +((im.naturalWidth * im.naturalHeight * 4 -
            shown * shown / (im.naturalWidth / im.naturalHeight) * 4) / 1048576).toFixed(1),
        });
      }
    }

    const all = [...document.querySelectorAll('*')];
    const blurs = all.filter((e) => {
      const s = getComputedStyle(e);
      return s.filter.includes('blur') || s.backdropFilter.includes('blur');
    }).length;

    return {
      images: imgs.length,
      decoded,
      oversized: oversized.sort((a, b) => b.wasteMB - a.wasteMB).slice(0, 6),
      oversizedCount: oversized.length,
      blurs,
      longTask,
      longCount,
      domNodes: all.length,
    };
  });

  console.log(`\n${'─'.repeat(68)}\n${label}\n${'─'.repeat(68)}`);
  console.log(`  images decoded        ${stats.images}`);
  console.log(`  decoded bitmap memory ${(stats.decoded / MB).toFixed(1)} MB`);
  console.log(`  oversized for their box ${stats.oversizedCount}`);
  for (const o of stats.oversized) {
    console.log(`      ${o.natural}px natural into ${o.shown}px box   ${o.src}`);
  }
  console.log(`  blur / backdrop layers  ${stats.blurs}`);
  console.log(`  long tasks while scrolling  ${stats.longCount} totalling ${stats.longTask.toFixed(0)}ms`);
  console.log(`  DOM nodes             ${stats.domNodes}`);
  await ctx.close();
}

await browser.close();
console.log('');
