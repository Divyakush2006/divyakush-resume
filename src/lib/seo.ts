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
import { CERTIFICATIONS } from './certifications';
import { IMAGES } from './image-fallbacks.generated';

export const ORIGIN = 'https://www.divyakush.com';

/* The modal route's prefix. One string, read by the carousel that
   pushes these URLs, by the App shell that decides which tree and
   which title a path gets, and by insightSeo below — a second copy is
   how a router and a <title> start disagreeing about what a URL is. */
export const INSIGHT_PREFIX = '/insights/';
export const NAME = 'Divyakush Punjabi';
export const ROLE = 'Full Stack & AI Systems Engineer';

/* Every identity URL under the author's control. Repeated byte for
   byte here, in the JSON-LD and on the profiles themselves — entity
   resolution is literally string matching, so "www." and a trailing
   slash are not cosmetic.

   Profiles only. Two entries were removed because they were not
   profiles at all, they were the two properties this origin replaced:

     divyakush.is-a.dev                        301 → www.divyakush.com
     divyakush2006.github.io/divyakush-resume  a "moved to" stub whose
                                               canonical already points
                                               here

   `sameAs` means "the same entity, described elsewhere". Naming a
   redirect back to yourself asserts nothing, and naming a retired
   property keeps it alive in the graph while the migration is trying
   to retire it. Both were checked over HTTP before removal, not
   assumed. */
export const SAME_AS = [
  'https://github.com/Divyakush2006',
  'https://www.linkedin.com/in/divyakush-punjabi',
  'https://dev.to/divyakush',
  'https://about.me/divyakush',
];

/** Trim to a length a search result will actually print. */
export const clamp = (s: string, n = 158) => {
  const t = String(s).replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  return t.slice(0, t.lastIndexOf(' ', n - 1)).replace(/[,;:—-]$/, '') + '…';
};

/* ── Dates ────────────────────────────────────────────────────────
   The site prints dates the way a person writes them — "2024",
   "Jun 2025" — because that is what belongs in a caption rail. A
   search engine wants ISO 8601, and schema.org accepts a reduced
   precision date: "2025-06" is a valid, complete answer to "when",
   and it is the *true* one.

   The temptation is to write "2025-06-01" because it looks more
   official and every validator stops complaining. That is a fact
   nobody has: the certificate says June, not the first of June.
   Reduced precision in, reduced precision out; unparseable in,
   nothing out, and the property is omitted rather than guessed. */
const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

export function isoDate(printed: string | undefined): string | undefined {
  if (!printed) return undefined;

  /* A range — "23 Mar — 20 Jul 2025", "Jan 2025 — Jun 2026" — resolves
     to its end. These are all programmes and internships, and the date
     on a credential is the date it was awarded, which is when the thing
     finished. Only the end carries a year in the shorter forms anyway. */
  const s = printed.trim().split(/\s+[—–-]\s+/).pop()!.trim();

  /* "13 July 2025". The one form on the site that prints a real day, so
     it is the one form that gets day precision. */
  const dayMonthYear = /^(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{4})$/.exec(s);
  if (dayMonthYear) {
    const m = MONTHS[dayMonthYear[2].slice(0, 3).toLowerCase()];
    if (m) return `${dayMonthYear[3]}-${m}-${dayMonthYear[1].padStart(2, '0')}`;
  }

  const monthYear = /^([A-Za-z]{3,})\.?\s+(\d{4})$/.exec(s);
  if (monthYear) {
    const m = MONTHS[monthYear[1].slice(0, 3).toLowerCase()];
    if (m) return `${monthYear[2]}-${m}`;
  }

  const year = /^(\d{4})$/.exec(s);
  if (year) return year[1];

  return undefined;
}

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

/* ── Credentials ──────────────────────────────────────────────────
   The eighteen documents the Certifications section renders, as
   schema. Every one of them is on the page, openable full size, and
   several print a credential number that can be checked against the
   issuer — which is the whole test for whether a claim belongs in
   structured data at all.

   This is the strongest entity signal on the site. "Divyakush Punjabi"
   is a name; a person who holds a named credential, issued by a named
   organisation, on a named date, is an entity a knowledge graph can
   place — and it is what an answer engine reaches for when it is asked
   to say who somebody is rather than to list pages about them.

   Attached to the home page's Person node and nowhere else. It is the
   same @id everywhere, so a consumer assembling the graph gets the
   full description from the page that is *about* the person; repeating
   four kilobytes of it on all twenty-three documents would buy nothing
   and be paid for on every request. */
const credentials: Node[] = CERTIFICATIONS.map((c) => ({
  '@type': 'EducationalOccupationalCredential',
  name: c.title,
  credentialCategory: c.track,
  recognizedBy: { '@type': 'Organization', name: c.issuer },
  ...(isoDate(c.date) ? { dateCreated: isoDate(c.date) } : {}),
  ...(c.credentialId ? { identifier: c.credentialId } : {}),
}));

/** The full description of the entity, for the page that is about it. */
const personFull: Node = {
  ...person,
  description:
    `${NAME} is a full stack and AI systems engineer. He leads engineering at ` +
    'LMX Labs across two live platforms, reads a B.Tech in Computer Engineering ' +
    'at Vellore Institute of Technology, and holds a Major Degree in Artificial ' +
    'Intelligence from IIT Ropar.',
  hasCredential: credentials,
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
    personFull,
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
      /* Mirrors the trail the page renders — "Selected work /
         <category>" above the H1 — as far as breadcrumb markup is
         allowed to.

         Search Console rejected the first version of this, and it was
         wrong twice over:

           1. Every ListItem except the last needs an `item`. Position 2
              was the category and carried only a `name`, so the whole
              BreadcrumbList was invalid — "Missing field 'item'".
           2. Position 1 pointed at `${ORIGIN}/#work`. A fragment is not
              a page. It resolves to the home page, so it was not
              *wrong* exactly, but a breadcrumb item is a claim that a
              distinct URL exists at that step and `/#work` is not one.
              It also meant Search Console listed a `#work` URL in its
              report, which is what a reader of that report will
              reasonably ask about.

         So the category is out of the markup and stays on the page.
         There are no category pages on this site, so there is no URL to
         give that step, and a step without a URL cannot legally sit in
         the middle of a trail. Inventing one — pointing it back at the
         project, or at another fragment — would be marking up a page
         that does not exist, which is the thing this file refuses to do
         everywhere else.

         What is left is the shape Google documents and can verify: two
         steps, both resolving to real documents. */
      {
        '@type': 'BreadcrumbList',
        '@id': `${ORIGIN}${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Selected work', item: `${ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: p.title, item: `${ORIGIN}${url}` },
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
        /* Read off the file by scripts/images.mjs, never typed in.
           Google's Article guidance asks for the image's dimensions,
           and a hand-written pair is wrong the first time a photograph
           is recropped — silently, because nothing validates a number
           against the file it describes. Omitted rather than guessed
           if the master is not in the generated map. */
        ...(IMAGES[i.image]
          ? { width: IMAGES[i.image].width, height: IMAGES[i.image].height }
          : {}),
      },
      {
        '@type': 'Article',
        '@id': `${ORIGIN}${url}#article`,
        headline: i.title,
        description: clamp(i.blurb, 400),
        url: `${ORIGIN}${url}`,
        author: { '@id': `${ORIGIN}/#person` },
        inLanguage: 'en',
        /* When it happened, at the precision the caption rail prints.
           An Article with no date is ineligible for several of Google's
           article treatments outright, and every answer engine weighs
           recency — so the absence was costing something on all twelve
           of these. No `dateModified`: nothing here tracks when a story
           was last edited, and inventing one to satisfy a validator is
           the same class of mistake as inventing a rating. */
        ...(isoDate(i.date) ? { datePublished: isoDate(i.date) } : {}),
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
