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
import { ROLES } from './roles';
import { FAQ, answerText } from './faq';
import { ENDORSEMENTS } from './endorsements';
import { ORG_IDS, homePlace, organisations, placeFor } from './places';

export const ORIGIN = 'https://www.divyakush.com';

/* The modal route's prefix. One string, read by the carousel that
   pushes these URLs, by the App shell that decides which tree and
   which title a path gets, and by insightSeo below — a second copy is
   how a router and a <title> start disagreeing about what a URL is. */
export const INSIGHT_PREFIX = '/insights/';
export const NAME = 'Divyakush Punjabi';
export const ROLE = 'Full Stack & AI Systems Engineer';

/* ── The other strings this person is known by ────────────────────
   Two, and the shortness of this list is the decision.

   `alternateName` means "another name for this entity". Both of these
   qualify on that test and nothing else does:

     · **Divyakush** — the mononym. It is the handle on every profile
       the site links to (`dev.to/divyakush`, `about.me/divyakush`), and
       it is what the name resolves to when somebody drops the surname.
     · **Divya Kush Punjabi** — the spaced transliteration. The same
       name, romanised the other way, which is a rendering rather than
       an error.

   ── What is deliberately not in this list ─────────────────────────
   Misspellings. The obvious move for a name that is mistyped as often
   as this one is to load `alternateName` with every phonetic variant a
   person might reach for — Divyaksh, Divykush, Divyakush Panjabi — and
   the reason it is not done here is that it does not work and it costs
   something:

     1. **`alternateName` is not a keyword field.** It is an assertion
        that the entity is *called* that. A misspelling is not another
        name for a person, and a graph that is told it is has been given
        a false statement about the entity — the same class of error as
        a fake employer, in the one node this whole site is built to
        make trustworthy.

     2. **Google already does this, better.** Query spelling correction
        happens before ranking and does not read your markup. Once
        "Divyakush Punjabi" resolves to a strong entity, "divyakush
        punjabi" mistyped resolves to it too, because the correction
        layer maps the query onto the entity Google already has. The
        variants are won by making the entity strong, which is what
        every other node in this file is for.

     3. **A list of near-identical strings on one node is a pattern
        with a name.** It is what keyword stuffing looks like after it
        moved into structured data, and it is cheap to detect precisely
        because no real entity has nine spellings.

   If a variant genuinely becomes a name he is known by — a byline, a
   handle, a legal rendering — it belongs here. A typo does not. */
export const ALTERNATE_NAMES = ['Divyakush', 'Divya Kush Punjabi'];

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

/* Both ends of a printed period — "Jun 2026 — Jul 2026", "Dec 2025 —
   Feb 2026" — for the `Role` nodes on the Person.

   `isoDate` above deliberately collapses a range to its end, because a
   credential is dated when it was awarded. An engagement is not: it
   has a start and an end, and `startDate` without `endDate` on a role
   that finished says the person still holds it. So this reads both
   halves, and returns nothing for either half it cannot parse rather
   than inventing the missing one. */
export function isoRange(printed: string | undefined): { start?: string; end?: string } {
  if (!printed) return {};
  const parts = printed.trim().split(/\s+[—–-]\s+/);
  if (parts.length < 2) return { start: isoDate(parts[0]) };
  return { start: isoDate(parts[0]), end: isoDate(parts[parts.length - 1]) };
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

const KNOWS_ABOUT = [
  'Full stack engineering', 'Machine learning', 'Retrieval-augmented generation',
  'Multi-tenant SaaS architecture', 'PostgreSQL', 'React', 'TypeScript', 'Python',
  'FastAPI', 'Django', 'Verilog HDL', 'Embedded systems', 'Computer vision',
];

/* ── The lean Person ──────────────────────────────────────────────
   Carried by all twenty-two pages that are not the home page. It is
   deliberately self-contained: every value on it is either a literal
   or a reference to `#logo`, which is in every document's graph. The
   moment it references an organisation node by `@id`, every project
   page has to carry that organisation too or the reference dangles —
   and `scripts/audit-schema.mjs` fails the build for a dangling
   reference, which is how that rule stays true.

   `alumniOf` therefore stays inline here, with names only. The full
   institutional records — postal addresses, Wikipedia articles — are
   attached to the Person on the one page that is *about* the person.
   That is where a consumer goes to resolve the entity; a project page
   only needs to say which entity authored it. */
const person: Node = {
  '@type': 'Person',
  '@id': `${ORIGIN}/#person`,
  name: NAME,
  alternateName: ALTERNATE_NAMES,
  givenName: 'Divyakush',
  familyName: 'Punjabi',
  url: `${ORIGIN}/`,
  jobTitle: ROLE,
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'Vellore Institute of Technology' },
    { '@type': 'CollegeOrUniversity', name: 'Indian Institute of Technology Ropar' },
  ],
  /* No `worksFor`. Both engagements finished in July 2026, and
     schema.org `worksFor` asserts a current one. An out-of-date
     employer is a false statement about the entity, and omitting
     the property says less but says nothing untrue. Past engagements
     are on `personFull` below as dated `Role` nodes, which is the
     form that can say "then" instead of "now". */
  knowsAbout: KNOWS_ABOUT,
  image: { '@id': `${ORIGIN}/#logo` },
  sameAs: SAME_AS,
};

/* ── Credentials ──────────────────────────────────────────────────
   The twelve documents the Certifications section renders, as
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
  /* The scan itself, at the URL it is already served from. A
     credential that names its issuer and its number is a claim; one
     that also points at the document is a claim with the document
     attached, and these are real scans under `public/certificates/`
     rather than generated plates — see the note in `certifications.ts`. */
  image: `${ORIGIN}${c.image}`,
}));

/* ── Past engagements, dated ──────────────────────────────────────
   The five roles from `roles.ts`, as `Role` nodes.

   This is the schema.org role-wrapping idiom and it is worth reading
   once, because it looks like a typo the first time: the value of
   `affiliation` is a `Role`, and that `Role` carries `affiliation`
   again, pointing at the actual Organization. The outer property names
   the relationship, the Role qualifies it with a period, and the inner
   property carries the target. It is how schema.org expresses "was,
   between these dates" for any relationship at all.

   The alternative was `worksFor`, and it is wrong twice: it asserts a
   *current* employer, and it has nowhere to put a date. Five past
   engagements stated as five current employers is a worse claim than
   no claim, which is why the property was omitted entirely before this
   existed.

   Only `parentOrganization` is attached to the employer, and only for
   the one body where the parent has been verified. No employer gets a
   guessed URL — see the note in `roles.ts`. */
const affiliations: Node[] = ROLES.map((r) => {
  const { start, end } = isoRange(r.period);
  return {
    '@type': 'Role',
    roleName: r.title,
    description: r.mandate,
    ...(start ? { startDate: start } : {}),
    ...(end ? { endDate: end } : {}),
    affiliation: {
      '@type': 'Organization',
      name: r.company,
      ...(r.orgSameAs ? { sameAs: r.orgSameAs } : {}),
      ...(r.parentOrg ? { parentOrganization: { '@id': `${ORIGIN}/${ORG_IDS[r.parentOrg]}` } } : {}),
    },
  };
});

/* ── What he does, as a labour-market category ────────────────────
   `Occupation` is the node that answers "what is this person's job" in
   a form that is comparable across entities rather than in prose.

   `occupationalCategory` is the O*NET-SOC code for Software
   Developers. A standard code is the difference between a job title
   somebody wrote and a job a taxonomy recognises — it is the same
   move as pointing `sameAs` at a Wikipedia article, applied to the
   occupation instead of to the institution.

   `occupationLocation` is the honest form of the location targeting
   this file was asked for: the city he is actually in, and the country
   he actually works across. Not a list of every metro in India. See
   the header of `places.ts` for why that distinction is load-bearing
   rather than fussy. */
const occupation: Node = {
  '@type': 'Occupation',
  '@id': `${ORIGIN}/#occupation`,
  name: ROLE,
  occupationalCategory: '15-1252.00',
  skills: KNOWS_ABOUT.join(', '),
  occupationLocation: [
    { '@id': `${ORIGIN}/#place-vellore` },
    { '@type': 'Country', name: 'India' },
  ],
};

/* ── Results, at the precision the record supports ────────────────
   Three, and each is worded the way the page that carries its evidence
   words it. `insights.ts` opens with a long note on exactly this: the
   figures on this site were once inflated in the retelling, and the
   fix was to state each result at the precision of the document behind
   it. An `award` string is the same claim in a machine-readable field,
   so it gets the same discipline — "shortlisted" where the record says
   shortlisted, and no rank where the certificate prints none. */
const awards = [
  'All India Rank 140 — National Entrepreneurship Challenge, E-Cell, IIT Bombay',
  'Shortlisted from a field of more than 400 teams — Smart India Hackathon 2025',
  'First place in track, IIC IdeaThon — shortlisted through to ElectroUtsav 2025',
];

/** The full description of the entity, for the page that is about it. */
const personFull: Node = {
  ...person,
  description:
    `${NAME} is a full stack and AI systems engineer based in Vellore, Tamil Nadu, India. ` +
    'He led engineering at LMX Labs, shipping two platforms that run in production, reads a ' +
    'B.Tech in Computer Engineering at Vellore Institute of Technology, and holds a Major ' +
    'Degree in Artificial Intelligence from IIT Ropar.',
  /* The lean node's inline `alumniOf` is replaced here by references to
     the full institutional records — postal address, Wikipedia article,
     official domain — which are nodes in this document's graph. This is
     the single strongest geographic signal on the site, and it is
     strong precisely because it is not a claim about Vellore, it is a
     claim about a university in Vellore that Google already knows. */
  alumniOf: [
    { '@id': `${ORIGIN}/${ORG_IDS.vit}` },
    { '@id': `${ORIGIN}/${ORG_IDS.iitRopar}` },
  ],
  homeLocation: { '@id': `${ORIGIN}/#place-vellore` },
  workLocation: { '@id': `${ORIGIN}/#place-vellore` },
  nationality: { '@type': 'Country', name: 'India' },
  hasOccupation: { '@id': `${ORIGIN}/#occupation` },
  affiliation: affiliations,
  award: awards,
  hasCredential: credentials,
  mainEntityOfPage: { '@id': `${ORIGIN}/#webpage` },
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

/* ── The site's own name ──────────────────────────────────────────
   `name` and `alternateName` on a WebSite node are what Google reads
   to decide the **site name** it prints above a result, in place of
   the bare domain. It is one of the few places the mononym can be
   stated as a fact about the property rather than about the person.

   `alternateName` is documented for exactly this: a shorter
   alternative Google may use instead of the full name. "Divyakush" is
   a true alternative here — it is the handle on every profile the site
   links to (dev.to/divyakush, about.me/divyakush), it is the
   `profile:username` in app/layout.tsx, and it is the string somebody
   types when they drop the surname.

   Worth being clear about what this is and is not. It is a naming
   signal, not a ranking one: it tells Google what to *call* this site
   once it has decided to show it. It does not decide whether to show
   it. For the bare "divyakush" query the deciding factors are entity
   strength and which result people click, and no property in this file
   reaches either. See the note on ALTERNATE_NAMES above for why the
   list of names is short rather than stuffed. */
const website: Node = {
  '@type': 'WebSite',
  '@id': `${ORIGIN}/#website`,
  url: `${ORIGIN}/`,
  name: NAME,
  alternateName: 'Divyakush',
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

/* ── The products ─────────────────────────────────────────────────
   The four platforms the Ground Truth for this site names as its own
   products, as SoftwareApplication, attached to the home page.

   Every one is rendered on the home page and has its own route, so
   this marks up what a reader can already see and can click through
   to. The slugs were checked against the export rather than assumed —
   a `url` on a route that does not exist is a broken claim, not a
   missing feature.

   `author` is a reference to the Person node rather than a repeated
   copy of it, which is what makes the graph one graph.

   Worth knowing what this does and does not buy: SoftwareApplication
   is only eligible for a rich result when it carries `offers`,
   `aggregateRating` or `review`. None of these have a price or a
   rating that exists, so none is invented, and none of these will draw
   a star rating in a search result. What it does do is state, in a
   form a knowledge graph can read, that this person authored these
   named applications — which is entity evidence, and the thing this
   site is actually short of. */
const PRODUCT_SLUGS = ['saturdays', 'dineguru', 'governai-research-atlas', 'governai-studio'];

const products: Node[] = PRODUCT_SLUGS.flatMap((slug) => {
  const p = PROJECTS.find((x) => x.slug === slug);
  if (!p) return [];
  const live = (p.links ?? []).find((l) => l.kind === 'live')?.href;
  return [
    {
      '@type': 'SoftwareApplication',
      '@id': `${ORIGIN}/projects/${p.slug}#app`,
      name: p.title,
      url: `${ORIGIN}/projects/${p.slug}`,
      applicationCategory: 'WebApplication',
      operatingSystem: 'Web',
      description: clamp(p.summary || p.lede),
      author: { '@id': `${ORIGIN}/#person` },
      ...(p.stack?.length ? { keywords: p.stack.join(', ') } : {}),
      ...(live ? { sameAs: live } : {}),
    },
  ];
});

/* ── The questions ────────────────────────────────────────────────
   `src/lib/faq.ts` holds the eight questions and answers;
   `src/components/FrequentQuestions.tsx` renders them on the page; this
   marks up the same array. All three read one source, which is the only
   arrangement in which the markup cannot drift out of agreement with
   what a visitor can actually read — and marked-up text a visitor
   cannot read is hidden content, which is a manual-action offence
   rather than a block that gets quietly ignored.

   ── Why FAQPage is a separate node from the ProfilePage ───────────
   `mainEntity` says what a page is principally about, and it takes one
   value. The home page's is the Person — that is the entire point of a
   ProfilePage, and it is the claim the name query is fought on. An
   FAQPage's `mainEntity` has to be the list of Questions. One node
   cannot honestly carry both.

   So the FAQ is its own node, joined to the page by `hasPart` rather
   than by having taken `mainEntity` away from the person. Both describe
   the same URL, which is normal and is exactly what `hasPart` is for:
   the questions are a part of that page, not a rival description of it.

   ── What this earns, stated honestly ──────────────────────────────
   Not a rich result. Google narrowed FAQ rich snippets to well-known
   government and health sites in August 2023, and a personal site will
   not draw the accordion however correct the markup is. It is here for
   entity resolution and for the answer engines named in
   `public/robots.txt`, which read exactly this format and cite it. See
   the header of `faq.ts`. */
const faqPage: Node = {
  '@type': 'FAQPage',
  '@id': `${ORIGIN}/#faq`,
  url: `${ORIGIN}/`,
  name: `Frequently asked questions about ${NAME}`,
  inLanguage: 'en',
  isPartOf: { '@id': `${ORIGIN}/#website` },
  about: { '@id': `${ORIGIN}/#person` },
  mainEntity: FAQ.map((entry) => ({
    '@type': 'Question',
    name: entry.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answerText(entry),
    },
  })),
};

/* ── The work, as a list ──────────────────────────────────────────
   Ten projects in the order the deck renders them.

   An `ItemList` is not decoration here. Without it a crawler sees ten
   links on a long page and has to infer that they are a set; with it,
   the page states that they are one ordered collection of this
   person's work, and each entry resolves to a document that says the
   same thing from the other end. It is the cheapest way to make ten
   separate URLs read as one body of work rather than as ten pages that
   happen to share a domain.

   Every entry is rendered on the page and every URL is a real route —
   the same test everything else in this file has to pass. */
const workList: Node = {
  '@type': 'ItemList',
  '@id': `${ORIGIN}/#work-list`,
  name: `Selected work — ${NAME}`,
  numberOfItems: PROJECTS.length,
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  itemListElement: PROJECTS.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: p.title,
    url: `${ORIGIN}/projects/${p.slug}`,
  })),
};

/* ── Endorsements ─────────────────────────────────────────────────
   `ENDORSEMENTS` is empty, deliberately and at some length — read the
   header of `src/lib/endorsements.ts` before adding to it.

   The short version: invented reviews with invented reviewers are the
   one structured-data offence Google enforces by hand, the penalty
   lands on the whole domain, and self-hosted reviews of one's own work
   have not drawn a star in a search result since 2019. There is no
   version of that trade that comes out ahead.

   This mapping exists so that a *real* endorsement — a named person,
   with a profile that resolves, quoted with their permission — is one
   entry in that file and nothing else. `reviewRating` is emitted only
   where the reviewer actually gave a number, never assigned on their
   behalf, and there is no `aggregateRating` anywhere in this file for
   the same reason. `scripts/audit-schema.mjs` fails the build if either
   rule is broken. */
const endorsementNodes: Node[] = ENDORSEMENTS.map((e, i) => ({
  '@type': 'Review',
  '@id': `${ORIGIN}/#endorsement-${i + 1}`,
  author: {
    '@type': 'Person',
    name: e.name,
    jobTitle: e.title,
    sameAs: e.sameAs,
  },
  reviewBody: e.body,
  datePublished: e.date,
  /* Only the four product slugs have a `#app` node in *this* document
     — see `products` above. An endorsement naming any other project
     would reference a node that is not in this graph, which is a
     dangling reference and a build failure. Falling back to the Person
     keeps the graph resolvable and still attributes the endorsement to
     the right entity; if a review of a non-product project is ever
     wanted, it belongs in that project's own graph in `projectSeo`. */
  itemReviewed:
    e.about && PRODUCT_SLUGS.includes(e.about)
      ? { '@id': `${ORIGIN}/projects/${e.about}#app` }
      : { '@id': `${ORIGIN}/#person` },
  ...(e.rating
    ? {
        reviewRating: {
          '@type': 'Rating',
          ratingValue: e.rating,
          bestRating: 5,
          worstRating: 1,
        },
      }
    : {}),
}));

/* ── The routes ───────────────────────────────────────────────── */

export const homeSeo = (): RouteSeo => ({
  url: '/',
  title: `${NAME} — ${ROLE}`,
  description:
    'Full stack and AI systems engineer — multi-tenant SaaS, semantic retrieval, production ML. Two platforms shipped live. VIT Vellore, AI major at IIT Ropar.',
  h1: NAME,
  body: [
    `${NAME} is a full stack and AI systems engineer based in Vellore, Tamil Nadu, India. He led engineering at LMX Labs across two live platforms, reads a B.Tech at Vellore Institute of Technology and holds a Major Degree in Artificial Intelligence from IIT Ropar, and ships production systems — multi-tenant SaaS, semantic retrieval, and machine learning services that run.`,
    `Selected work: ${PROJECTS.slice(0, 6).map((p) => p.title).join(', ')}.`,
    /* The questions, in the <noscript> prose too. Every reader that
       never runs the bundle — Bingbot, the unfurlers, and all five AI
       crawlers welcomed by name in robots.txt — gets the FAQ as text as
       well as as JSON-LD. The two say the same thing because they are
       built from the same array. */
    ...FAQ.flatMap((entry) => [entry.question, ...entry.answer]),
  ],
  schema: [
    personFull,
    logo,
    website,
    webPage('/', `${NAME} — ${ROLE}`, 'Portfolio and record of work.', {
      mainEntity: { '@id': `${ORIGIN}/#person` },
      primaryImageOfPage: { '@id': `${ORIGIN}/#logo` },
      /* See the note on `faqPage`: the questions are a part of this
         page, not a rival claim about what it is principally about. */
      hasPart: { '@id': `${ORIGIN}/#faq` },
    }),
    /* The places and institutions the Person node references by @id.
       They have to be in this document or those references dangle —
       which audit-schema.mjs fails the build for. */
    homePlace(ORIGIN),
    ...organisations(ORIGIN),
    occupation,
    faqPage,
    workList,
    ...products,
    ...endorsementNodes,
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
        /* The category the page prints above the title — "Multi-tenant
           SaaS", "Edge AI — computer vision". It is the one line that
           says what *kind* of thing this is, and it was only in the
           <h1>'s neighbourhood, not in the graph. */
        ...(p.category ? { applicationCategory: p.category } : {}),
        /* Every feature heading the page renders, as a list. These are
           real section titles on a real page, not keywords: the reader
           scrolls past all of them. A crawler had no way to see them
           because they are inside the bundle. */
        ...(p.features?.length ? { featureList: p.features.map((f) => f.title) } : {}),
        /* The interface shots the gallery renders, at their public
           URLs. `screenshot` is the property Google reads for a
           software entity's imagery, and every one of these is a file
           already being served — no image is named here that the page
           does not show. */
        ...(p.gallery?.length
          ? { screenshot: p.gallery.filter((g) => g.kind === 'product').map((g) => `${ORIGIN}${g.src}`) }
          : {}),
        ...(p.stack?.length ? { keywords: p.stack.join(', ') } : {}),
        ...(repo ? { codeRepository: repo } : {}),
        ...(live ? { targetProduct: { '@type': 'WebApplication', url: live } } : {}),
        ...(p.stack?.length ? { programmingLanguage: p.stack } : {}),
        ...(p.year ? { dateCreated: String(p.year) } : {}),
        /* Where the work was done. Every project on this site was built
           in India, and eight of the ten on the VIT Vellore campus —
           which is a true statement about the work and the only kind of
           geographic claim a project page has any business making. It
           is stated as the country rather than the campus because the
           two IIT Ropar pieces and the remote engagements were not. */
        countryOfOrigin: { '@type': 'Country', name: 'India' },
        isPartOf: { '@id': `${ORIGIN}/#website` },
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
        /* Was `{ '@type': 'Place', name: 'Vellore, Tamil Nadu' }` — a
           string a consumer can do nothing with. `placeFor` returns the
           same four Indian cities with a real postal address and the
           city's own Wikipedia article attached, so "this happened in
           Vellore" becomes a claim about a place that exists in the
           graph rather than about a phrase. Nine of these twelve
           moments are dated and located; that is nine documents tying
           this person to a named Indian city on a named date, which is
           the only geographic authority a personal site can honestly
           accumulate. Unknown cities fall back to a bare name rather
           than to an invented address — see `places.ts`. */
        ...(i.location ? { contentLocation: placeFor(i.location) } : {}),
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
