/* ─────────────────────────────────────────────────────────────────
   When each page's content last actually changed.

   `app/sitemap.ts` used to answer this with `git log -1 -- <file>`.
   That is right on a full clone and wrong on Cloudflare Pages, which
   clones with `--depth=1`. A shallow clone has one commit and a
   grafted boundary, so git cannot tell when a file last changed and
   `git log -1 -- <path>` returns HEAD for every path that exists.

   The result shipped: all twenty-three URLs carried the deploy
   commit's timestamp, every deploy, which is precisely the "just now,
   all of them, again" pattern the git lookup was introduced to stop.
   It worked locally and degraded silently in production — the worst
   shape a bug can have.

   So the question is answered without history. Each content file is
   hashed; if the hash matches what is recorded, the recorded date
   stands, and if it does not, the content genuinely changed and the
   date becomes now. `seo/content-dates.json` is committed, so the
   build reads an answer rather than deriving one, and a date only
   moves in a diff someone can see.

   Runs at the top of `npm run build`. On a build host the hash
   matches the committed one and nothing moves.

     node scripts/content-dates.mjs
   ───────────────────────────────────────────────────────────────── */

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STORE = path.join(ROOT, 'seo', 'content-dates.json');

/* One key per body of content that a route is built from. `home`
   renders all three, so it is as new as the newest of them. */
const SOURCES = {
  projects: 'src/lib/projects.ts',
  insights: 'src/lib/insights.ts',
  certifications: 'src/lib/certifications.ts',
};

/* Seeding a key for the first time, git is still the best answer
   available — but only where it can actually answer. Cloudflare Pages
   clones with `--depth=1`: one commit, and every path reports it,
   which is the bug this file exists to fix. Shallowness alone is not
   the test — a truncated history still dates files correctly against
   the commits it has. Having exactly one commit is the test, because
   then there is nothing to tell apart. */
function firstSeen(file) {
  try {
    const commits = Number(
      execFileSync('git', ['rev-list', '--count', 'HEAD'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        cwd: ROOT,
      }).trim(),
    );
    if (!Number.isFinite(commits) || commits < 2) return null;

    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      cwd: ROOT,
    }).trim();
    if (!out) return null;
    const d = new Date(out);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

const hash = (file) =>
  crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex').slice(0, 16);

let store = {};
try {
  store = JSON.parse(fs.readFileSync(STORE, 'utf8'));
} catch {
  /* First run, or the file was removed. Everything is "changed". */
}

const now = new Date().toISOString();
const next = {};
const moved = [];

for (const [key, file] of Object.entries(SOURCES)) {
  const h = hash(file);
  const prev = store[key];
  if (prev && prev.hash === h && prev.date) {
    next[key] = prev;
  } else {
    /* No record at all: ask git, which knows. A record that no longer
       matches: the content changed, and the change is happening now. */
    const date = prev ? now : (firstSeen(file) ?? now);
    next[key] = { hash: h, date, file };
    moved.push(key);
  }
}

const serialised = JSON.stringify(next, null, 2) + '\n';
const unchanged = (() => {
  try {
    return fs.readFileSync(STORE, 'utf8') === serialised;
  } catch {
    return false;
  }
})();

if (!unchanged) {
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, serialised);
}

if (moved.length) {
  for (const key of moved) console.log(`content-dates  ${key} → ${next[key].date}`);
  console.log(`               commit seo/content-dates.json so every build reads the same answer`);
} else {
  console.log(`content-dates  ${Object.keys(next).length} sources unchanged, dates held`);
}
