/* Every raster fallback, fetched over HTTP and decoded.

   This is the one part of the image pipeline that no browser test can
   reach. A WebP-capable browser picks the <source> and never requests
   the JPEG, so a fallback that is missing, truncated, or served with
   the wrong content type passes every other check on this project and
   surfaces for the first time on somebody's Safari 13.

   Run against a built export with `npm run serve` already listening. */
import sharp from 'sharp';
import { readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:5188';
const OUT = process.argv[3] || 'out';

/* Discovered by walking the export rather than from a list written by
   another script, so this can be run on its own and cannot fall out of
   step with what was actually built.

   It walks rather than reading three named directories, which is what
   it used to do. Those names were Vite's — `assets` for anything a
   module imported — and after the port to Next the same images live
   under `_next/static/media`. The audit went on checking a directory
   that no longer existed and reported every bundled fallback as a 404.
   A path that encodes one bundler's layout is a check with a shelf
   life; the file's own extension is not. */
const targets = [];
const walk = (dir) => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(jpg|png)$/i.test(entry.name)) continue;
    /* The share card is not a fallback for anything — it is the
       1200x630 image that unfurls on LinkedIn and Slack. */
    if (/^og-image/.test(entry.name)) continue;
    targets.push('/' + relative(OUT, full).split(sep).join('/'));
  }
};
walk(OUT);

if (!targets.length) {
  console.error(`no fallback files found in ${OUT}/ — run \`npm run build\` first`);
  process.exit(1);
}

let bad = 0;
let bytes = 0;

for (const url of targets) {
  try {
    const res = await fetch(BASE + url);
    if (!res.ok) { console.log(`  FAIL ${res.status}                    ${url}`); bad++; continue; }

    const type = res.headers.get('content-type') || '';
    const buf = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(buf).metadata();
    bytes += buf.length;

    const want = url.endsWith('.png') ? 'png' : 'jpeg';
    if (meta.format !== want) { console.log(`  FAIL format ${meta.format} (want ${want})  ${url}`); bad++; }
    else if (!type.startsWith('image/')) { console.log(`  FAIL content-type ${type}  ${url}`); bad++; }
    else if (!meta.width || !meta.height) { console.log(`  FAIL no dimensions        ${url}`); bad++; }
  } catch (e) {
    console.log(`  FAIL ${e.message}  ${url}`);
    bad++;
  }
}

console.log(`\n${targets.length} fallbacks checked, ${(bytes / 1048576).toFixed(1)} MB`);
console.log(bad ? `${bad} BROKEN\n` : 'every fallback fetches, decodes, and is typed correctly\n');
process.exit(bad ? 1 : 0);
