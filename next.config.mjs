/* ─────────────────────────────────────────────────────────────────
   Next configuration.

   Short, and every line of it is a decision.

   ── output: 'export' ──────────────────────────────────────────────
   The build emits static files and nothing else — no Node process, no
   adapter, no edge runtime. That is not a limitation being worked
   around, it is the deployment this site already has: Cloudflare Pages
   serving files from a CDN, with public/_headers carrying the security
   and caching policy. Keeping it means the port changes the codebase
   and changes nothing about how the site is hosted, which is the
   difference between a migration and an outage.

   It also means every route is prerendered at build time. Twenty-three
   documents, each with its own <title>, description, canonical, Open
   Graph, JSON-LD and <noscript> prose, written by the framework rather
   than by a post-build script that string-substituted them into a
   shell.

   ── trailingSlash: false ──────────────────────────────────────────
   Load-bearing, and easy to get wrong. With it false the export writes
   `out/projects/netra.html`; with it true, `out/projects/netra/index.html`
   and every canonical grows a slash. Cloudflare Pages resolves the
   extensionless path to the former, so the URLs stay exactly the
   strings they have been indexed under. A canonical that changes by one
   character is a new URL as far as a search engine is concerned.

   ── images.unoptimized ────────────────────────────────────────────
   Required by `output: 'export'`, and correct here anyway: nothing on
   this site uses next/image. Every picture goes through
   src/components/Picture.tsx, which renders a real <picture> with a
   WebP <source>, a raster fallback for browsers without WebP, and a
   width ladder built at build time by scripts/images.mjs. That ladder
   is the reason the home page decodes 10.5MB of bitmap on a phone
   instead of 133.5MB, and it predates this config by a long way.

   Static image *imports* still work — they are how the URLs reach the
   code — and src/lib/asset.ts absorbs the fact that Next resolves them
   to an object where Vite resolved them to a string.

   ── reactStrictMode ───────────────────────────────────────────────
   On, as it was under Vite. It double-invokes effects in development,
   which is how the carousel's autoplay timer and the scroll lock were
   found to be cleanly re-entrant in the first place.

   ── What is deliberately not here ─────────────────────────────────
   No webpack or Turbopack rule for images. Next resolves an image
   import to a StaticImageData object where Vite resolved it to a
   string, and that difference is absorbed by src/lib/asset.ts rather
   than by teaching the bundler to lie — a five-line function with a
   typeof check survives a major upgrade, and a loader rule is exactly
   what does not.

   No ESLint block either. Next 16 removed the `eslint` config key
   along with `next lint`, and there is no ESLint configuration in
   this project to run. `tsc` runs as the first half of `npm run
   build` and is the gate that matters.
   ───────────────────────────────────────────────────────────────── */

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: false,
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
