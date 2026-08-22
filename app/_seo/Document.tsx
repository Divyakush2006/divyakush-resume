import { preload } from 'react-dom';

import { HERO_SET, HERO_SIZES, HERO_SRC } from '../../src/lib/hero-image';
import { NAME, ORIGIN, type RouteSeo } from '../../src/lib/seo';

/* ─────────────────────────────────────────────────────────────────
   Everything a machine reads, for one route.

   Three pieces, rendered together because they are the same decision:

     1. The JSON-LD graph.
     2. The page's prose in <noscript>.
     3. On the two routes that render the home page, a preload for the
        hero portrait.

   All three are server components. They run once, at build time, and
   their output is bytes in a static file — which is the only way any
   of it is worth anything, since the readers are crawlers and
   unfurlers that never run the bundle.
   ───────────────────────────────────────────────────────────────── */

/* `</script>` inside a JSON string would close the tag it is sitting
   in and hand the rest of the document to the HTML parser as markup.
   The data here is the site's own, so this is not defending against an
   attacker — it is defending against a project title that one day
   contains a `<`. Escaping the angle bracket is invisible to a JSON
   parser and inert to an HTML one. */
const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

export function JsonLd({ schema }: { schema: RouteSeo['schema'] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJson({ '@context': 'https://schema.org', '@graph': schema }),
      }}
    />
  );
}

/* The prose, for readers that never run the bundle: Bing, the LinkedIn
   and Slack unfurlers, and the AI crawlers.

   <noscript> rather than hidden markup in the body — text styled out
   of sight is a spam signal, and text inside the app's own container
   would be replaced by React on mount and flash on the way. */
export function NoscriptProse({ seo }: { seo: RouteSeo }) {
  return (
    <noscript>
      <h1>{seo.h1}</h1>
      {seo.body.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <p>
        <a href={`${ORIGIN}/`}>{NAME}</a>
      </p>
    </noscript>
  );
}

/* The hero portrait is the Largest Contentful Paint element on `/` and
   on every `/insights/<slug>`, which render the same page. See
   src/lib/hero-image.ts for why the srcset and the sizes must both be
   here and why they come from that module rather than from a glob over
   the build output.

   `type="image/webp"` matters: a browser that cannot decode WebP skips
   the preload entirely instead of downloading a file it will never
   use, and picks up the PNG through <picture> as usual. */
export function HeroPreload() {
  if (!HERO_SET) return null;

  /* ReactDOM.preload rather than a <link> in the JSX, and the
     difference is not stylistic. Rendering the tag produced two of
     them in every document: React hoists a <link rel="preload"
     as="image"> into <head> as written, and separately registers it
     as a resource and emits its own canonical copy. Both named the
     same srcset, so the browser fetched once and nothing was visibly
     wrong — which is the kind of duplication that survives for years.

     Going through the API instead means React emits the tag once, in
     the form it considers canonical, and deduplicates it against any
     other call for the same resource. scripts/post-build.mjs asserts
     the count, because this was found by an assertion rather than by
     reading the HTML. */
  preload(HERO_SRC, {
    as: 'image',
    imageSrcSet: HERO_SET.webp,
    imageSizes: HERO_SIZES,
    type: 'image/webp',
    fetchPriority: 'high',
  });

  return null;
}

/* The home page's canonical and og:url, written as literal tags
   rather than through the metadata resolver, which strips the trailing
   slash off an origin when `trailingSlash` is false. React hoists both
   into <head>, and because `metadataFor` omits them for this route
   there is exactly one of each in the document.

   It is one character, and it is the character that decides whether
   the canonical this page declares is the same string as the one in
   sitemap.xml. A sitemap that disagrees with a canonical is a
   contradiction, and the usual resolution is that both are ignored. */
function HomeCanonical() {
  return (
    <>
      <link rel="canonical" href={`${ORIGIN}/`} />
      <meta property="og:url" content={`${ORIGIN}/`} />
    </>
  );
}

/** All of it, for one route. */
export function SeoDocument({ seo, hero = false }: { seo: RouteSeo; hero?: boolean }) {
  return (
    <>
      {seo.url === '/' && <HomeCanonical />}
      {hero && <HeroPreload />}
      <JsonLd schema={seo.schema} />
      <NoscriptProse seo={seo} />
    </>
  );
}
