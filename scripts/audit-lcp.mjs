/* What is actually the Largest Contentful Paint element? Optimising
   the wrong one is the most common way to spend effort and move
   nothing. */
import { chromium } from 'playwright-core';
const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';
const BASE = process.argv[2] || 'http://localhost:5188';
const b = await chromium.launch({ executablePath: EXE });
for (const [tag, w, cpu, rm] of [
  ['desktop', 1440, 1, 'no-preference'],
  ['desktop, no intro', 1440, 1, 'reduce'],
  ['mobile 4x CPU', 390, 4, 'no-preference'],
  ['mobile 4x, no intro', 390, 4, 'reduce'],
]) {
  for (const path of ['/']) {
    const ctx = await b.newContext({ viewport: { width: w, height: 850 }, isMobile: w < 700, hasTouch: w < 700, reducedMotion: rm });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await page.goto(BASE + path, { waitUntil: 'load' });
    await page.waitForTimeout(cpu > 1 ? 4500 : 2200);
    const r = await page.evaluate(() => new Promise((res) => {
      let last = null;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) last = e; })
        .observe({ type: 'largest-contentful-paint', buffered: true });
      setTimeout(() => res(last ? {
        t: Math.round(last.startTime),
        url: last.url || '(text)',
        tag: last.element?.tagName || '?',
        cls: (last.element?.className || '').toString().slice(0, 50),
        text: (last.element?.textContent || '').trim().slice(0, 44),
        size: last.size,
      } : null), 500);
    }));
    console.log(`${path.padEnd(4)} [${tag.padEnd(20)}]  LCP ${String(r?.t).padStart(5)}ms  <${r?.tag}>  ${r?.url === '(text)' ? `"${r.text}"` : r?.url.split('/').pop()}`);
    await ctx.close();
  }
}
await b.close();
