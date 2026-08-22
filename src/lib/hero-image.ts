/* ─────────────────────────────────────────────────────────────────
   The hero portrait, named once.

   The portrait is the Largest Contentful Paint element on the home
   page and on every `/insights/<slug>` — they render the same page. It
   is 67KB, and it used to arrive late for a reason that has nothing to
   do with its size: it is imported by a module, so its URL exists only
   inside the JavaScript bundle. The browser's preload scanner reads the
   HTML, finds no reference to it, and cannot start the request until
   the bundle has downloaded, parsed and rendered. The image was waiting
   on JavaScript, not on bandwidth.

   Naming it in the document removes that dependency — the fetch starts
   with the HTML, in parallel with the bundle rather than behind it. See
   app/_seo/HeroPreload.tsx, which is a server component and therefore
   runs at build time, so the link lands in the static file.

   Two things have to agree for that preload to be worth anything, and
   this module exists so they cannot drift apart:

     · The srcset. The hero renders from a width ladder, so the browser
       picks a rendition — 400w on a phone, 800w on a desktop. A preload
       naming only the master would warm a file the page then never
       uses: a wasted download on exactly the connection least able to
       spare it. `imagesrcset` on the link makes the preload scanner run
       the identical selection.

     · The `sizes` value. It is the input to that selection. If the
       hero's own `sizes` changes and the preload's does not, the
       scanner picks one rendition and the renderer picks another, and
       the preload is worse than useless — it is a second download.

   Both now come from here. HeroSection reads SIZES for its <img>; the
   preload component reads SIZES and resolves the ladder out of the
   generated image map. There is no third place to update.

   The old build script found the file by globbing `dist/assets` for a
   content-hashed name and parsing the width out of it with a regular
   expression. That worked, and it was a regex over build output
   standing in for a fact the build already knew. This is that fact.
   ───────────────────────────────────────────────────────────────── */

import { asset } from './asset';
import { IMAGES } from './image-fallbacks.generated';
import _heroPhoto from '../assets/hero-no-bg.webp';

/** The master's URL — the `src` on the <img>, and the map's key. */
export const HERO_SRC = asset(_heroPhoto);

/**
 * The width the portrait actually occupies. Must be the `sizes` on the
 * hero <img> in src/HeroSection.tsx; that file imports this constant so
 * that it is the same string rather than a matching one.
 */
export const HERO_SIZES = '(min-width: 1024px) 48vw, 95vw';

/** The WebP ladder and the raster fallback, or null if unrecognised. */
export const HERO_SET = IMAGES[HERO_SRC] ?? null;
