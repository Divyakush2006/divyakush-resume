/* ─────────────────────────────────────────────────────────────────
   Tell Bing and Yandex what changed, instead of waiting to be asked.

   ── Why this exists ───────────────────────────────────────────────
   `public/031efabb1f4325fc803bd6dae35356e0.txt` has been served for
   months. It is an IndexNow key: a file whose name is a secret and
   whose contents are that same secret, which proves to a participating
   engine that whoever is submitting URLs controls this host.

   Nothing ever submitted anything. The key was published and then not
   used, which is the whole protocol minus the part that does the work.

   IndexNow is a push. Rather than waiting for a crawler to come back
   on its own schedule — which for a domain with almost no history is
   measured in weeks — it says "these URLs changed, come now". It is
   free, it is a single HTTP request, and it is supported by Bing,
   Yandex, Seznam and Naver. Google does not participate; Google's
   equivalent is the sitemap `lastmod` this repo already maintains
   honestly in `seo/content-dates.json`, plus Search Console.

   ── What it submits, and why not everything ───────────────────────
   Only URLs whose content actually changed since the last submission,
   read from the same `seo/content-dates.json` that drives sitemap
   `lastmod`. Not the whole sitemap on every deploy.

   That restraint is the protocol's own guidance and it is worth
   taking seriously: IndexNow's documentation is explicit that
   submitting unchanged URLs repeatedly is grounds for having
   submissions ignored or the key rejected. A build that pushed
   twenty-three URLs every time a CSS class changed would train the
   engines to disregard this host — the opposite of the intent, and
   invisible until it had been happening for months.

   The state file records what was submitted and when, so a rebuild
   that changes nothing submits nothing and says so.

   ── Failure is not a build failure ────────────────────────────────
   This runs after a successful build and exits 0 whatever happens. A
   deploy must not fail because a third-party endpoint was briefly
   unreachable — the site is correct either way, and the next content
   change will submit again. Errors are printed, not thrown.

   ── Usage ────────────────────────────────────────────────────────
     node scripts/indexnow.mjs           submit changed URLs
     node scripts/indexnow.mjs --all     submit every route (use once,
                                         e.g. after a domain move)
     node scripts/indexnow.mjs --dry     print what would be sent
   ───────────────────────────────────────────────────────────────── */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://www.divyakush.com';
const HOST = 'www.divyakush.com';

/* The key is the filename, minus the extension, of the token file in
   public/. Read from disk rather than typed here, so the two cannot
   drift — a submission with a key that does not match the served file
   is rejected, and silently, since the endpoint answers 202 first and
   validates afterwards. */
function readKey() {
  const dir = path.join(ROOT, 'public');
  const file = fs
    .readdirSync(dir)
    .find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (!file) return null;

  const key = file.replace(/\.txt$/, '');
  const contents = fs.readFileSync(path.join(dir, file), 'utf8').trim();

  /* The file must contain the key and nothing else. A mismatch is the
     one failure mode that looks like success from here. */
  if (contents !== key) {
    console.log(`  indexnow    key file ${file} does not contain its own key — not submitting`);
    return null;
  }
  return key;
}

const STORE = path.join(ROOT, 'seo', 'indexnow-submitted.json');
const DATES = path.join(ROOT, 'seo', 'content-dates.json');

const args = new Set(process.argv.slice(2));
const dry = args.has('--dry');
const all = args.has('--all');

/* Every route, from the export rather than from a list kept by hand.
   The sitemap is generated from `allRoutes()`; reading the built files
   means this submits what actually shipped. */
function routes() {
  const out = path.join(ROOT, 'out');
  if (!fs.existsSync(out)) return [];

  const found = [];
  const walk = (dir, base = '') => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '_next') walk(full, `${base}/${entry.name}`);
        continue;
      }
      if (!entry.name.endsWith('.html')) continue;
      const url =
        entry.name === 'index.html' ? `${base}/` : `${base}/${entry.name.replace(/\.html$/, '')}`;
      found.push(url.replace(/^\/\//, '/'));
    }
  };
  walk(out);

  /* The 404, Next's internal not-found, and the Search Console
     verification file are documents but not routes. Submitting a 404
     to an index is asking it to record an error. */
  const NOT_ROUTES = new Set(['/404', '/_not-found', '/google0dbb222546d95f4f']);
  return found.filter((u) => !NOT_ROUTES.has(u)).sort();
}

const read = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
};

const key = readKey();
if (!key) {
  console.log('  indexnow    no key file in public/ — nothing submitted');
  process.exit(0);
}

const dates = read(DATES, {});
const submitted = read(STORE, {});

/* The newest content date across every source. A route is worth
   resubmitting when the content it is built from is newer than the
   last time this told anyone about it.

   Deliberately coarse: this maps a route to the newest of *all*
   content dates rather than to its own, because `content-dates.json`
   is keyed by content module and a project page is built from
   `projects.ts` alone while the home page is built from all of them.
   Erring toward resubmitting a project page when insights changed
   would be the wasteful direction, so the per-route mapping below
   mirrors app/sitemap.ts instead of guessing. */
const dateFor = (url) => {
  const pick = (k) => dates[k]?.date;
  if (url.startsWith('/projects/')) return pick('projects');
  if (url.startsWith('/insights/')) return pick('insights');
  /* The home page renders all of it. */
  return Object.values(dates)
    .map((d) => d.date)
    .sort()
    .pop();
};

const changed = routes().filter((url) => {
  if (all) return true;
  const d = dateFor(url);
  if (!d) return false;
  const last = submitted[url];
  return !last || last < d;
});

if (changed.length === 0) {
  console.log('  indexnow    nothing changed since the last submission');
  process.exit(0);
}

const payload = {
  host: HOST,
  key,
  keyLocation: `${ORIGIN}/${key}.txt`,
  urlList: changed.map((u) => `${ORIGIN}${u}`),
};

if (dry) {
  console.log(`  indexnow    would submit ${changed.length} URL(s):`);
  for (const u of payload.urlList) console.log(`              ${u}`);
  process.exit(0);
}

/* One endpoint. api.indexnow.org shares a submission with every
   participating engine, so submitting to each of them separately is
   the same URLs several times over — which is exactly the behaviour
   the rate guidance warns about. */
try {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  /* 200 and 202 are both success — 202 means accepted, key validation
     pending, which is the normal answer. */
  if (res.ok) {
    const now = new Date().toISOString();
    for (const u of changed) submitted[u] = now;
    fs.mkdirSync(path.dirname(STORE), { recursive: true });
    fs.writeFileSync(STORE, JSON.stringify(submitted, null, 2) + '\n');
    console.log(`  indexnow    submitted ${changed.length} URL(s)  (HTTP ${res.status})`);
    console.log('              commit seo/indexnow-submitted.json so the next build knows');
  } else {
    /* 403 is a key that did not validate, 422 a URL that does not
       belong to the host. Both are worth reading rather than
       retrying. */
    console.log(`  indexnow    endpoint answered HTTP ${res.status} — not recording a submission`);
  }
} catch (err) {
  console.log(`  indexnow    could not reach the endpoint (${err.message}) — skipped`);
}
