/* ─────────────────────────────────────────────────────────────────
   Certificate artwork — one frame, one scale, one margin.

   The scans arrive as whatever the issuer and the scanner produced.
   Measured across the set: ratios from 0.75 to 1.55, and — worse than
   the ratios — wildly different amounts of white baked in around the
   document itself. A LinkedIn certificate is a small card floating in
   a page of margin; an Unstop one bleeds to the edge; the NEC one is
   full-bleed artwork with no margin at all.

   The wall renders every one of them into the same 1.414 frame, so
   those two differences compound into a grid where no two documents
   are the same size and none of them line up. That is what "uneven
   placeholders" is: not the frames, which are identical, but the
   documents inside them.

   This normalises the artwork so the frame can stay dumb:

     1. Trim the surrounding white. Whatever margin the issuer or the
        scanner left is removed, so what remains is the document —
        the same thing in every file.
     2. Fit that into a fixed 1414x1000 canvas with one margin, the
        same on every certificate, centred.
     3. Write it back at the frame's exact ratio, so the card's
        `object-contain` has nothing left to do and nothing to crop.

   After this every thumbnail presents its document at the same scale
   inside the same frame, and a portrait document and a panoramic one
   both sit centred with the same air around them.

   Non-destructive in intent but not in fact: it overwrites the files
   in public/certificates. Re-running it is safe — a trimmed, padded
   file trims to the same bounds and pads to the same box — but each
   run is another webp encode, so do not run it in a loop.

   ── Running it ────────────────────────────────────────────────────
     npm i -D playwright-core       (once)
     node scripts/normalise-certificates.mjs
   ───────────────────────────────────────────────────────────────── */

import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'public', 'certificates');
const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';

/** The frame the wall and the lightbox both use. */
const FRAME_W = 1414;
const FRAME_H = 1000;
/** Margin on every side, as a fraction of the frame's height. The one
    number that makes the grid look deliberate — every document has
    exactly this much air around it and no more. */
const MARGIN = 0.045;
const QUALITY = 0.9;

/* Only the certificates the wall actually renders. Anything else in
   the folder is left alone rather than quietly rewritten. */
const SLUGS = [
  'iitropar-ai-major',
  'linkedin-microsoft-genai',
  'governai-internship',
  'vubs-appreciation',
  'layover-uiux-internship',
  'nec-2024-ecell-iitb',
  'linkedin-microsoft-career-essentials',
  'linkedin-programming-foundations',
  'bserc-iisc-drone-workshop',
  'sjmsom-prod-wars',
  'iitg-encode-udgam',
  'ey-manthana-round-two',
];

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
const seed = path.join(DIR, '__seed.html');
fs.writeFileSync(seed, '<!doctype html><title>seed</title>');
await page.goto('file:///' + seed.split('\\').join('/').split(' ').join('%20'));

let total = 0;
for (const slug of SLUGS) {
  const file = path.join(DIR, `${slug}.webp`);
  if (!fs.existsSync(file)) {
    console.log(`MISSING  ${slug}.webp`);
    continue;
  }
  const url = 'file:///' + file.split('\\').join('/').split(' ').join('%20');

  const r = await page.evaluate(
    async ({ u, fw, fh, margin, q }) => {
      const im = new Image();
      const ok = await new Promise((res) => {
        im.onload = () => res(true);
        im.onerror = () => res(false);
        im.src = u;
      });
      if (!ok) return { err: 'load failed' };

      const W = im.naturalWidth;
      const H = im.naturalHeight;
      const src = document.createElement('canvas');
      src.width = W;
      src.height = H;
      const sctx = src.getContext('2d', { willReadFrequently: true });
      sctx.drawImage(im, 0, 0);
      const data = sctx.getImageData(0, 0, W, H).data;

      /* "Ink" is anything that is not paper: dark, or coloured. A pure
         brightness test misses a pale blue letterhead on white, which
         is exactly the kind of edge these scans have. */
      const isInk = (i) => {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const min = Math.min(r, g, b);
        const max = Math.max(r, g, b);
        return min < 240 || max - min > 12;
      };

      /* A row counts as content only once enough of it is ink, so a
         speck of scanner noise in the margin does not defeat the trim. */
      const rowFloor = Math.max(2, Math.round(W * 0.004));
      const colFloor = Math.max(2, Math.round(H * 0.004));

      let top = 0;
      let bottom = H - 1;
      let left = 0;
      let right = W - 1;

      const rowInk = (y) => {
        let n = 0;
        for (let x = 0; x < W; x++) if (isInk((y * W + x) * 4) && ++n >= rowFloor) return true;
        return false;
      };
      const colInk = (x) => {
        let n = 0;
        for (let y = 0; y < H; y++) if (isInk((y * W + x) * 4) && ++n >= colFloor) return true;
        return false;
      };

      while (top < bottom && !rowInk(top)) top++;
      while (bottom > top && !rowInk(bottom)) bottom--;
      while (left < right && !colInk(left)) left++;
      while (right > left && !colInk(right)) right--;

      let sx = left;
      let sy = top;
      let sw = right - left + 1;
      let sh = bottom - top + 1;
      /* A document that trims to almost nothing means the test was
         wrong for this file, not that the file is blank. Fall back. */
      if (sw < W * 0.2 || sh < H * 0.2) {
        sx = 0;
        sy = 0;
        sw = W;
        sh = H;
      }

      const out = document.createElement('canvas');
      out.width = fw;
      out.height = fh;
      const octx = out.getContext('2d');
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, fw, fh);

      const pad = Math.round(fh * margin);
      const boxW = fw - pad * 2;
      const boxH = fh - pad * 2;
      const scale = Math.min(boxW / sw, boxH / sh);
      const dw = Math.round(sw * scale);
      const dh = Math.round(sh * scale);
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(im, sx, sy, sw, sh, Math.round((fw - dw) / 2), Math.round((fh - dh) / 2), dw, dh);

      try {
        return {
          d: out.toDataURL('image/webp', q),
          from: [W, H],
          trimmed: [sw, sh],
          placed: [dw, dh],
        };
      } catch (e) {
        return { err: 'toDataURL: ' + e.message };
      }
    },
    { u: url, fw: FRAME_W, fh: FRAME_H, margin: MARGIN, q: QUALITY },
  );

  if (r.err) {
    console.log(`FAILED   ${slug}: ${r.err}`);
    continue;
  }

  const buf = Buffer.from(r.d.split(',')[1], 'base64');
  fs.writeFileSync(file, buf);
  total += buf.length;

  const trimPct = Math.round((1 - (r.trimmed[0] * r.trimmed[1]) / (r.from[0] * r.from[1])) * 100);
  console.log(
    `${slug.padEnd(38)} ${String(r.from.join('x')).padEnd(10)} ` +
      `trim ${String(trimPct).padStart(2)}%  placed ${String(r.placed.join('x')).padEnd(9)} ` +
      `${(buf.length / 1024).toFixed(0).padStart(4)}KB`,
  );
}

fs.unlinkSync(seed);
console.log(
  `\n${SLUGS.length} certificates at ${FRAME_W}x${FRAME_H}, ${(total / 1024 / 1024).toFixed(2)} MB`,
);
await browser.close();
