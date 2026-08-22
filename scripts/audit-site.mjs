/* Full-site audit: correctness, accessibility, console health, the
   real Content-Security-Policy, and responsive integrity.

   The CSP is read out of public/_headers and injected onto every HTML
   response, so what is being tested is the policy that will actually
   ship — not an approximation of it. Cloudflare applies _headers in
   production; the static test server does not, so it is done here. */
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';
const BASE = process.argv[2] || 'http://localhost:5188';

const CSP = readFileSync('public/_headers', 'utf8')
  .split('\n')
  .find((l) => l.trim().startsWith('Content-Security-Policy:'))
  .split('Content-Security-Policy:')[1]
  .trim();

const SLUGS = [
  'saturdays', 'dineguru', 'governai-research-atlas', 'governai-studio',
  'content-recommendation-engine', 'rockfall-prediction', 'netra', 'algoverse',
  'smart-home-automation', 'adaptive-traffic-controller',
];
const PAGES = ['/', '/insights/devjams', '/nope-404', ...SLUGS.map((s) => `/projects/${s}`)];

const findings = [];
const add = (sev, page, area, msg) => findings.push({ sev, page, area, msg });

const browser = await chromium.launch({ executablePath: EXE });

for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
  for (const path of PAGES) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700,
    });
    const page = await ctx.newPage();
    const where = `${path} @${tag}`;

    page.on('console', (m) => {
      const t = m.text();
      if (m.type() === 'error') {
        if (/Content Security Policy|Refused to/i.test(t)) add('HIGH', where, 'csp', t.slice(0, 160));
        else if (!/favicon|hero\.mp4|status of 404/i.test(t)) add('HIGH', where, 'console', t.slice(0, 160));
      } else if (m.type() === 'warning' && !/DevTools|Download the React/i.test(t)) {
        add('LOW', where, 'warn', t.slice(0, 140));
      }
    });
    page.on('pageerror', (e) => add('HIGH', where, 'exception', e.message.slice(0, 160)));
    page.on('response', (r) => {
      /* hero.mp4 is probed deliberately by useFileExists; a 404 there
         is the feature working, not a fault. */
      const expected404 = path === '/nope-404' && r.url().endsWith('/nope-404');
      if (r.status() >= 400 && !r.url().includes('hero.mp4') && !expected404) {
        add('HIGH', where, 'http', `${r.status()} ${r.url().replace(BASE, '')}`);
      }
    });

    /* Inject the shipping CSP onto documents. */
    await page.route('**/*', async (route) => {
      try {
        const res = await route.fetch();
        const headers = { ...res.headers() };
        if ((headers['content-type'] || '').includes('text/html')) {
          headers['content-security-policy'] = CSP;
        }
        await route.fulfill({ response: res, headers });
      } catch {
        await route.continue();
      }
    });

    await page.goto(BASE + path, { waitUntil: 'networkidle' }).catch(() => {});
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 80));
      }
      scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.waitForTimeout(1500);

    const r = await page.evaluate(() => {
      const labelText = (el) => {
        if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return '';
        const byFor = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null;
        return (byFor?.textContent || el.closest('label')?.textContent || '').trim();
      };

      const name = (el) => (
        el.getAttribute('aria-label')
        || labelText(el)
        || (el.getAttribute('aria-labelledby') || '').split(/\s+/)
          .map((i) => document.getElementById(i)?.textContent || '').join(' ')
        || el.textContent
        || el.getAttribute('title')
        || [...el.querySelectorAll('img')].map((i) => i.getAttribute('alt') || '').join(' ')
      ).trim();

      const vis = (el) => {
        const s = getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0;
      };

      /* Deliberately removed from the accessibility tree — a honeypot
         field, a decorative duplicate link. Judging these by a11y rules
         reports the mechanism as the fault. */
      const exposed = (el) => vis(el) && !el.closest('[aria-hidden="true"]');

      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis);
      const levels = hs.map((x) => +x.tagName[1]);
      const skips = [];
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] > levels[i - 1] + 1) {
          skips.push(`${hs[i - 1].tagName}->${hs[i].tagName} "${hs[i].textContent.trim().slice(0, 40)}"`);
        }
      }

      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
      const dupIds = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];

      const interactive = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(exposed);

      const nameless = interactive
        .filter((el) => !name(el) && el.type !== 'hidden')
        .map((el) => `${el.tagName}${el.className ? '.' + String(el.className).split(' ')[0] : ''}`);

      const small = interactive
        .filter((el) => {
          const b = el.getBoundingClientRect();
          return b.width > 0 && b.height > 0 && (b.height < 24 || b.width < 24);
        })
        .map((el) => {
          const b = el.getBoundingClientRect();
          return `${el.tagName} ${Math.round(b.width)}x${Math.round(b.height)} "${name(el).slice(0, 28)}"`;
        });

      const inputs = [...document.querySelectorAll('input,textarea,select')].filter(exposed)
        .filter((el) => !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')
          && !(el.id && document.querySelector(`label[for="${el.id}"]`)) && !el.closest('label'))
        .map((el) => `${el.tagName}[name=${el.name || '?'}]`);

      const hiddenFocusable = [...document.querySelectorAll('[aria-hidden="true"]')]
        .flatMap((c) => [...c.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')])
        .filter((el) => vis(el) && el.tabIndex >= 0)
        .map((el) => `${el.tagName} "${name(el).slice(0, 28)}"`);

      const positiveTab = [...document.querySelectorAll('[tabindex]')]
        .filter((el) => +el.getAttribute('tabindex') > 0).length;

      const deadAnchors = [...document.querySelectorAll('a[href^="#"]')]
        .map((a) => a.getAttribute('href').slice(1))
        .filter((id) => id && !document.getElementById(id));

      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        h1: hs.filter((x) => x.tagName === 'H1').length,
        skips,
        dupIds,
        nameless: [...new Set(nameless)],
        small: [...new Set(small)],
        inputs,
        hiddenFocusable: [...new Set(hiddenFocusable)],
        positiveTab,
        deadAnchors: [...new Set(deadAnchors)],
        lang: document.documentElement.lang,
        main: document.querySelectorAll('main').length,
      };
    });

    if (r.overflow > 1) add('HIGH', where, 'layout', `horizontal overflow ${r.overflow}px`);
    if (r.h1 !== 1) add('MED', where, 'a11y', `${r.h1} visible <h1> (want exactly 1)`);
    if (r.skips.length) add('MED', where, 'a11y', `heading level skipped: ${r.skips.slice(0, 2).join('; ')}`);
    if (r.dupIds.length) add('MED', where, 'a11y', `duplicate id: ${r.dupIds.slice(0, 4).join(', ')}`);
    if (r.nameless.length) add('HIGH', where, 'a11y', `no accessible name: ${r.nameless.slice(0, 4).join(', ')}`);
    if (r.inputs.length) add('HIGH', where, 'a11y', `unlabelled field: ${r.inputs.join(', ')}`);
    if (r.hiddenFocusable.length) add('MED', where, 'a11y', `focusable inside aria-hidden: ${r.hiddenFocusable.slice(0, 3).join(', ')}`);
    if (r.positiveTab) add('MED', where, 'a11y', `${r.positiveTab} element(s) with positive tabindex`);
    if (r.deadAnchors.length) add('MED', where, 'links', `anchor to missing id: ${r.deadAnchors.join(', ')}`);
    if (!r.lang) add('MED', where, 'a11y', 'no lang on <html>');
    if (r.main !== 1 && path !== '/nope-404') add('LOW', where, 'a11y', `${r.main} <main> landmarks`);
    if (tag === 'mobile' && r.small.length) add('MED', where, 'a11y', `target under 24px: ${r.small.slice(0, 3).join(' | ')}`);

    await ctx.close();
  }
}
await browser.close();

const order = { HIGH: 0, MED: 1, LOW: 2 };
findings.sort((a, b) => order[a.sev] - order[b.sev] || a.area.localeCompare(b.area));

/* Collapse the same finding seen on many pages into one line. */
const grouped = new Map();
for (const f of findings) {
  const k = `${f.sev}|${f.area}|${f.msg}`;
  if (!grouped.has(k)) grouped.set(k, { ...f, pages: [] });
  grouped.get(k).pages.push(f.page);
}

console.log(`\n${'='.repeat(78)}\nAUDIT — ${PAGES.length} routes x 2 viewports\n${'='.repeat(78)}`);
if (!grouped.size) console.log('\nno findings\n');
for (const g of grouped.values()) {
  const n = g.pages.length;
  console.log(`\n[${g.sev}] ${g.area}: ${g.msg}`);
  console.log(`        ${n > 3 ? `${n} pages, e.g. ${g.pages.slice(0, 3).join(', ')}` : g.pages.join(', ')}`);
}
const highs = [...grouped.values()].filter((g) => g.sev === 'HIGH').length;
console.log(`\n${'='.repeat(78)}\n${grouped.size} distinct findings (${highs} high)\n`);
