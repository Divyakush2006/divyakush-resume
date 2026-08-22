/* ─────────────────────────────────────────────────────────────────
   Every URL on this site, and everything a machine should be told
   about it.

   ── What this replaces ────────────────────────────────────────────
   Under Vite this was scripts/seo-build.mjs: a post-build step that
   read `dist/index.html`, bundled `projects.ts` with esbuild behind a
   plugin that stubbed out every image import, string-substituted a new
   <head> into the shell, and wrote twenty-three files. It worked, and
   every line of it existed to work around the same fact — that a
   client-rendered SPA emits one document and Vite has no idea the
   other twenty-two URLs exist.

   Next knows. A route is a file, its metadata is a function, and the
   framework calls that function at build time with the route's params.
   So the whole apparatus collapses to this module plus a
   `generateMetadata` export per route: one place that says what a URL
   is, consumed by the head, the sitemap and llms.txt alike.

   The output is deliberately identical. This is a port, not a rewrite:
   the same titles, the same clamped descriptions, the same canonical
   strings, the same @graph with the same @ids. A canonical or an @id
   that shifts by one character is a new entity as far as a search
   engine is concerned, and re-earning that is measured in months.

   ── The part worth reading twice ──────────────────────────────────
   `canonical`. It is not a hint about which URL is prettier — it is a
   declaration that *this page is a duplicate of that one*. Before the
   original build script existed, every project page and every insight
   carried `https://www.divyakush.com/`, hardcoded in a single shared
   index.html. Twenty-two documents of real writing, formally
   disclaiming themselves in the one tag Google trusts most on the
   subject. That is the bug all of this exists to keep fixed.
   ───────────────────────────────────────────────────────────────── */

import { PROJECTS } from './projects';
import { INSIGHTS } from './insights';

export const ORIGIN = 'https://www.divyakush.com';
export const NAME = 'Divyakush Punjabi';
export const ROLE = 'Full Stack & AI Systems Engineer';

/* Every identity URL under the author's control. Repeated byte for
   byte here, in the JSON-LD and on the profiles themselves — entity
   resolution is literally string matching, so "www." and a trailing
   slash are not cosmetic. */
export const SAME_AS = [
  'https://github.com/Divyakush2006',
  'https://www.linkedin.com/in/divyakush-punjabi',
  'https://dev.to/divyakush',
  'https://about.me/divyakush',
  'https://divyakush.is-a.dev',
  'https://divyakush2006.github.io/divyakush-resume/',
];

/** Trim to a length a search result will actually print. */
export const clamp = (s: string, n = 158) => {
  const t = String(s).replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  return t.slice(0, t.lastIndexOf(' ', n - 1)).replace(/[,;:—-]$/, '') + '…';
};

type Node = Record<string, unknown>;

export interface RouteSeo {
  /** Path, always absolute and without a trailing slash except '/'. */
  url: string;
  title: string;
  description: string;
  /** The heading a crawler without JavaScript should read first. */
  h1: string;
  /** The page's actual prose, in order. */
  body: string[];
  /** JSON-LD nodes, assembled into one @graph. */
  schema: Node[];
  /** Present only where the page has a photograph of its own. */
  image?: string;
}

/* ── The graph's shared nodes ─────────────────────────────────────
   One person, one image, one website, referenced by @id from every
   page. A second copy of the same object is how a graph starts
   disagreeing with itself. */

const person: Node = {
  '@type': 'Person',
  '@id': `${ORIGIN}/#person`,
  name: NAME,
  url: `${ORIGIN}/`,
  jobTitle: ROLE,
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'Vellore Institute of Technology' },
    { '@type': 'CollegeOrUniversity', name: 'Indian Institute of Technology Ropar' },
  ],
  worksFor: { '@type': 'Organization', name: 'LMX Labs' },
  knowsAbout: [
    'Full stack engineering', 'Machine learning', 'Retrieval-augmented generation',
    'Multi-tenant SaaS architecture', 'PostgreSQL', 'React', 'TypeScript', 'Python',
    'FastAPI', 'Django', 'Verilog HDL', 'Embedded systems', 'Computer vision',
  ],
  image: { '@id': `${ORIGIN}/#logo` },
  sameAs: SAME_AS,
};

/** The share card doubles as the entity's image. One file, one node. */
const logo: Node = {
  '@type': 'ImageObject',
  '@id': `${ORIGIN}/#logo`,
  url: `${ORIGIN}/og-image.png`,
  contentUrl: `${ORIGIN}/og-image.png`,
  width: 1200,
  height: 630,
  caption: NAME,
};

const website: Node = {
  '@type': 'WebSite',
  '@id': `${ORIGIN}/#website`,
  url: `${ORIGIN}/`,
  name: NAME,
  publisher: { '@id': `${ORIGIN}/#person` },
  inLanguage: 'en',
};

/* Built for every page, so the graph is connected rather than a pile
   of unrelated blocks. `primaryImageOfPage` and `breadcrumb` are only
   attached where the page genuinely has one. */
const webPage = (url: string, name: string, description: string, extra: Node = {}): Node => ({
  '@type': url === '/' ? 'ProfilePage' : 'WebPage',
  '@id': `${ORIGIN}${url}#webpage`,
  url: `${ORIGIN}${url}`,
  name,
  description,
  isPartOf: { '@id': `${ORIGIN}/#website` },
  about: { '@id': `${ORIGIN}/#person` },
  inLanguage: 'en',
  ...extra,
});

/* ── The routes ───────────────────────────────────────────────── */

export const homeSeo = (): RouteSeo => ({
  url: '/',
  title: `${NAME} — ${ROLE}`,
  description:
    'Full stack and AI systems engineer — multi-tenant SaaS, semantic retrieval, production ML. Engineering lead at LMX Labs. VIT Vellore, AI major at IIT Ropar.',
  h1: NAME,
  body: [
    `${NAME} is a full stack and AI systems engineer. He leads engineering at LMX Labs across two live platforms, reads a B.Tech at Vellore Institute of Technology and holds a Major Degree in Artificial Intelligence from IIT Ropar, and ships production systems — multi-tenant SaaS, semantic retrieval, and machine learning services that run.`,
    `Selected work: ${PROJECTS.slice(0, 6).map((p) => p.title).join(', ')}.`,
  ],
  schema: [
    person,
    logo,
    website,
    webPage('/', `${NAME} — ${ROLE}`, 'Portfolio and record of work.', {
      mainEntity: { '@id': `${ORIGIN}/#person` },
      primaryImageOfPage: { '@id': `${ORIGIN}/#logo` },
    }),
  ],
});

export function projectSeo(slug: string): RouteSeo | null {
  const p = PROJECTS.find((x) => x.slug === slug);
  if (!p) return null;

  const repo = (p.links ?? []).find((l) => l.kind === 'source')?.href;
  const live = (p.links ?? []).find((l) => l.kind === 'live')?.href;
  const url = `/projects/${p.slug}`;

  return {
    url,
    title: `${p.title} — ${NAME}`,
    description: clamp(p.summary || p.lede),
    h1: p.title,
    /* The real prose, not just the summary. A project page carries its
       build notes and feature write-ups, and those are the words that
       make it rank for anything beyond the project's own name. */
    body: [
      p.lede,
      p.summary,
      ...(p.build ?? []).flatMap((b) => [b.title, b.body]),
      ...(p.features ?? []).flatMap((f) => [f.title, f.body]),
      ...(p.facts ?? []).map((f) => `${f.label}: ${f.value}`),
    ].filter(Boolean) as string[],
    schema: [
      person,
      logo,
      website,
      webPage(url, p.title, clamp(p.summary || p.lede), {
        breadcrumb: { '@id': `${ORIGIN}${url}#breadcrumb` },
        mainEntity: { '@id': `${ORIGIN}${url}#software` },
      }),
      /* Mirrors the trail the page actually renders: "Selected work /
         <category>" above the H1. Nothing is claimed here that a
         reader cannot see. */
      {
        '@type': 'BreadcrumbList',
        '@id': `${ORIGIN}${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Selected work', item: `${ORIGIN}/#work` },
          { '@type': 'ListItem', position: 2, name: p.category },
          { '@type': 'ListItem', position: 3, name: p.title },
        ],
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${ORIGIN}${url}#software`,
        name: p.title,
        description: clamp(p.lede || p.summary, 400),
        url: `${ORIGIN}${url}`,
        author: { '@id': `${ORIGIN}/#person` },
        ...(repo ? { codeRepository: repo } : {}),
        ...(live ? { targetProduct: { '@type': 'WebApplication', url: live } } : {}),
        ...(p.stack?.length ? { programmingLanguage: p.stack } : {}),
        ...(p.year ? { dateCreated: String(p.year) } : {}),
      },
    ],
  };
}

export function insightSeo(slug: string): RouteSeo | null {
  const i = INSIGHTS.find((x) => x.slug === slug);
  if (!i) return null;

  const url = `/insights/${i.slug}`;

  return {
    url,
    image: i.image,
    title: `${i.title} — ${NAME}`,
    description: clamp(i.blurb),
    h1: i.title,
    body: [i.blurb, ...i.story],
    schema: [
      person,
      logo,
      website,
      /* No BreadcrumbList on these. A story opens as an overlay over
         the home page and renders no trail, and marking up a
         breadcrumb the reader cannot see is the exact thing the
         structured-data guidelines call out. */
      webPage(url, i.title, clamp(i.blurb), {
        mainEntity: { '@id': `${ORIGIN}${url}#article` },
        primaryImageOfPage: { '@id': `${ORIGIN}${url}#primaryimage` },
      }),
      {
        '@type': 'ImageObject',
        '@id': `${ORIGIN}${url}#primaryimage`,
        url: `${ORIGIN}${i.image}`,
        contentUrl: `${ORIGIN}${i.image}`,
        caption: `${i.title}${i.location ? `, ${i.location}` : ''}`,
      },
      {
        '@type': 'Article',
        '@id': `${ORIGIN}${url}#article`,
        headline: i.title,
        description: clamp(i.blurb, 400),
        url: `${ORIGIN}${url}`,
        author: { '@id': `${ORIGIN}/#person` },
        ...(i.location ? { contentLocation: { '@type': 'Place', name: i.location } } : {}),
        image: { '@id': `${ORIGIN}${url}#primaryimage` },
        publisher: { '@id': `${ORIGIN}/#person` },
        mainEntityOfPage: { '@id': `${ORIGIN}${url}#webpage` },
        wordCount: i.story.join(' ').split(/\s+/).length,
      },
    ],
  };
}

/** Every route that should exist as its own document, in sitemap order. */
export function allRoutes(): RouteSeo[] {
  return [
    homeSeo(),
    ...PROJECTS.map((p) => projectSeo(p.slug)!),
    ...INSIGHTS.map((i) => insightSeo(i.slug)!),
  ];
}
