/* ─────────────────────────────────────────────────────────────────
   The crawl the audit is built on.

   Every number in seo/01-BASELINE.md comes out of this script. It runs
   against a real server serving the real export, renders each page in
   Chromium the way Googlebot does, and records what is actually there
   — not what the source is supposed to produce.

     node scripts/seo-crawl.mjs http://localhost:5188

   Two passes per URL, deliberately:

     · raw     — the HTTP response, no JavaScript. This is what Bing,
                 the social unfurlers and most AI crawlers index, and
                 it is the pass that catches an SPA pretending to have
                 content.
     · render  — after the bundle runs. This is Googlebot's second
                 wave, and the gap between the two passes is the thing
                 worth knowing.

   Writes seo/crawl.json. Prints the findings table.
   ───────────────────────────────────────────────────────────────── */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';
const BASE = process.argv[2] || 'http://localhost:5188';

/* The URL set comes from the sitemap — if a page is not in there it is
   not claimed to be indexable, and if it is in there and broken that
   is itself the finding. */
const sitemap = fs.readFileSync(path.join(ROOT, 'out', 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
  m[1].replace('https://www.divyakush.com', ''),
);

const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean).length;

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const rows = [];
for (const u of urls) {
  /* ── raw ── */
  const res = await fetch(BASE + u);
  const html = await res.text();
  const pick = (re) => (html.match(re) || [])[1] ?? null;

  const raw = {
    status: res.status,
    title: pick(/<title>([\s\S]*?)<\/title>/),
    description: pick(/<meta name="description" content="([^"]*)"/),
    canonical: pick(/<link rel="canonical" href="([^"]*)"/),
    robots: pick(/<meta name="robots" content="([^"]*)"/),
    ogImage: pick(/<meta property="og:image" content="([^"]*)"/),
    titleCount: (html.match(/<title>/g) || []).length,
    canonicalCount: (html.match(/rel="canonical"/g) || []).length,
    jsonld: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
      (m) => m[1],
    ),
    noscriptWords: words(
      ((html.match(/<noscript>([\s\S]*?)<\/noscript>/) || [])[1] || '').replace(/<[^>]+>/g, ' '),
    ),
  };

  /* ── rendered ── */
  await page.goto(BASE + u, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const dom = await page.evaluate(() => {
    const h1s = [...document.querySelectorAll('h1')].map((h) => h.textContent.trim());
    const imgs = [...document.querySelectorAll('img')];
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) =>
      Number(h.tagName[1]),
    );
    let skips = 0;
    for (let i = 1; i < headings.length; i++) if (headings[i] - headings[i - 1] > 1) skips++;
    const links = [...document.querySelectorAll('a[href]')];
    return {
      h1s,
      h1Count: h1s.length,
      words: (document.body.innerText || '').trim().split(/\s+/).filter(Boolean).length,
      imgTotal: imgs.length,
      imgNoAlt: imgs.filter((i) => i.getAttribute('alt') === null).length,
      headingSkips: skips,
      internal: links.filter((a) => a.getAttribute('href')?.startsWith('/')).length,
      external: links.filter((a) => /^https?:/.test(a.getAttribute('href') || '')).length,
      lang: document.documentElement.lang,
      hasMain: !!document.querySelector('main'),
      hasBreadcrumbNav: !!document.querySelector('nav[aria-label*="readcrumb" i], .breadcrumb'),
    };
  });

  /* ── field-ish vitals, lab-measured ── */
  const vitals = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const out = { lcp: null, cls: 0 };
        try {
          new PerformanceObserver((l) => {
            const e = l.getEntries();
            out.lcp = Math.round(e[e.length - 1].startTime);
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver((l) => {
            for (const e of l.getEntries()) if (!e.hadRecentInput) out.cls += e.value;
          }).observe({ type: 'layout-shift', buffered: true });
        } catch {
          /* older engines */
        }
        const nav = performance.getEntriesByType('navigation')[0];
        out.ttfb = nav ? Math.round(nav.responseStart) : null;
        setTimeout(() => resolve({ ...out, cls: +out.cls.toFixed(4) }), 900);
      }),
  );

  /* ── schema integrity ── */
  let schema = { blocks: raw.jsonld.length, valid: true, types: [], ids: [], danglingRefs: [] };
  try {
    const nodes = raw.jsonld.flatMap((b) => {
      const parsed = JSON.parse(b);
      return parsed['@graph'] ?? [parsed];
    });
    schema.types = nodes.map((n) => n['@type']);
    schema.ids = nodes.map((n) => n['@id']).filter(Boolean);
    const refs = [];
    const walk = (v) => {
      if (Array.isArray(v)) return v.forEach(walk);
      if (v && typeof v === 'object') {
        const keys = Object.keys(v);
        if (keys.length === 1 && keys[0] === '@id') refs.push(v['@id']);
        else Object.values(v).forEach(walk);
      }
    };
    walk(nodes);
    schema.danglingRefs = [...new Set(refs)].filter((r) => !schema.ids.includes(r));
  } catch (e) {
    schema.valid = false;
    schema.error = e.message;
  }

  rows.push({ url: u, raw, dom, vitals, schema });
  process.stdout.write('.');
}

/* A 404 has to actually be a 404. */
const missing = await fetch(BASE + '/definitely-not-a-page');
const missingStatus = missing.status;

await browser.close();
fs.writeFileSync(
  path.join(ROOT, 'seo', 'crawl.json'),
  JSON.stringify({ base: BASE, when: new Date().toISOString(), missingStatus, rows }, null, 2),
);

/* ── report ── */
console.log('\n');
const titles = new Set();
const descs = new Set();
const findings = [];

console.log('URL'.padEnd(36), 'ST'.padEnd(4), 'H1'.padEnd(3), 'RAW'.padEnd(5), 'REN'.padEnd(6), 'LCP'.padEnd(6), 'CLS'.padEnd(7), 'SCHEMA');
for (const r of rows) {
  const dup = titles.has(r.raw.title);
  titles.add(r.raw.title);
  descs.add(r.raw.description);
  console.log(
    r.url.padEnd(36),
    String(r.raw.status).padEnd(4),
    String(r.dom.h1Count).padEnd(3),
    String(r.raw.noscriptWords).padEnd(5),
    String(r.dom.words).padEnd(6),
    String(r.vitals.lcp ?? '-').padEnd(6),
    String(r.vitals.cls).padEnd(7),
    r.schema.types.join('+'),
  );

  if (dup) findings.push(`DUPLICATE TITLE   ${r.url}`);
  if (r.dom.h1Count !== 1) findings.push(`H1 COUNT ${r.dom.h1Count}       ${r.url}`);
  if (r.raw.titleCount !== 1) findings.push(`TITLE TAGS ${r.raw.titleCount}     ${r.url}`);
  if (r.raw.canonicalCount !== 1) findings.push(`CANONICALS ${r.raw.canonicalCount}     ${r.url}`);
  if (!r.raw.canonical?.endsWith(r.url === '/' ? '/' : r.url))
    findings.push(`CANONICAL MISMATCH ${r.url} -> ${r.raw.canonical}`);
  if (!r.raw.description) findings.push(`NO DESCRIPTION    ${r.url}`);
  if ((r.raw.description || '').length > 165) findings.push(`DESCRIPTION LONG (${r.raw.description.length}) ${r.url}`);
  if ((r.raw.title || '').length > 65) findings.push(`TITLE LONG (${r.raw.title.length})  ${r.url}`);
  if (r.dom.imgNoAlt) findings.push(`IMG WITHOUT ALT ${r.dom.imgNoAlt}  ${r.url}`);
  if (r.dom.headingSkips) findings.push(`HEADING SKIPS ${r.dom.headingSkips}   ${r.url}`);
  if (!r.schema.valid) findings.push(`SCHEMA INVALID    ${r.url}: ${r.schema.error}`);
  if (r.schema.danglingRefs.length)
    findings.push(`DANGLING @id      ${r.url}: ${r.schema.danglingRefs.join(', ')}`);
  /* ProfilePage, AboutPage, CollectionPage and friends are WebPage
     subtypes and satisfy the requirement — the home page is correctly
     a ProfilePage, not a bare WebPage. */
  const PAGE_TYPES = ['WebPage', 'ProfilePage', 'AboutPage', 'ContactPage', 'CollectionPage', 'ItemPage'];
  if (!r.schema.types.some((t) => PAGE_TYPES.includes(t)))
    findings.push(`NO WebPage NODE   ${r.url}`);
  /* Only project pages render a visible trail, so only they may claim
     one. Insight routes are an overlay over the home page and show no
     breadcrumb; marking one up there would be structured data with no
     on-page counterpart. */
  if (!r.schema.types.includes('BreadcrumbList') && r.url.startsWith('/projects/'))
    findings.push(`NO BreadcrumbList ${r.url}`);
  if (!r.dom.hasMain) findings.push(`NO <main>         ${r.url}`);
  if (r.vitals.cls > 0.05) findings.push(`CLS ${r.vitals.cls}        ${r.url}`);
  if (r.vitals.lcp > 2500) findings.push(`LCP ${r.vitals.lcp}ms       ${r.url}`);
}

console.log(`\nunique titles ${titles.size}/${rows.length}   unique descriptions ${descs.size}/${rows.length}`);
console.log(`404 for an unknown path: ${missingStatus}${missingStatus === 404 ? '' : '   <-- soft 404'}`);
console.log(`\n${findings.length} findings\n`);
const counted = {};
for (const f of findings) {
  const k = f.split(/\s{2,}/)[0];
  counted[k] = (counted[k] || 0) + 1;
}
for (const [k, n] of Object.entries(counted).sort((a, b) => b[1] - a[1]))
  console.log(`  ${String(n).padStart(3)} x  ${k}`);

/* A non-zero exit, so this is a gate and not a report somebody reads
   once. Wire it into CI and the architecture cannot be undone quietly. */
if (missingStatus !== 404) {
  console.log('\n  soft 404: an unknown path did not return 404');
  process.exit(1);
}
process.exit(findings.length ? 1 : 0);
