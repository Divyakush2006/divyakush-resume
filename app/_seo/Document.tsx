import { preload } from 'react-dom';

import { HERO_SET, HERO_SIZES, HERO_SRC } from '../../src/lib/hero-image';
import { NAME, ORIGIN, SAME_AS, type RouteSeo } from '../../src/lib/seo';
import { PROJECTS } from '../../src/lib/projects';
import { INSIGHTS } from '../../src/lib/insights';

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

      {/* ── The site's link graph, for readers that never run the
             bundle ────────────────────────────────────────────────
          This used to be one anchor pointing at the home page, and
          that single link was the whole internal link structure as far
          as any non-rendering crawler was concerned.

          It showed up in a third-party audit as "Internal links: 1,
          External links: 0" — numbers that looked absurd next to a
          site with twenty-three routes, until you notice the cause.
          The application is client-rendered by design (see
          app/_components/AppShell.tsx for the argument), so the
          document contains no <a> elements at all. The audit's crawler
          did not execute JavaScript, found the one link in here, and
          reported exactly what it saw.

          The rendered page has 47 internal and 2 external links, so
          nothing was actually missing from the *site*. What was
          missing was any way for a non-rendering reader to discover
          the other twenty-two documents by following links, rather
          than by being handed sitemap.xml and trusting it. Those are
          not the same signal: a sitemap says a URL exists, a link says
          a URL is worth reaching and says what it is called. Anchor
          text is the oldest ranking input there is and this site was
          publishing none of it.

          That matters beyond audit tools. Google renders, but
          rendering is queued and can lag the initial crawl by days;
          Bing renders far less reliably; the LinkedIn and Slack
          unfurlers and every AI crawler welcomed by name in
          public/robots.txt do not render at all.

          Kept to the two real hubs plus the profiles — the full route
          list with real titles as anchor text. It is the same
          information as sitemap.xml, said in the form a crawler
          actually follows. */}
      <nav>
        <h2>Selected work</h2>
        <ul>
          {PROJECTS.map((p) => (
            <li key={p.slug}>
              <a href={`${ORIGIN}/projects/${p.slug}`}>{p.title}</a> — {p.summary}
            </li>
          ))}
        </ul>

        <h2>Record</h2>
        <ul>
          {INSIGHTS.map((i) => (
            <li key={i.slug}>
              <a href={`${ORIGIN}/insights/${i.slug}`}>{i.title}</a>
              {i.location ? ` — ${i.location}` : ''}
            </li>
          ))}
        </ul>

        <h2>Elsewhere</h2>
        <ul>
          {SAME_AS.map((url) => (
            <li key={url}>
              {/* rel="me" for the same reason the <link rel="me"> tags
                  in the layout exist: it is the relation that says
                  "this profile is the same person", and it is what
                  IndieAuth and several verifiers read. Not nofollow —
                  these are the author's own profiles and the outbound
                  association is the point. */}
              <a href={url} rel="me">
                {url.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <p>
        <a href={`${ORIGIN}/`}>{NAME}</a>
      </p>
    </noscript>
  );
}

/* The two self-hosted faces, asked for immediately.

   A @font-face URL is not discovered until the stylesheet referencing
   it has been parsed *and* a character needing it has been laid out,
   which puts the fetch several steps into a cascade it does not have
   to be in. Both of these are used above the fold on every route.

   Only the `latin` subsets. `latin-ext` is declared in src/index.css
   and stays lazy on purpose — preloading a file that is almost never
   rendered would spend the request this is trying to save.

   Through ReactDOM.preload rather than a rendered <link>: React emits
   a hoisted copy *and* its own registered copy of an authored preload
   tag, which put two of each in every document. Same reason, same fix,
   same failure as HeroPreload below — and post-build.mjs asserts the
   counts because that is how the first one was found. */
export function FontPreload() {
  for (const href of ['/fonts/inter-latin.woff2', '/fonts/jetbrains-mono-latin.woff2']) {
    preload(href, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  }
  return null;
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
