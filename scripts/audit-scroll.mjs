/* Scroll performance on a weak phone.

   "Does it lag" is not answerable by looking at it on a desktop. This
   drives a real scroll through each section while sampling every
   animation frame, under CPU throttling that stands in for older
   hardware — 4x is roughly a mid-range phone, 6x a genuinely old one.

   What is reported per section:

     fps      mean frames per second across the scroll
     p95      95th percentile frame time; the number a reader feels,
              because the worst frames are the ones you notice
     jank     frames over 50ms — a visible hitch, not a dropped frame
     long     total main-thread long-task time during the pass

   A section is smooth if p95 stays near the frame budget (16.7ms at
   60Hz) and jank is zero. Anything with a p95 over ~50ms is a section
   that stutters under a thumb. */
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';
const BASE = process.argv[2] || 'http://localhost:5188';

/* Sections to walk, by the id each one renders with. `work` is the
   sticky project deck and `insights` the moment carousel — the two the
   whole exercise is about. `experience` and `education` are controls:
   ordinary sections on the same page, so the numbers have something
   to be compared against rather than judged in the abstract. */
const SECTIONS = ['work', 'experience', 'education', 'insights'];

const browser = await chromium.launch({ executablePath: EXE });

for (const cpu of [4, 6]) {
  console.log(`\n${'═'.repeat(72)}`);
  console.log(`390px viewport · CPU throttled ${cpu}x  (${cpu === 4 ? 'mid-range phone' : 'old, weak phone'})`);
  console.log('═'.repeat(72));
  console.log('  section       fps    p95      worst    jank>50ms   longtask');

  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });

  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  /* End the hero intro so its timers are not part of the measurement. */
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
  await page.waitForTimeout(1500);

  for (const id of SECTIONS) {
    const r = await page.evaluate(async (sectionId) => {
      const el = document.getElementById(sectionId);
      if (!el) return null;

      const top = el.getBoundingClientRect().top + scrollY;
      const height = el.offsetHeight;
      scrollTo({ top: Math.max(0, top - 40), behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 700));

      let longTask = 0;
      const po = new PerformanceObserver((l) => {
        for (const e of l.getEntries()) longTask += e.duration;
      });
      try { po.observe({ type: 'longtask', buffered: false }); } catch { /* unsupported */ }

      /* Walk the section in per-frame steps, the way a thumb would,
         and time every frame. Capped so a very tall section does not
         run for a minute. */
      const distance = Math.min(height, innerHeight * 6);
      const frames = [];
      const STEP = 24;
      let travelled = 0;

      await new Promise((resolve) => {
        let last = performance.now();
        const tick = (now) => {
          frames.push(now - last);
          last = now;
          scrollBy(0, STEP);
          travelled += STEP;
          if (travelled >= distance) return resolve();
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

      po.disconnect();

      /* Drop the first frame: it carries the gap since the last paint,
         not the cost of scrolling. */
      const f = frames.slice(1).sort((a, b) => a - b);
      if (!f.length) return null;
      const pct = (p) => f[Math.min(f.length - 1, Math.floor(f.length * p))];
      const mean = f.reduce((a, b) => a + b, 0) / f.length;

      return {
        fps: 1000 / mean,
        p95: pct(0.95),
        worst: f[f.length - 1],
        jank: f.filter((x) => x > 50).length,
        longTask,
        n: f.length,
      };
    }, id);

    if (!r) { console.log(`  ${id.padEnd(12)} (not found)`); continue; }
    const flag = r.p95 > 50 ? '  <-- stutters' : r.p95 > 33 ? '  <-- rough' : '';
    console.log(
      `  ${id.padEnd(12)} ${r.fps.toFixed(0).padStart(3)}  ` +
      `${r.p95.toFixed(1).padStart(6)}ms ${r.worst.toFixed(0).padStart(6)}ms ` +
      `${String(r.jank).padStart(7)}    ${r.longTask.toFixed(0).padStart(5)}ms${flag}`
    );
  }

  await ctx.close();
}

await browser.close();
console.log('');
