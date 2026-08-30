/* A stand-in for Cloudflare Pages, so the exported documents can be
   verified the way they will actually be served.

   Three behaviours are being reproduced, and each one has caught a real
   bug at some point:

     1. An existing file wins, a directory resolves to its index.html,
        and a path resolves to <path>.html — which is what the Next
        export writes for a route when `trailingSlash` is false.
     2. Anything else falls to 404.html with a real 404 status. Serving
        the app with a 200 for a missing page is a soft 404, and Google
        reports it as an error rather than ignoring it.
     3. public/_headers is parsed and applied. Until it was, every audit
        ran against a site with no Content-Security-Policy, no caching
        rules and no security headers — which is to say, not against the
        site being shipped. The CSP audit exists because of that gap.
     4. public/_redirects is parsed and applied, before the file lookup,
        because that is Cloudflare's documented order — a redirect is
        "always followed, regardless of whether or not an asset matches
        the incoming request". Without this a rule looks fine locally
        (nothing matches, the 404 still works) and behaves differently
        in production, which is the failure mode this whole file exists
        to prevent.

   `next dev` and `next start` are both wrong for this: the first runs a
   development bundle, and the second needs a server this site does not
   deploy. The export is static files, so the thing to test is static
   files.

     node scripts/serve-dist.mjs [port] [dir]
*/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.argv[2] || 5188);
/* The directory is an argument so the Next export and the Vite build
   it replaced can be served side by side and compared. "out" is the
   live one; "dist" only still exists while the port is being
   verified, and goes when it is. */
const DIST = path.resolve(process.argv[3] || 'out');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.xml': 'application/xml',
  '.json': 'application/json', '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.ico': 'image/x-icon',
  '.webm': 'video/webm', '.woff2': 'font/woff2',
};

/* ── _headers ─────────────────────────────────────────────────────
   Cloudflare's format: a path pattern on its own line, then indented
   `Name: value` lines. `#` comments, blank lines between blocks.
   Patterns support a `*` splat.

   Every matching block applies, in file order, and a header set twice
   takes the later value. That last part is this mimic's assumption
   rather than a documented guarantee — which is exactly why the CSP in
   public/_headers is declared once, on /*, and never refined by a
   narrower block. A policy that depends on which of two headers wins is
   a policy nobody can reason about. */
function loadHeaderRules(dir) {
  const file = path.join(dir, '_headers');
  if (!fs.existsSync(file)) return [];

  const rules = [];
  let current = null;

  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim() || line.trimStart().startsWith('#')) continue;

    if (!/^\s/.test(line)) {
      current = { pattern: line.trim(), headers: [] };
      rules.push(current);
      continue;
    }
    const at = line.indexOf(':');
    if (current && at > 0) {
      current.headers.push([line.slice(0, at).trim(), line.slice(at + 1).trim()]);
    }
  }
  return rules;
}

const matches = (pattern, url) => {
  if (pattern === url) return true;
  if (!pattern.includes('*')) return false;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(url);
};

const RULES = loadHeaderRules(DIST);

/* ── _redirects ──────────────────────────────────────────
   `<source> <destination> [status]`, one per line, `#` comments.
   Status defaults to 302 when omitted, which is Cloudflare's default
   and not an assumption worth inheriting silently — every rule this
   site ships names its status.

   Only the exact-match and single-splat forms are implemented, because
   they are the only forms in public/_redirects. A rule using a
   placeholder like /:id would parse here and not work, so it would be
   better to fail loudly — but adding a parser for syntax nothing uses
   is how a mimic drifts from the thing it mimics. If a placeholder
   rule is ever added, this needs to grow with it. */
function loadRedirectRules(dir) {
  const file = path.join(dir, '_redirects');
  if (!fs.existsSync(file)) return [];

  const rules = [];
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.replace(/\r$/, '').trim();
    if (!line || line.startsWith('#')) continue;

    const [from, to, status] = line.split(/\s+/);
    if (!from || !to) continue;
    rules.push({ from, to, status: Number(status) || 302 });
  }
  return rules;
}

const REDIRECTS = loadRedirectRules(DIST);

/** The first matching rule wins, as on Pages. */
function redirectFor(url) {
  for (const r of REDIRECTS) {
    if (r.from === url) return r;
    if (r.from.endsWith('/*')) {
      const base = r.from.slice(0, -2);
      if (url === base || url.startsWith(base + '/')) {
        return { ...r, to: r.to.replace(':splat', url.slice(base.length + 1)) };
      }
    }
  }
  return null;
}


function headersFor(url) {
  const out = {};
  for (const rule of RULES) {
    if (!matches(rule.pattern, url)) continue;
    for (const [name, value] of rule.headers) out[name] = value;
  }
  return out;
}

/** The file that answers a path, by Pages' resolution order. */
function resolveFile(url) {
  const candidates = [
    path.join(DIST, url),
    path.join(DIST, url, 'index.html'),
    path.join(DIST, url + '.html'),
  ];
  return candidates.find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
}

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);

    /* Before the file lookup, not after: Cloudflare follows a matching
       redirect even when a file would have answered. */
    const redirect = redirectFor(url);
    if (redirect) {
      /* ── Status 200 is a rewrite, not a redirect ──────────────────
         Cloudflare serves the destination's *content* at the source
         URL, with no hop and no Location header. This mimic used to
         treat every rule the same way — `writeHead(status, {location})`
         — which for a 200 produced the one response Cloudflare never
         produces: a 200, carrying a Location header, with an empty
         body.

         It went unnoticed for as long as every rule in
         `public/_redirects` was a real redirect. It stopped being
         unnoticeable when the Search Console verification file needed a
         rewrite to answer 200 at its `.html` URL, because that is a
         rule whose entire purpose is the body — and this server
         reported it fixed while serving nothing.

         A mimic that is wrong about the one behaviour you are testing
         is worse than no mimic, so it now does what Pages does. */
      if (redirect.status === 200) {
        const target = resolveFile(redirect.to);
        if (target) {
          res.writeHead(200, {
            'content-type': TYPES[path.extname(target)] ?? 'application/octet-stream',
            ...headersFor(url),
          });
          return res.end(fs.readFileSync(target));
        }
        /* A rewrite naming a path that does not exist is a broken rule.
           Say so rather than falling through to a 404 that looks like a
           missing page. */
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        return res.end(`_redirects rewrites ${url} to ${redirect.to}, which does not exist\n`);
      }

      res.writeHead(redirect.status, { location: redirect.to, ...headersFor(url) });
      return res.end();
    }

    const found = resolveFile(url);
    if (found) {
      res.writeHead(200, {
        'content-type': TYPES[path.extname(found)] ?? 'application/octet-stream',
        ...headersFor(url),
      });
      return res.end(fs.readFileSync(found));
    }

    res.writeHead(404, {
      'content-type': 'text/html; charset=utf-8',
      ...headersFor(url),
    });
    res.end(fs.readFileSync(path.join(DIST, '404.html')));
  })
  .listen(PORT, () =>
    console.log(
      `cf-mimic on ${PORT}  serving ${DIST}  ` +
        `(${RULES.length} header rules, ${REDIRECTS.length} redirects)`,
    ),
  );
