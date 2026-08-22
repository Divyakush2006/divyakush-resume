/* Reduced motion, measured honestly.

   The naive version of this test reads every element's opacity from
   one scroll position and calls anything faded a bug. That is wrong
   twice over: this page deliberately dims frames as you scroll past
   them, so measuring from the bottom reports every section above as
   "hidden"; and several elements are set to a fractional opacity by
   design, which is styling, not a stuck animation.

   So: scroll each candidate into view, let it settle, and read it
   there. An element that reaches full opacity when it is the thing on
   screen is working. One that stays at zero while centred in the
   viewport is content a reduced-motion reader can never see. */
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';
const BASE = process.argv[2] || 'http://localhost:5188';

const browser = await chromium.launch({ executablePath: EXE });

for (const reduced of [true, false]) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  /* Candidates: text-bearing elements that carry real words. */
  const count = await page.evaluate(() => {
    window.__cands = [...document.querySelectorAll('h1,h2,h3,p,li')]
      .filter((e) => (e.textContent || '').trim().length > 12 && e.getClientRects().length);
    return window.__cands.length;
  });

  const stuck = [];
  for (let i = 0; i < count; i++) {
    const r = await page.evaluate(async (idx) => {
      const el = window.__cands[idx];
      if (!el || !el.getClientRects().length) return null;
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      await new Promise((res) => setTimeout(res, 260));
      const op = +getComputedStyle(el).opacity;
      /* An ancestor's opacity multiplies down; read the effective one. */
      let eff = 1;
      for (let n = el; n && n !== document.body; n = n.parentElement) eff *= +getComputedStyle(n).opacity;
      return {
        op, eff: +eff.toFixed(3),
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 54),
        tag: el.tagName,
      };
    }, i);
    if (r && r.eff < 0.5) stuck.push(r);
  }

  console.log(`\n${'─'.repeat(66)}\nprefers-reduced-motion: ${reduced ? 'reduce' : 'no-preference'}`);
  console.log(`${count} text elements checked, each scrolled to centre`);
  if (!stuck.length) console.log('  every one reaches readable opacity when it is on screen');
  for (const s of stuck) {
    console.log(`  STUCK ${s.tag.padEnd(4)} eff=${String(s.eff).padEnd(6)} "${s.text}"`);
  }
  await ctx.close();
}

await browser.close();
console.log('');
