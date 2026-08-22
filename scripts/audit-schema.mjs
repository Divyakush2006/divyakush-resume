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

   Reads the built export, so it tests what ships.

     node scripts/audit-schema.mjs
   ───────────────────────────────────────────────────────────────── */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');

const problems = [];
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
  }

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
}

console.log(`\n${graphs} documents with structured data, ${breadcrumbs} carrying a breadcrumb\n`);

if (problems.length) {
  console.log(`${problems.length} problem(s):\n`);
  for (const p of problems) console.log('  ' + p);
  console.log('');
  process.exit(1);
}

console.log('  every graph resolves, every breadcrumb is complete, and no');
console.log('  structured-data URL points at a fragment.\n');
