/* ─────────────────────────────────────────────────────────────────
   The one place a bundler's opinion about images is resolved.

   `import cover from '../assets/cover.webp'` does not mean the same
   thing everywhere:

     Vite       hands back the URL, a string:  "/assets/cover-a1b2.webp"
     Next.js    hands back a StaticImageData:  { src, width, height,
                                                 blurDataURL }
     esbuild    hands back whatever the plugin says — scripts/seo-build
                stubs these to "" so it can read the data out of
                projects.ts without inlining several megabytes of WebP

   Everything downstream of an import wants the string. `IMAGES` in
   image-fallbacks.generated.ts is keyed by URL; `Picture` looks a
   `src` up in that map; `srcset` is built by interpolating URLs into a
   template. Hand any of those an object and the key becomes
   "[object Object]", the lookup misses, and the image silently drops
   to an unrecognised `src` — which renders nothing and throws nothing.

   So the difference is absorbed here, once, at the boundary, rather
   than by configuring each bundler to lie about what it returns. That
   was the alternative, and it was rejected for a reason worth writing
   down: a webpack rule or a Turbopack loader that rewrites image
   imports is invisible from the code, specific to one bundler's
   internals, and breaks on a major upgrade — which is exactly the
   event this site has just been through. A five-line function with a
   `typeof` check breaks on nothing.

   It is also why this file has no dependency on Next, React or Vite.
   It is arithmetic on a value that arrived from somewhere else.
   ───────────────────────────────────────────────────────────────── */

/** What a bundler may hand back for `import x from './y.webp'`. */
type ImportedAsset = string | { readonly src: string };

/** The URL, whichever shape it arrived in. */
export function asset(imported: ImportedAsset): string {
  return typeof imported === 'string' ? imported : imported.src;
}
