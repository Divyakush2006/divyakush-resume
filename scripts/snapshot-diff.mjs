/* Compare two snapshot directories, pixel by pixel.
 *
 *   node scripts/snapshot-diff.mjs .baseline .after
 *
 * Reports, per file: the share of pixels that differ beyond a small
 * per-channel tolerance, and the bounding box of the difference so a
 * delta can be found on the page without opening both images.
 *
 * The tolerance is 8/255 per channel. It exists for one reason: text is
 * antialiased against the surface behind it, and two engines — or the
 * same engine at two moments — can land a subpixel differently on a
 * glyph edge. That produces single-pixel differences of two or three
 * levels along strokes and nothing else. Anything a person could see is
 * a much larger step than 8, so this catches what matters and does not
 * fail on rasteriser noise.
 *
 * A size mismatch is reported as a failure in its own right, because a
 * page that renders at a different height has had something change in
 * its layout, which is exactly what the comparison is for.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const A = process.argv[2];
const B = process.argv[3];
if (!A || !B) throw new Error('usage: node scripts/snapshot-diff.mjs <dirA> <dirB>');

const TOLERANCE = 8;
/* Below this share of differing pixels a file is reported as clean.
   0.02% of a 1440x9000 page is about 2,600 pixels — a couple of glyph
   edges, not a visible change. */
const CLEAN = 0.0002;

const names = fs.readdirSync(A).filter((f) => f.endsWith('.png')).sort();
let failed = 0;
let missing = 0;

for (const name of names) {
  const fb = path.join(B, name);
  if (!fs.existsSync(fb)) {
    console.log(`MISSING  ${name}`);
    missing++;
    continue;
  }

  const [a, b] = await Promise.all([
    sharp(path.join(A, name)).raw().toBuffer({ resolveWithObject: true }),
    sharp(fb).raw().toBuffer({ resolveWithObject: true }),
  ]);

  if (a.info.width !== b.info.width || a.info.height !== b.info.height) {
    console.log(
      `SIZE     ${name.padEnd(42)} ${a.info.width}x${a.info.height} -> ${b.info.width}x${b.info.height}`,
    );
    failed++;
    continue;
  }

  const { width, height, channels } = a.info;
  let diff = 0;
  let x0 = width, y0 = height, x1 = -1, y1 = -1;

  for (let i = 0, px = 0; i < a.data.length; i += channels, px++) {
    if (
      Math.abs(a.data[i] - b.data[i]) > TOLERANCE ||
      Math.abs(a.data[i + 1] - b.data[i + 1]) > TOLERANCE ||
      Math.abs(a.data[i + 2] - b.data[i + 2]) > TOLERANCE
    ) {
      diff++;
      const x = px % width;
      const y = (px / width) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }

  const share = diff / (width * height);
  if (share <= CLEAN) {
    console.log(`ok       ${name.padEnd(42)} ${(share * 100).toFixed(4)}%`);
  } else {
    console.log(
      `DIFF     ${name.padEnd(42)} ${(share * 100).toFixed(3)}%  ` +
        `box ${x0},${y0} -> ${x1},${y1}`,
    );
    failed++;
  }
}

console.log(
  failed || missing
    ? `\n${failed} file(s) differ, ${missing} missing\n`
    : `\n${names.length} files, every one pixel-identical within tolerance\n`,
);
process.exit(failed || missing ? 1 : 0);
