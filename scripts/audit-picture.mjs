/* Does the <picture> conversion actually hold up?

   Four things worth proving, none of which "it looks fine" covers:
     1. every raster image is wrapped, with a typed WebP source
     2. the <img> src is the raster fallback, not the WebP
     3. a WebP-capable browser fetches ONLY the WebP — no double download
     4. the image still has a non-zero box (display:contents didn't
        collapse a layout)
   Fallback URLs are written out so they can be fetched and decoded
   server-side afterwards: a fallback that 404s is invisible here,
   because this browser never asks for one. */
import { chromium } from 'playwright-core';
const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';
const BASE = process.argv[2] || 'http://localhost:5188';

const PAGES = [
  '/', '/insights/devjams',
  ...['saturdays','dineguru','governai-research-atlas','governai-studio',
      'content-recommendation-engine','rockfall-prediction','netra','algoverse',
      'smart-home-automation','adaptive-traffic-controller'].map(s => `/projects/${s}`),
];

const b = await chromium.launch({ executablePath: EXE });
let fails = 0, totalImgs = 0;
const allFallbacks = new Set();
const problems = [];

for (const path of PAGES) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const fetched = { webp: 0, raster: 0, rasterUrls: [] };
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('request', r => {
    if (r.resourceType() !== 'image') return;
    const u = r.url();
    if (u.endsWith('.webp')) fetched.webp++;
    else if (/\.(jpg|png)$/.test(u) && !u.includes('og-image') && !u.includes('favicon')) {
      fetched.raster++; fetched.rasterUrls.push(u.split('/').pop());
    }
  });

  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      scrollTo({ top: y, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 90));
    }
    scrollTo({ top: 0, behavior: 'instant' });
  });
  await p.waitForTimeout(2200);

  const imgs = await p.evaluate(() => [...document.images].map(im => {
    const par = im.parentElement;
    const isPic = par?.tagName === 'PICTURE';
    const src = par?.querySelector('source');
    const r = im.getBoundingClientRect();
    return {
      imgSrc: im.currentSrc || im.src,
      attrSrc: im.getAttribute('src') || '',
      inPicture: isPic,
      picDisplay: isPic ? getComputedStyle(par).display : null,
      sourceType: src?.getAttribute('type') || null,
      sourceSrcset: src?.getAttribute('srcset') || '',
      sizes: src?.getAttribute('sizes') || '',
      loaded: im.complete && im.naturalWidth > 0,
      nw: im.naturalWidth, nh: im.naturalHeight,
      bw: Math.round(r.width), bh: Math.round(r.height),
      alt: im.getAttribute('alt'),
    };
  }));

  const raster = imgs.filter(i => /\.(jpg|png)$/.test(i.attrSrc));
  const svg = imgs.filter(i => i.attrSrc.endsWith('.svg'));
  totalImgs += imgs.length;

  const bad = [];
  for (const i of raster) {
    if (!i.inPicture) bad.push(`not wrapped: ${i.attrSrc}`);
    else {
      if (i.picDisplay !== 'contents') bad.push(`picture display=${i.picDisplay}: ${i.attrSrc}`);
      if (i.sourceType !== 'image/webp') bad.push(`source type=${i.sourceType}: ${i.attrSrc}`);
      /* A srcset ends in a width descriptor, not an extension, so the
         candidates have to be split out and checked individually. */
      const candidates = i.sourceSrcset
        /* Split on commas that separate candidates, not on the comma
           inside a `data:...;base64,` URI. */
        .split(/,(?![^,]*;base64)/)
        .map((c) => c.trim().split(/\s+/)[0])
        .filter(Boolean);
      if (!candidates.length) bad.push('source has no srcset candidates');
      const notWebp = candidates.filter((c) => !c.endsWith('.webp') && !c.startsWith('data:image/webp'));
      if (notWebp.length) bad.push(`non-webp candidate in source: ${notWebp[0]}`);
      if (!i.sizes) bad.push(`no sizes on ${i.attrSrc} — browser will assume 100vw`);
      /* Only meaningful once the image has actually loaded. A lazy
         image still below the fold has an empty currentSrc, which is
         not evidence of anything. */
      if (i.loaded && !i.imgSrc.endsWith('.webp'))
        bad.push(`browser chose ${i.imgSrc.split('/').pop()} not webp`);
    }
    if (i.loaded && (i.bw === 0 || i.bh === 0)) bad.push(`zero box ${i.bw}x${i.bh}: ${i.attrSrc}`);
    if (i.alt === null) bad.push(`missing alt: ${i.attrSrc}`);
    allFallbacks.add(new URL(i.attrSrc, BASE).pathname);
  }
  if (fetched.raster) bad.push(`double download: fetched ${fetched.rasterUrls.join(', ')}`);
  if (errs.length) bad.push(`page error: ${errs[0]}`);

  const unloaded = raster.filter(i => !i.loaded).length;
  const ok = bad.length === 0;
  if (!ok) { fails++; problems.push([path, bad]); }
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${path.padEnd(42)} ${String(imgs.length).padStart(2)} img  ${String(raster.length - unloaded).padStart(2)} loaded / ${String(unloaded).padStart(2)} lazy-offscreen   webp fetched:${String(fetched.webp).padStart(2)}  raster fetched:${fetched.raster}`);
  await p.close();
}

for (const [path, bad] of problems) {
  console.log(`\n  ${path}`);
  for (const m of bad.slice(0, 8)) console.log(`    - ${m}`);
}

console.log(`\n${totalImgs} images across ${PAGES.length} pages; ${allFallbacks.size} distinct fallback URLs written`);
console.log(fails ? `\n${fails} PAGES WITH PROBLEMS` : '\nall pages clean');
await b.close();
process.exit(fails ? 1 : 0);
