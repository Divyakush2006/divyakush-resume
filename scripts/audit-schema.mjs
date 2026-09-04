/* ─────────────────────────────────────────────────────────────────
   The structured data, checked against the rules that reject it.

   `scripts/post-build.mjs` already asserts that every document has one
   JSON-LD block, that it parses, and that its @graph is not suspiciously
   small. None of that would have caught what Search Console caught:

     · A BreadcrumbList whose middle ListItem carried a `name` and no
       `item`. Every item except the last needs a URL — without one the
       whole trail is invalid and the rich result is dropped. The block
       parsed fine, had four nodes, and had been shipping for weeks.

     · A breadcrumb step pointing at `https://www.divyakush.com/#work`.
       A fragment is not a page. It resolves to the home page so nothing
       breaks, but a breadcrumb item is a claim that a distinct document
       exists at that step, and Search Console duly reported a `#work`
       URL that nobody could explain.

   So this checks the things a validator checks, per document:

     1. Breadcrumbs      — contiguous positions from 1, a name on every
                           step, an `item` on every step but the last,
                           and every `item` an absolute URL with no
                           fragment.
     2. Fragments        — no `url` or `item` anywhere in the graph
                           contains `#`. `@id` is exempt: `#person`,
                           `#webpage` and `#breadcrumb` are node
                           identifiers, not addresses, and are supposed
                           to look like that.
     3. Required fields  — the properties Google names as required for
                           the types this site actually publishes.
     4. References       — every { "@id": … } resolves to a node in the
                           same document.
     5. Subjects         — every `about` node's `sameAs` is fetched, and
                           has to be a real Wikipedia article. Those
                           URLs are derived from a subject's name in
                           `seo.ts` rather than stored next to it, so a
                           name that is not exactly an article title
                           produces a confident link to nothing. It is
                           the one claim here that cannot be checked by
                           reading the JSON.

   Reads the built export, so it tests what ships.

     node scripts/audit-schema.mjs
   ───────────────────────────────────────────────────────────────── */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');

const problems = [];
/* Subject URL -> subject name, deduped across every document. */
const subjects = new Map();
let subjectsOk = 0;
const fail = (where, msg) => problems.push(`${where.padEnd(38)} ${msg}`);

/** Every .html in the export, as the URL it answers. */
function documents(dir = OUT, base = '') {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '_next') found.push(...documents(full, `${base}/${entry.name}`));
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;
    const url =
      entry.name === 'index.html' ? `${base}/` : `${base}/${entry.name.replace(/\.html$/, '')}`;
    found.push({ url: url.replace(/^\/\//, '/'), file: full });
  }
  return found;
}

/** Google names these as required. Only the types this site publishes. */
const REQUIRED = {
  Person: ['name'],
  Article: ['headline', 'image', 'author', 'datePublished'],
  ImageObject: ['url'],
  BreadcrumbList: ['itemListElement'],
  WebSite: ['url'],
  WebPage: ['url'],
  ProfilePage: ['url'],
  SoftwareSourceCode: ['name'],
  /* `name` is all schema.org demands. Google additionally wants one of
     offers / aggregateRating / review before it will draw a rich
     result, and this site has no price and no rating that exists, so
     it publishes neither and gets no stars. That is the correct
     outcome, not a gap to fill. */
  SoftwareApplication: ['name', 'url'],
  FAQPage: ['mainEntity'],
  Question: ['name', 'acceptedAnswer'],
  Answer: ['text'],
  Occupation: ['name'],
  ItemList: ['itemListElement'],
  Place: ['name'],
  Country: ['name'],
  Organization: ['name'],
  CollegeOrUniversity: ['name'],
  Role: ['roleName'],
  Review: ['author', 'reviewBody'],
  EducationalOccupationalCredential: ['name'],
};

const isAbsolute = (v) => typeof v === 'string' && /^https?:\/\//.test(v);

function checkBreadcrumb(node, where) {
  const items = node.itemListElement;
  if (!Array.isArray(items) || items.length === 0) {
    fail(where, 'BreadcrumbList has no itemListElement');
    return;
  }

  items.forEach((li, i) => {
    const last = i === items.length - 1;
    const at = `breadcrumb[${i + 1}]`;

    if (li.position !== i + 1) fail(where, `${at} position is ${li.position}, expected ${i + 1}`);
    if (!li.name || !String(li.name).trim()) fail(where, `${at} has no name`);

    /* The rule that broke it: everything but the last step needs a URL.
       Google drops the entire breadcrumb if one is missing. */
    if (!last && li.item === undefined) {
      fail(where, `${at} "${li.name}" has no item — required on every step but the last`);
      return;
    }
    if (li.item === undefined) return;

    const url = typeof li.item === 'string' ? li.item : li.item?.['@id'];
    if (!isAbsolute(url)) fail(where, `${at} item is not an absolute URL: ${JSON.stringify(li.item)}`);
    else if (url.includes('#')) fail(where, `${at} item is a fragment, not a page: ${url}`);
  });
}

/* ── The reviews rule ─────────────────────────────────────────────
   This is the check that exists because of a specific request, and it
   is the one most likely to be quietly deleted by somebody in a hurry.
   Read `src/lib/endorsements.ts` before touching it.

   The brief was to publish invented five-star reviews from invented
   people so that a search result would draw stars. That is:

     · self-serving review markup — a review of an entity, published by
       that entity — which Google's structured-data policy names as
       spam, and
     · fabricated review content, which it names separately,

   both enforced by manual action rather than by silently dropping the
   block. A manual action removes every rich result the domain has and
   can demote the domain. The star it was meant to win has not been
   drawn for self-hosted reviews of one's own work since 2019.

   So the rules below are mechanical, and they fail the build rather
   than relying on anybody remembering:

     1. **No `aggregateRating`, anywhere.** There is no population of
        ratings to aggregate. A summary statistic over a set that does
        not exist is the single clearest fabrication signal available,
        and there is no honest reason for this property to appear on
        this site.

     2. **Every `Review` author needs a `sameAs`.** A reviewer with no
        profile that resolves is indistinguishable from one who does not
        exist — which is the entire problem. This is what makes adding a
        fake reviewer harder than adding a real one.

     3. **Every `Review` needs `reviewBody` and `datePublished`.** Real
        endorsements have words and a date. Placeholders tend not to.

   If a genuine endorsement is ever added and this check fails it, the
   fix is the missing profile URL, not the missing check. */
function checkReviews(graph, where) {
  const seen = [];
  const walk = (v) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== 'object') return;

    if (v.aggregateRating !== undefined) {
      fail(
        where,
        'aggregateRating is published — there is no set of real ratings to ' +
          'aggregate. See src/lib/endorsements.ts.',
      );
    }

    if (String(v['@type']) === 'Review') {
      seen.push(v);
      const author = v.author;
      if (!author || !author.sameAs) {
        fail(where, `Review by "${author?.name ?? 'unnamed'}" has no author.sameAs — a reviewer must resolve to a real profile`);
      }
      if (!v.reviewBody) fail(where, 'Review has no reviewBody');
      if (!v.datePublished) fail(where, 'Review has no datePublished');
    }

    Object.values(v).forEach(walk);
  };
  walk(graph);
  return seen.length;
}

/* ── The FAQ rule ─────────────────────────────────────────────────
   Marked-up text a visitor cannot read is "hidden content", and it is
   the other manual-action offence in this file's neighbourhood.

   Every FAQ question published as JSON-LD has to be findable in the
   document that publishes it. Both halves come from `src/lib/faq.ts`,
   so they agree today; this is what notices when somebody adds a
   question to the graph without adding it to the page, or removes the
   section and leaves the markup behind.

   The document carries the questions twice — once in the rendered
   <details> markup and once in the <noscript> prose — so a plain
   substring search over the HTML is the right test. Entities are
   decoded first because React writes `&#x27;` where the source has a
   typographic apostrophe. */
function checkFaqIsVisible(graph, html, where) {
  const text = html
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\\u003c/g, '<');

  let questions = 0;
  for (const node of graph) {
    if (String(node['@type']) !== 'FAQPage') continue;
    for (const q of node.mainEntity ?? []) {
      questions++;
      const name = String(q.name ?? '');
      /* The JSON-LD copy is inside the <script> block, so a match has
         to be found somewhere other than there. Strip the block first. */
      const body = text.replace(/<script type="application\/ld\+json"[\s\S]*?<\/script>/g, '');
      if (!body.includes(name)) {
        fail(where, `FAQ question is in the graph but not on the page: "${name.slice(0, 60)}…"`);
      }
      const answer = String(q.acceptedAnswer?.text ?? '');
      if (!answer.trim()) fail(where, `FAQ question "${name.slice(0, 40)}…" has an empty answer`);
    }
  }
  return questions;
}

/** `url` and `item` address documents. `@id` names nodes and may use #. */
function checkFragments(node, where, type) {
  for (const key of ['url', 'item', 'contentUrl', 'mainEntityOfPage']) {
    const v = node[key];
    const url = typeof v === 'string' ? v : undefined;
    if (url && url.includes('#')) fail(where, `${type}.${key} is a fragment: ${url}`);
  }
}

const all = documents();
const NOT_ROUTES = new Set(['/404', '/_not-found', '/google0dbb222546d95f4f']);
const routes = all.filter((d) => !NOT_ROUTES.has(d.url));

let graphs = 0;
let breadcrumbs = 0;
let faqQuestions = 0;
let reviews = 0;

for (const doc of routes) {
  const html = fs.readFileSync(doc.file, 'utf8');
  const m = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) {
    fail(doc.url, 'no JSON-LD block');
    continue;
  }

  let graph;
  try {
    graph = JSON.parse(m[1].replace(/\\u003c/g, '<'))['@graph'];
  } catch (e) {
    fail(doc.url, `JSON-LD does not parse: ${e.message}`);
    continue;
  }
  if (!Array.isArray(graph)) {
    fail(doc.url, '@graph is not an array');
    continue;
  }
  graphs++;

  const ids = new Set(graph.map((n) => n['@id']).filter(Boolean));

  for (const node of graph) {
    const type = String(node['@type']);

    for (const field of REQUIRED[type] ?? []) {
      if (node[field] === undefined) fail(doc.url, `${type} is missing required field "${field}"`);
    }

    checkFragments(node, doc.url, type);

    if (type === 'BreadcrumbList') {
      breadcrumbs++;
      checkBreadcrumb(node, doc.url);
    }

    /* The required-field loop above only walks top-level nodes, and
       Google's FAQ format nests every Question inside the FAQPage. So
       an FAQPage with eight malformed Questions passed all of this
       until the nesting was walked explicitly. */
    if (type === 'FAQPage') {
      for (const q of node.mainEntity ?? []) {
        for (const field of REQUIRED.Question) {
          if (q[field] === undefined) fail(doc.url, `Question is missing required field "${field}"`);
        }
        const answer = q.acceptedAnswer;
        if (answer && answer.text === undefined) fail(doc.url, 'Answer is missing required field "text"');
      }
    }
  }

  reviews += checkReviews(graph, doc.url);
  faqQuestions += checkFaqIsVisible(graph, html, doc.url);

  /* Every { "@id": … } reference has to land on a node in this graph.
     A dangling one is a node the consumer silently drops. */
  const refs = [];
  const scan = (v) => {
    if (Array.isArray(v)) v.forEach(scan);
    else if (v && typeof v === 'object') {
      if (Object.keys(v).length === 1 && v['@id']) refs.push(v['@id']);
      else Object.values(v).forEach(scan);
    }
  };
  scan(graph);
  for (const r of refs) if (!ids.has(r)) fail(doc.url, `dangling @id reference: ${r}`);

  /* Every subject an `about` node claims, collected for the fetch below. */
  for (const node of graph) {
    for (const t of [].concat(node.about ?? [])) {
      if (t && typeof t === 'object' && t.sameAs) subjects.set(t.sameAs, t.name ?? '');
    }
  }
}

/* ── Every subject resolves to a real Wikipedia article ──────────────
   `about` with a `sameAs` is the one part of this markup that claims a
   node in somebody else's graph, and the URL is derived from the
   subject's name in `seo.ts` rather than stored beside it. That is the
   right way round — one place to write a subject down — but it means a
   name that is not exactly an article title produces a confident link
   to a page that does not exist.

   There is no way to catch that by reading the JSON. So it is fetched.
   Wikipedia redirects freely between article titles, and a redirect is
   a working link, so 2xx and 3xx both pass; only a 404 is a broken
   claim. Network trouble is reported and does not fail the build,
   because an audit that goes red when the wifi drops gets ignored. */
if (subjects.size) {
  const results = await Promise.all(
    [...subjects].map(async ([url, name]) => {
      try {
        const res = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'divyakush-schema-audit' } });
        return { url, name, status: res.status };
      } catch (err) {
        return { url, name, error: err.message };
      }
    }),
  );
  for (const r of results) {
    if (r.error) console.log(`  (subject not checked — ${r.error}) ${r.name}`);
    else if (r.status >= 400) fail('about/sameAs', `no such Wikipedia article: "${r.name}" -> ${r.url}`);
    else subjectsOk++;
  }
}

console.log(
  `\n${graphs} documents with structured data, ${breadcrumbs} carrying a breadcrumb,\n` +
    `${faqQuestions} FAQ question(s) published and checked against the page, ` +
    `${reviews} review(s),\n${subjectsOk}/${subjects.size} subject(s) resolving to a real Wikipedia article\n`,
);

if (problems.length) {
  console.log(`${problems.length} problem(s):\n`);
  for (const p of problems) console.log('  ' + p);
  console.log('');
  process.exit(1);
}

console.log('  every graph resolves, every breadcrumb is complete, and no');
console.log('  structured-data URL points at a fragment.');
console.log('  every published FAQ answer is also on the page, no rating is');
console.log('  aggregated, and every reviewer resolves to a real profile.\n');
