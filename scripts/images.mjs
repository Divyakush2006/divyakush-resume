/* ─────────────────────────────────────────────────────────────────
   Image pipeline: raster fallbacks, and a width ladder for each image.

   Two jobs, and the second is the one that matters on a phone.

   ── 1. Fallbacks ─────────────────────────────────────────────────
   Every image ships as WebP. WebP has been in every evergreen browser
   since Safari 14 (Sept 2020), so this is about the long tail: Safari
   13 and earlier, IE11, old Android WebViews. Those get a JPEG — or a
   PNG where the image has an alpha channel — through <picture>, and
   never download the WebP. Everyone else downloads the WebP and never
   touches the fallback.

   ── 2. The width ladder ──────────────────────────────────────────
   A decoded image costs width x height x 4 bytes of memory regardless
   of what the file weighed. A 2048x1152 photograph is ~240KB on the
   wire and 9.4MB in RAM. Measured on the home page at 390px before
   this existed: 27 images, 133.5MB of decoded bitmaps, with 19 of them
   decoded far larger than the box they were painted into — a 2048px
   image rendered into a 780px slot.

   On a phone with 2-3GB shared between the OS and the browser, that is
   the number that causes memory pressure, GC pauses and eventually the
   tab being evicted and reloaded from scratch — which is the worst
   "lag" a reader can be given, because the page starts over.

   So each image also gets narrower renditions, and <picture> is handed
   a srcset so the browser can pick one that fits the box it is
   actually painting into. Nothing about the markup or the interaction
   changes; the browser simply stops decoding pixels no one can see.

   Renditions are only ever made *smaller* than the master — upscaling
   an image to fill a ladder rung would add bytes and no detail.

   Sources, in order of preference:
     1. An original PNG/JPG beside the WebP. Where one exists it is the
        better master, so renditions are cut from it rather than from
        an already-lossy file.
     2. The WebP itself.

   Idempotent: a rendition is re-encoded only when it is missing or
   older than its source. Safe to run on every build.
   ───────────────────────────────────────────────────────────────── */
import sharp from 'sharp';
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const JPEG = { quality: 82, progressive: true, mozjpeg: true };
const PNG = { compressionLevel: 9, palette: true };

/* Rungs chosen against the boxes this site actually paints into: a
   phone card sits around 330-390 CSS px, a two-up grid cell around
   600-780, and a full-bleed desktop cover around 1400. Doubling for
   retina lands on these four. A rung wider than the master is skipped. */
const WIDTHS = [400, 800, 1200, 1600];

const listFiles = (dir) =>
  existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name) : [];

/* ── Which src/assets images are actually imported ────────────────
   Scanned rather than assumed: an asset nothing imports must not be
   given renditions, because the generated module would then import it
   and put dead files in the bundle. */
function importedAssets() {
  const found = new Set();
  const walk = (dir) => {
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, d.name);
      if (d.isDirectory()) { walk(p); continue; }
      if (!/\.(ts|tsx)$/.test(d.name)) continue;

      /* Never read this script's own output. The generated module
         imports every rendition by name, so scanning it would feed
         those names straight back in as if they were masters — and
         the next run would then build renditions of renditions.
         It does: one pass took 63 images to 606 and wrote 768 files
         called things like `algoverse_arena-1200-800-400.webp`. */
      if (d.name === 'image-fallbacks.generated.ts') continue;

      const text = readFileSync(p, 'utf8');
      for (const m of text.matchAll(/assets\/([^'"`]+?)\.webp/g)) found.add(m[1]);
    }
  };
  walk('src');

  /* Second guard, in case a rendition name reaches a hand-written file:
     `<name>-<width>` is this script's own output shape, never a master. */
  return [...found].filter((n) => !/-\d+$/.test(n)).sort();
}

/** Encode `buf` to the right format for the image, at an optional width. */
async function encode(input, alpha, width) {
  let pipe = sharp(input);
  if (width) pipe = pipe.resize({ width, withoutEnlargement: true });
  return alpha
    ? pipe.png(PNG).toBuffer()
    : pipe.flatten({ background: '#ffffff' }).jpeg(JPEG).toBuffer();
}

/**
 * Builds every derivative for one image.
 * Returns { fallback, widths: [{ w, webp }] } or null.
 */
async function build(dir, name) {
  const webpPath = join(dir, `${name}.webp`);
  if (!existsSync(webpPath)) {
    console.warn(`  !! ${name}.webp is imported but missing from ${dir}`);
    return null;
  }

  const meta = await sharp(webpPath).metadata();
  const alpha = !!meta.hasAlpha;

  /* A transparent image needs a PNG fallback, and a PNG master may
     already own `<name>.png` — hero-no-bg does — so transparent
     fallbacks take an explicit suffix rather than overwriting the
     master. Opaque fallbacks are safely `<name>.jpg`: no master here
     is a JPEG, so that name is always free. */
  const fallback = alpha ? `${name}-fallback.png` : `${name}.jpg`;
  const fallbackOut = join(dir, fallback);

  const original = ['.png', '.jpg', '.jpeg']
    .map((e) => join(dir, `${name}${e}`))
    .find((p) => existsSync(p) && p !== fallbackOut);
  const sourcePath = original ?? webpPath;

  /* Read once, to a buffer, so an encode can never be reading the file
     it is about to replace. */
  let input = null;
  const load = () => (input ??= readFileSync(sourcePath));
  const stale = (out) =>
    !existsSync(out) || statSync(out).mtimeMs < statSync(sourcePath).mtimeMs;

  let made = 0;

  if (stale(fallbackOut)) {
    writeFileSync(fallbackOut, await encode(load(), alpha));
    made++;
  }

  /* The ladder. Only rungs genuinely narrower than the master. */
  const rungs = WIDTHS.filter((w) => w < (meta.width ?? 0));
  const widths = [];

  /* Only the WebP ladder gets rungs.

     A second, raster ladder was built and then removed after measuring
     what it cost. Every rendition must be imported to learn its hashed
     URL, and those URLs are string literals in the bundle: the raster
     ladder alone added ~140KB raw / 26KB gzipped of JavaScript that
     has to be downloaded and parsed before first paint. All of it
     spent on browsers with no WebP support — under 2% of traffic, and
     not the browsers that gain most from a smaller download.

     Those browsers still get a correct, sharp image from the single
     full-size fallback. They just do not get a choice of widths, which
     is the right thing to trade away. */
  for (const w of rungs) {
    const webpFile = `${name}-${w}.webp`;
    const webpOut = join(dir, webpFile);

    if (stale(webpOut)) {
      writeFileSync(
        webpOut,
        await sharp(load()).resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
      );
      made++;
    }
    widths.push({ w, webp: webpFile });
  }

  /* The master is the top rung. */
  widths.push({ w: meta.width, webp: `${name}.webp` });

  if (made) {
    console.log(`  ${name.padEnd(34)} ${String(meta.width).padStart(5)}px  +${made} files  [${rungs.join(', ')}]`);
  }
  return { fallback, widths };
}

/* ── 1. Bundled assets ────────────────────────────────────────────── */
console.log('\nsrc/assets');
const names = importedAssets();
const built = [];
for (const n of names) {
  const r = await build('src/assets', n);
  if (r) built.push({ name: n, ...r });
}

/* ── 2. The generated module ──────────────────────────────────────
   Explicit imports, not import.meta.glob: a glob would match every
   file in the folder including ones nothing uses, and Vite would emit
   all of them. Importing each rendition is also what turns a source
   filename into the hashed URL it ships under, so the srcset is built
   from real URLs rather than from a guess about the hash. */
const ident = (i, extra) => `_${i}${extra}`;
const lines = [
  '/* GENERATED by scripts/images.mjs — do not edit by hand.',
  '   For each imported WebP: its single raster fallback, and the WebP',
  '   both encodings so the browser can decode a rendition that fits',
  `   the box rather than the master. ${built.length} images.`,
  '   Regenerate with: npm run images */',
  '',
  /* Every imported URL goes through asset(). A bundler is free to
     resolve an image import to a string (Vite) or to a StaticImageData
     object (Next), and this map is keyed by URL — an object key would
     stringify to "[object Object]" and every lookup in Picture would
     miss silently. See src/lib/asset.ts. */
  "import { asset } from './asset';",
  '',
];

const entries = [];
built.forEach((b, i) => {
  const safe = b.name.replace(/[^a-zA-Z0-9]/g, '_');
  lines.push(`import ${ident(i, `_${safe}`)} from '../assets/${b.name}.webp';`);
  lines.push(`import ${ident(i, `_${safe}_f`)} from '../assets/${b.fallback}';`);

  const webpParts = [];
  b.widths.forEach((rung, k) => {
    if (rung.webp === `${b.name}.webp`) {
      webpParts.push(`\${asset(${ident(i, `_${safe}`)})} ${rung.w}w`);
    } else {
      const id = ident(i, `_${safe}_w${k}`);
      lines.push(`import ${id} from '../assets/${rung.webp}';`);
      webpParts.push(`\${asset(${id})} ${rung.w}w`);
    }
  });

  entries.push(
    `  [asset(${ident(i, `_${safe}`)})]: {\n` +
    `    fallback: asset(${ident(i, `_${safe}_f`)}),\n` +
    `    webp: \`${webpParts.join(', ')}\`,\n` +
    `  },`
  );
});

/* ── 3. public/ assets ────────────────────────────────────────────
   Copied verbatim and referenced by a path built at runtime
   (`/certificates/${slug}.webp`), so nothing is hashed and the URLs
   can be written as literals. */
const publicEntries = [];
for (const dir of ['public/certificates', 'public/insights']) {
  const webps = listFiles(dir)
    .filter((f) => extname(f) === '.webp')
    /* Skip this script's own renditions. Unlike src/assets, where the
       master list comes from what the app imports, this folder is read
       straight off disk — so without the filter a `-400.webp` written
       on the last run is treated as a master on the next one, and the
       ladder starts growing rungs off its own rungs. */
    .filter((f) => !/-\d+$/.test(basename(f, '.webp')));
  if (!webps.length) continue;
  console.log(`\n${dir}`);
  const urlBase = dir.replace(/^public/, '');
  for (const f of webps) {
    const name = basename(f, '.webp');
    const r = await build(dir, name);
    if (!r) continue;
    const webp = r.widths.map((x) => `${urlBase}/${x.webp} ${x.w}w`).join(', ');
    publicEntries.push(
      `  '${urlBase}/${name}.webp': {\n` +
      `    fallback: '${urlBase}/${r.fallback}',\n` +
      `    webp: '${webp}',\n` +
      `  },`
    );
  }
}

lines.push(
  '',
  'export interface ImageSet {',
  '  /** Raster URL for browsers without WebP. */',
  '  fallback: string;',
  '  /** srcset for the WebP ladder. */',
  '  webp: string;',
  '}',
  '',
  'export const IMAGES: Readonly<Record<string, ImageSet>> = {',
  ...entries,
  ...publicEntries,
  '};',
  '',
);

writeFileSync('src/lib/image-fallbacks.generated.ts', lines.join('\n'));
console.log(`\n  -> src/lib/image-fallbacks.generated.ts (${built.length} bundled + ${publicEntries.length} public)\n`);
