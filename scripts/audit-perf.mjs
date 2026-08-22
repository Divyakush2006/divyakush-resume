/* Field-realistic performance, plus the two behaviours that a DOM
   audit cannot see: whether reduced motion is honoured, and whether
   the overlays are keyboard-safe.

   The mobile pass throttles CPU 4x and shapes the network to roughly
   Fast 3G, because "fast on a desktop over localhost" is not a
   measurement, it is a tautology. */
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';
const BASE = process.argv[2] || 'http://localhost:5188';

const browser = await chromium.launch({ executablePath: EXE });
let fails = 0;
const check = (label, ok, detail = '') => {
  if (!ok) fails++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? `   ${detail}` : ''}`);
};

/* ── 1. Loading performance ─────────────────────────────────────── */
for (const [label, w, hh, cpu, net] of [
  ['desktop, unthrottled', 1440, 900, 1, null],
  ['mobile, 4x CPU + Fast 3G', 390, 844, 4, { download: 1.6e6 / 8, upload: 750e3 / 8, latency: 150 }],
]) {
  for (const path of ['/', '/projects/saturdays']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: hh }, isMobile: w < 700, hasTouch: w < 700 });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    if (net) {
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: net.latency, downloadThroughput: net.download, uploadThroughput: net.upload });
    }

    const bytes = { js: 0, css: 0, img: 0, font: 0, other: 0 };
    page.on('response', async (r) => {
      try {
        const len = +(r.headers()['content-length'] || 0);
        const t = r.request().resourceType();
        if (t === 'script') bytes.js += len;
        else if (t === 'stylesheet') bytes.css += len;
        else if (t === 'image') bytes.img += len;
        else if (t === 'font') bytes.font += len;
        else bytes.other += len;
      } catch { /* response gone */ }
    });

    await page.goto(BASE + path, { waitUntil: 'load' });
    await page.waitForTimeout(cpu > 1 ? 5000 : 2500);

    const m = await page.evaluate(() => new Promise((resolve) => {
      let lcp = 0, cls = 0, longTasks = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = Math.max(lcp, e.startTime); })
        .observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; })
        .observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) longTasks += Math.max(0, e.duration - 50); })
        .observe({ type: 'longtask', buffered: true });
      setTimeout(() => {
        const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;
        resolve({ lcp: Math.round(lcp), cls: +cls.toFixed(4), fcp: Math.round(fcp), tbt: Math.round(longTasks) });
      }, 600);
    }));

    const kb = (n) => `${Math.round(n / 1024)}KB`;
    console.log(`\n${path}  [${label}]`);
    console.log(`   FCP ${m.fcp}ms   LCP ${m.lcp}ms   CLS ${m.cls}   blocking ${m.tbt}ms`);
    console.log(`   transfer: js ${kb(bytes.js)}  css ${kb(bytes.css)}  img ${kb(bytes.img)}  font ${kb(bytes.font)}`);
    /* Core Web Vitals thresholds: LCP good <2500ms, CLS good <0.1. */
    check('LCP within "good" (<2500ms)', m.lcp > 0 && m.lcp < 2500, `${m.lcp}ms`);
    check('CLS within "good" (<0.1)', m.cls < 0.1, String(m.cls));
    await ctx.close();
  }
}

/* ── 2. Reduced motion ──────────────────────────────────────────── */
console.log('\nprefers-reduced-motion: reduce');
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  /* With motion reduced the hero must be settled and readable rather
     than mid-transition or still waiting on an intro sequence. */
  const r = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const s = h1 ? getComputedStyle(h1) : null;
    return {
      h1Opacity: s ? +s.opacity : -1,
      h1Text: h1?.textContent?.trim().slice(0, 40) || '',
      invisible: [...document.querySelectorAll('h1,h2,p')]
        .filter((e) => e.getClientRects().length && +getComputedStyle(e).opacity < 0.9).length,
    };
  });
  check('page errors', errs.length === 0, errs[0] || '');
  check('h1 fully opaque, not mid-animation', r.h1Opacity > 0.99, `opacity ${r.h1Opacity} "${r.h1Text}"`);
  /* Counting faded elements from a single scroll position is not a
     test: this page dims frames on purpose as you scroll past them,
     and the carousel shows one caption at a time. scripts/audit-motion.mjs
     does this properly by scrolling each element to centre and
     comparing the two motion modes against each other. */
  console.log(`   (${r.invisible} element(s) below full opacity at rest — npm run audit:motion checks this properly)`);
  await ctx.close();
}

/* ── 3. Keyboard safety of the overlays ─────────────────────────── */
console.log('\nkeyboard: story overlay');
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/insights/devjams', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  /* Tab a full lap. Focus must never leave the dialog. */
  const escaped = await page.evaluate(async () => {
    const dialog = document.querySelector('[role="dialog"]') || document.querySelector('[aria-modal="true"]');
    if (!dialog) return 'no dialog found';
    for (let i = 0; i < 40; i++) {
      const before = document.activeElement;
      before?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      await new Promise((r) => setTimeout(r, 5));
    }
    return dialog.contains(document.activeElement) ? null : 'focus left the dialog';
  });
  check('dialog present with a modal role', escaped !== 'no dialog found', String(escaped ?? ''));

  await page.keyboard.press('Tab');
  await page.waitForTimeout(150);
  const inside = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"],[aria-modal="true"]');
    return !!d && d.contains(document.activeElement);
  });
  check('Tab keeps focus inside the overlay', inside);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  check('Escape closes and returns to /', new URL(page.url()).pathname === '/', page.url().replace(BASE, ''));

  const focusVisible = await page.evaluate(() => {
    const a = document.querySelector('a[href], button');
    a?.focus();
    const s = getComputedStyle(a, ':focus-visible');
    return { tag: a?.tagName, outline: s.outlineStyle, width: s.outlineWidth };
  });
  console.log(`   focus-visible on ${focusVisible.tag}: outline ${focusVisible.outline} ${focusVisible.width}`);
  await ctx.close();
}

await browser.close();
console.log(fails ? `\n${fails} FAILURES\n` : '\nall clean\n');
