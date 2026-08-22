/* ─────────────────────────────────────────────────────────────────
   Insight photographs — source of truth for how each one is framed.

   The originals in `images/` are phone camera rolls: 0.56 to 1.61,
   with dead road, ceiling and wall around the subject. The carousel
   card is a fixed box — 0.86 on a phone, 1.46 on a desktop — and it
   shows the whole photograph, never cropped in the browser, hung from
   the top of the card. So the crop is the whole of the art direction,
   and it is recorded here rather than done by hand in an editor: it
   can be reviewed, argued with and re-run.

   ── What the card does with what it is given ──────────────────────
   The photograph keeps its own ratio and is fitted inside the card,
   so it can fall short in one of two ways, and the card answers each
   differently:

     · Narrower than the card — a column left either side. That gets a
       mirror: the picture reflected about the edge it sits against,
       blurred, so its content runs continuously out of the frame.
     · Shorter than the card — a strip left along the bottom, because
       the picture hangs from the top. Nothing fills it. That strip is
       where the caption sits, and the caption's scrim is the only
       thing over it.

   Fill goes where a picture falls short and nowhere else. No blurred
   copy behind the whole card, nothing on an edge already flush.

   ── The rule ──────────────────────────────────────────────────────
   The crop follows the subject. Three things it must respect:

     · Every face in the frame, whole. Never cut a head, and never cut
       a standing figure at the knee. A letterboxed photograph reads
       as a choice; a decapitated one reads as a mistake, and it is
       the first thing anyone sees.
     · Subject high in the frame. The bottom of the card carries the
       type, so what sits low gets a wash of ink over it. Compose so
       that what is low is ground, floor or wall.
     · Remove dead space, and stay at or above about 0.9. Empty road,
       ceiling and sky are what make a picture look small in the card
       — not the card. Below 0.9 the photograph becomes a strip down
       the middle of a desktop card whatever is in it.

   Chasing one target ratio is what produces bad crops. There isn't
   one: the card is 0.86 on a phone and 1.46 on a desktop, and the
   mirrors exist precisely so the crop does not have to lie about the
   subject to fit either.

   ── Running it ────────────────────────────────────────────────────
   This is a one-off asset tool, not part of the build, so its one
   dependency is deliberately not in package.json:

     npm i -D playwright-core       (once)
     node scripts/crop-insight-photos.mjs

   Chromium's canvas does the resampling and the webp encode. The
   alternative is a native image library in the dependency tree for a
   script that runs when photographs change and never otherwise.

   ── The crops ─────────────────────────────────────────────────────
   `crop` is {x, y, w, h} in fractions of the source, so the numbers
   survive the originals being re-exported at another size. Each one
   says what it is protecting and what it is removing. Where a picture
   is already well framed the crop is absent and the file is used
   whole — a crop that changes nothing is a crop that can drift.

   ── Running it ────────────────────────────────────────────────────
   This is a one-off asset tool, not part of the build, so its one
   dependency is deliberately not in package.json:

     npm i -D playwright-core       (once)
     node scripts/crop-insight-photos.mjs

   Chromium's canvas does the resampling and the webp encode. The
   alternative is a native image library in the dependency tree for a
   script that runs when photographs change and never otherwise.
   ───────────────────────────────────────────────────────────────── */

import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'images');
const OUT_DIR = path.join(ROOT, 'public', 'insights');
const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';

/** Long edge cap. The card is at most 760 CSS px wide, so 1600 covers
    a 2x display and the defocused copies behind it with room over. */
const MAX_EDGE = 1600;
const QUALITY = 0.84;

const PHOTOS = [
  {
    slug: 'nec-iit-bombay',
    src: '1.jpg', // 646x582, 1.11
    note: 'Already 1.11 and tight on the presentation, the laptop and the two heads in the foreground. Used whole.',
  },
  {
    slug: 'nec-visionary-ventures',
    src: '2.jpg', // 1280x960, 1.33
    crop: { x: 0.1, y: 0.05, w: 0.9, h: 0.95 },
    note: 'Pillar and ceiling off the left and top; the seated row is the picture. 1.26.',
  },
  {
    slug: 'devjams',
    src: '12.jpeg', // 1280x795, 1.61
    crop: { x: 0.06, y: 0, w: 0.905, h: 1 },
    note: 'A 1.61 panorama, wider than the card at any breakpoint. Trimmed to 1.46 off the left, where there is only wall — the three faces run from 0.09 to 0.95 and are untouched.',
  },
  {
    slug: 'iit-ropar-major',
    src: '7.jpeg', // 720x1280, 0.56
    crop: { x: 0, y: 0.32, w: 1, h: 0.34 },
    wide: true,
    note:
      "The subject is the sign wall, and the first crop — canopy down " +
      "to the kerb, 1.28 — landed it at 54% to 68% of the frame, which " +
      "is exactly where the caption scrim sits: the institute's name was " +
      "being read through the title. Fixed by taking more off the top " +
      "and adding road at the bottom. The canopy is cut to a band, the " +
      "wall and the figure beside it move to 21%-47%, and the last fifth " +
      "of the frame is empty road — which is what the caption should be " +
      "landing on. It also widens the frame to 1.65, past the 1.46 of a " +
      "desktop card, so the picture is fitted by width and leaves real " +
      "empty card beneath it rather than relying on the scrim alone.",
  },
  {
    slug: 'electroutsav',
    src: '5.jpeg', // 1600x1200, 1.33
    crop: { x: 0, y: 0.04, w: 0.78, h: 0.94 },
    note: 'The right quarter is bare window and wall. Cut to the group and the benches. 1.11.',
  },
  {
    slug: 'smart-india-hack',
    src: '4.jpg', // 1280x960, 1.33
    crop: { x: 0.06, y: 0.02, w: 0.91, h: 0.98 },
    note: 'Light trim of grass and sky around the five of them. 1.24.',
  },
  {
    slug: 'first-internship',
    src: '3.jpg', // 800x1066, 0.75
    crop: { x: 0, y: 0.34, w: 1, h: 0.63 },
    note:
      "Two rows: eight standing, three crouched in front of them. The " +
      "first crop took the top of the frame \u2014 sky, trees, the standing " +
      "row \u2014 and ended at the crouched row's shoulders, which put three " +
      "faces at 75% of the card height, directly under the caption. The " +
      "fix is not to move the caption but to change what the frame " +
      "contains: drop the empty night sky above the tallest head, and " +
      "take the pavement below the front row instead. Same people, " +
      "nobody cut, and the crouched faces move from 75% of the frame to " +
      "35% \u2014 well clear of the scrim, with the ground they are sitting " +
      "on left as the surface the type lands on. 1.19.",
  },
  {
    slug: 'submissions-closed',
    src: '9.jpeg', // 1280x960, 1.33
    note: 'Five faces corner to corner, with the lab door and its sign behind them — which is the context, so nothing is trimmed. Used whole.',
  },
  {
    slug: 'summit-floor',
    src: '10.jpeg', // 992x740, 1.34
    note: 'Nine people across the full width of the frame, the advisory stand behind them. Both edges carry a face; the stand graphics are the context. Used whole.',
  },
  {
    slug: 'startup-summit',
    src: '11.jpeg', // 1600x1200, 1.33
    note: 'The summit backdrop is half the subject \u2014 it names the event, the season and the organisers \u2014 and it fills the frame edge to edge. Cropping any of it would remove the only thing in the picture that dates it. Used whole.',
  },
  {
    slug: 'iit-ropar-convocation',
    src: '6.jpeg', // 720x1280, 0.56
    crop: { x: 0, y: 0.1, w: 0.97, h: 0.82 },
    tall: true,
    note:
      "The one portrait in the set, and it stays one. A standing " +
      "figure at full height beside a roll-up banner is 0.56 in the " +
      "camera, and every crop that reaches the 0.9 floor either takes " +
      "him at the knee or takes the banner copy that names the " +
      "programme — which is the whole reason the frame is worth " +
      "keeping. So the crop only removes what nobody is looking at: " +
      "the ceiling slab above the banner, the pillar and the plant off " +
      "the right edge, and the step below his shoes. 0.67, fitted by " +
      "height in the card, mirrors down both columns. That is the case " +
      "the mirrors were built for, and this is the first picture here " +
      "that actually needs them.",
  },
  {
    slug: 'iit-ropar-complete',
    src: '8.jpeg', // 1280x1280, 1.00
    crop: { x: 0, y: 0.04, w: 1, h: 0.96 },
    note: 'Square already; only the dead strip at the top and bottom goes. Both faces sit high, well clear of the caption. 1.04.',
  },
];

/* Slugs that have held a file at some point and no longer should. The
   artwork is deleted on the next run so the folder never accumulates a
   picture nothing points at.

   The first three came from an early pass that placed photographs by
   their position in the folder rather than by what is in them. The four
   after are the second round of the same mistake, found later: 3.jpg is
   the team on the last day of an internship and not a client website,
   9.jpeg is a campus lab and not a code release, and 10.jpeg and
   11.jpeg are both the startup summit and neither is a product launch.
   Those four entries were re-written around what their photographs
   actually show; the milestones that had been borrowing them are in
   projects.ts and the experience rail, which is where they belong.

   6.jpeg, the completion banner, spent one pass here as a frame with
   no entry to carry it — the reasoning at the time was that the
   handover photograph told the same moment better. It does not tell
   the same moment. The handover is the certificate changing hands
   inside; the banner is the hour before it, outside, and the day is
   worth both. It has its own entry now. */
const STALE = [
  'vit-begins',
  'ey-techathon',
  'governai',
  'vubs',
  'research-atlas',
  'governai-studio',
  'lmx-labs',
];

const browser = await chromium.launch({
  executablePath: EXE,
  // A file:// image is cross-origin to a file:// document without this,
  // and the canvas comes out tainted at toDataURL.
  args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();

const seed = path.join(OUT_DIR, '__seed.html');
fs.writeFileSync(seed, '<!doctype html><title>seed</title>');
await page.goto('file:///' + seed.split('\\').join('/').split(' ').join('%20'));

let total = 0;
for (const photo of PHOTOS) {
  const abs = path.join(SRC_DIR, photo.src);
  if (!fs.existsSync(abs)) {
    console.log(`MISSING  ${photo.src}`);
    continue;
  }
  const url = 'file:///' + abs.split('\\').join('/').split(' ').join('%20');

  const r = await page.evaluate(
    async ({ u, crop, maxEdge, q }) => {
      const im = new Image();
      const ok = await new Promise((res) => {
        im.onload = () => res(true);
        im.onerror = () => res(false);
        im.src = u;
      });
      if (!ok) return { err: 'load failed' };

      const c0 = crop ?? { x: 0, y: 0, w: 1, h: 1 };
      const sx = Math.round(c0.x * im.naturalWidth);
      const sy = Math.round(c0.y * im.naturalHeight);
      const sw = Math.round(c0.w * im.naturalWidth);
      const sh = Math.round(c0.h * im.naturalHeight);

      const scale = Math.min(1, maxEdge / Math.max(sw, sh));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sw * scale);
      canvas.height = Math.round(sh * scale);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(im, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      try {
        return {
          d: canvas.toDataURL('image/webp', q),
          w: canvas.width,
          h: canvas.height,
          src: [im.naturalWidth, im.naturalHeight],
        };
      } catch (e) {
        return { err: 'toDataURL: ' + e.message };
      }
    },
    { u: url, crop: photo.crop, maxEdge: MAX_EDGE, q: QUALITY },
  );

  if (r.err) {
    console.log(`FAILED   ${photo.slug}: ${r.err}`);
    continue;
  }

  const buf = Buffer.from(r.d.split(',')[1], 'base64');
  fs.writeFileSync(path.join(OUT_DIR, `${photo.slug}.webp`), buf);
  total += buf.length;

  const ratio = r.w / r.h;
  /* 0.86 and 1.46 are the card's own ratios on a phone and on a
     desktop, so a picture between them fills the card at both. Outside
     it, the card shows ink on one axis — usually a mistake, and
     occasionally the point. A picture deliberately wider than 1.46
     leaves empty card beneath itself, which is a better place for the
     caption than the photograph is; a picture that is genuinely a
     portrait cannot be made landscape without lying about what is in
     it, and the mirrors exist so it does not have to be. Those declare
     `wide` or `tall` and are not flagged. */
  const flag =
    (photo.wide || photo.tall) || (ratio >= 0.86 && ratio <= 1.46) ? '' : '  OUT OF BAND';
  console.log(
    `${photo.slug.padEnd(20)} ${photo.src.padEnd(9)} ` +
      `${String(r.src[0] + 'x' + r.src[1]).padEnd(10)} -> ${String(r.w + 'x' + r.h).padEnd(10)} ` +
      `r=${ratio.toFixed(2)} ${(buf.length / 1024).toFixed(0).padStart(4)}KB${flag}`,
  );
}

fs.unlinkSync(seed);
for (const slug of STALE) {
  const f = path.join(OUT_DIR, `${slug}.webp`);
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log(`removed  ${slug}.webp`);
  }
}
console.log(`\n${PHOTOS.length} photographs, ${(total / 1024 / 1024).toFixed(2)} MB`);
await browser.close();
