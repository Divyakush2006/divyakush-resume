/* ─────────────────────────────────────────────────────────────────
   The last step of `npm run build`: check that the export is a site.

   Next reports that it generated twenty-seven pages and exits zero. It
   does not know that a route needs a canonical, that a canonical needs
   to match the sitemap, that a document with two <title> tags is a bug
   rather than a document, or that an inline script it just added is one
   the Content-Security-Policy has never heard of.

   None of these checks is clever. All of them have a corresponding
   incident: the site once served twenty-two URLs that all declared the
   home page as their canonical, and it did that for months without a
   single build failing.

   Exits non-zero on any failure, so a broken export cannot be deployed
   by a green build.
   ───────────────────────────────────────────────────────────────── */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');
const ORIGIN = 'https://www.divyakush.com';

const problems = [];
const fail = (msg) => problems.push(msg);

/* ── Segment payloads, at the URLs the client asks for ────────
   Next 16 prefetches a route by fetching its per-segment RSC
   payload. The export writes those payloads as nested directories:

     out/projects/netra/__next.projects/$d$slug/__PAGE__.txt

   and the client requests them with the segments joined by dots:

     /projects/netra/__next.projects.$d$slug.__PAGE__.txt

   On Vercel something in the serving layer reconciles the two. On a
   plain static host nothing does, so every prefetch 404s — which is
   how the site audit found this: thirty-three HIGH findings, all of
   them a hover over a project link.

   Nothing user-visible breaks when a prefetch fails; the payload is
   fetched again on click and the navigation completes a beat later.
   But a site that answers 404 to its own requests is a site nobody
   can read a log for, so the export gets a copy at the name that is
   actually requested.

   This is a shim against one framework version, so it fails loudly
   rather than silently: if the nested layout ever stops appearing,
   the assertion below says so instead of quietly doing nothing. */
function flattenSegmentPayloads(dir) {
  let written = 0;

  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (!entry.isDirectory()) continue;
      if (entry.name === '_next') continue;

      if (entry.name.startsWith('__next.')) {
        /* Everything under here is one payload per file, and the
           flattened name is the path to it with dots for slashes. */
        const collect = (nested, parts) => {
          for (const e of fs.readdirSync(nested, { withFileTypes: true })) {
            const p = path.join(nested, e.name);
            if (e.isDirectory()) collect(p, [...parts, e.name]);
            else if (e.name.endsWith('.txt')) {
              const flat = [entry.name, ...parts, e.name].join('.');
              const target = path.join(current, flat);
              if (!fs.existsSync(target)) {
                fs.copyFileSync(p, target);
                written++;
              }
            }
          }
        };
        collect(full, []);
        continue;
      }

      walk(full);
    }
  };

  walk(dir);
  return written;
}

const flattened = flattenSegmentPayloads(OUT);
if (flattened === 0) {
  fail('no segment payloads were flattened — has the export layout changed?');
}

/* ── The documents ────────────────────────────────────────────── */

/** Every .html in the export, as the URL path it answers. */
function documents(dir = OUT, base = '') {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_next') continue;
      found.push(...documents(full, `${base}/${entry.name}`));
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;
    const url =
      entry.name === 'index.html' ? `${base}/` : `${base}/${entry.name.replace(/\.html$/, '')}`;
    found.push({ url: url.replace(/^\/\//, '/'), file: full });
  }
  return found;
}

const all = documents();

/* `404.html` answers no URL of its own — Cloudflare serves it for
   anything with no document — and `_not-found.html` is the same page
   under the name Next gives it internally. Neither is a route.
   `google0dbb222546d95f4f.html` is a Search Console verification file
   that is deliberately not a page. */
const NOT_ROUTES = new Set(['/404', '/_not-found', '/google0dbb222546d95f4f']);
const routes = all.filter((d) => !NOT_ROUTES.has(d.url));

console.log(`\n${routes.length} routes + ${all.length - routes.length} non-route documents\n`);

/* ── Per document ─────────────────────────────────────────────── */

const KNOWN_INLINE = [
  /^\(self\.__next_f=self\.__next_f\|\|\[\]\)\.push\(\[0\]\)$/,
  /^self\.__next_f\.push\(\[/,
];

let heroPreloads = 0;

for (const doc of routes) {
  const html = fs.readFileSync(doc.file, 'utf8');
  const where = doc.url.padEnd(38);

  const count = (re) => (html.match(re) ?? []).length;

  const titles = count(/<title>/g);
  if (titles !== 1) fail(`${where} ${titles} <title> tags`);

  const canonicals = html.match(/<link rel="canonical" href="([^"]*)"/g) ?? [];
  if (canonicals.length !== 1) {
    fail(`${where} ${canonicals.length} canonical tags`);
  } else {
    const href = /href="([^"]*)"/.exec(canonicals[0])[1];
    const expected = doc.url === '/' ? `${ORIGIN}/` : `${ORIGIN}${doc.url}`;
    if (href !== expected) fail(`${where} canonical is ${href}, expected ${expected}`);
  }

  const ld = count(/<script type="application\/ld\+json"/g);
  if (ld !== 1) fail(`${where} ${ld} JSON-LD blocks`);
  else {
    const body = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/.exec(html)[1];
    try {
      const graph = JSON.parse(body.replace(/\\u003c/g, '<'))['@graph'];
      if (!Array.isArray(graph) || graph.length < 4) fail(`${where} JSON-LD @graph too small`);
    } catch (e) {
      fail(`${where} JSON-LD does not parse: ${e.message}`);
    }
  }

  if (!/<noscript>/.test(html)) fail(`${where} no <noscript> prose`);
  if (!/<meta name="description"/.test(html)) fail(`${where} no description`);

  /* Every executable inline script has to be one the CSP allows for.
     The policy is 'unsafe-inline' today precisely because the two below
     cannot be hashed per deploy — but a third one appearing is a change
     nobody decided, and it should stop the build until somebody does. */
  const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/g)];
  for (const [, attrs, body] of inline) {
    if (/type="application\/ld\+json"/.test(attrs)) continue;
    if (!KNOWN_INLINE.some((re) => re.test(body.trim()))) {
      fail(`${where} unrecognised inline script: ${body.trim().slice(0, 60)}`);
    }
  }

  /* The hero portrait is the LCP element on `/` and on every insight,
     which render the same page, and on nothing else. A preload on a
     project page would be a download of an image that page never
     paints. */
  const preloads = count(/<link rel="preload" as="image"/g);
  const rendersHome = doc.url === '/' || doc.url.startsWith('/insights/');
  if (rendersHome && preloads !== 1) fail(`${where} ${preloads} hero preloads, expected 1`);
  if (!rendersHome && preloads !== 0) fail(`${where} ${preloads} hero preloads, expected 0`);
  if (preloads) heroPreloads++;
}

/* ── The files that are not documents ─────────────────────────── */

for (const file of ['sitemap.xml', 'llms.txt', 'robots.txt', '_headers', '_redirects', '404.html', 'og-image.png', 'favicon.svg', 'ga.js']) {
  if (!fs.existsSync(path.join(OUT, file))) fail(`missing ${file}`);
}

/* The sitemap has to name every route and nothing else. A sitemap that
   disagrees with the canonicals is a contradiction, and the usual
   resolution is that both are ignored. */
if (fs.existsSync(path.join(OUT, 'sitemap.xml'))) {
  const xml = fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = routes.map((r) => (r.url === '/' ? `${ORIGIN}/` : `${ORIGIN}${r.url}`)).sort();
  const got = [...locs].sort();
  if (expected.length !== got.length) {
    fail(`sitemap has ${got.length} URLs, export has ${expected.length} routes`);
  } else {
    for (let i = 0; i < expected.length; i++) {
      if (expected[i] !== got[i]) fail(`sitemap: ${got[i]} does not match route ${expected[i]}`);
    }
  }
}

/* The 404 must say it is one. */
if (fs.existsSync(path.join(OUT, '404.html'))) {
  const html = fs.readFileSync(path.join(OUT, '404.html'), 'utf8');
  if (!/name="robots" content="noindex/.test(html)) fail('404.html is not noindex');
  if (/<link rel="canonical"/.test(html)) fail('404.html declares a canonical');
}

/* ── Report ───────────────────────────────────────────────────── */

const bytes = (p) => (fs.existsSync(p) ? fs.statSync(p).size : 0);
const chunks = path.join(OUT, '_next', 'static');
let jsBytes = 0;
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.js')) jsBytes += fs.statSync(full).size;
  }
};
walk(chunks);

console.log(`  documents      ${routes.length} routes, ${heroPreloads} carrying a hero preload`);
console.log(`  prefetch       ${flattened} segment payloads copied to their requested names`);
console.log(`  sitemap.xml    ${(bytes(path.join(OUT, 'sitemap.xml')) / 1024).toFixed(1)} KB`);
console.log(`  llms.txt       ${(bytes(path.join(OUT, 'llms.txt')) / 1024).toFixed(1)} KB`);
console.log(`  home document  ${(bytes(path.join(OUT, 'index.html')) / 1024).toFixed(1)} KB`);
console.log(`  javascript     ${(jsBytes / 1024).toFixed(0)} KB raw across all chunks`);

if (problems.length) {
  console.log(`\n${problems.length} problem(s):\n`);
  for (const p of problems) console.log('  ' + p);
  console.log('');
  process.exit(1);
}

console.log('\n  every document carries its own title, description, canonical,');
console.log('  JSON-LD and prose; the sitemap agrees with all of them.\n');
