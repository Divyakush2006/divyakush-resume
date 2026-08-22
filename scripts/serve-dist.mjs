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

function headersFor(url) {
  const out = {};
  for (const rule of RULES) {
    if (!matches(rule.pattern, url)) continue;
    for (const [name, value] of rule.headers) out[name] = value;
  }
  return out;
}

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const candidates = [
      path.join(DIST, url),
      path.join(DIST, url, 'index.html'),
      path.join(DIST, url + '.html'),
    ];

    for (const f of candidates) {
      if (fs.existsSync(f) && fs.statSync(f).isFile()) {
        res.writeHead(200, {
          'content-type': TYPES[path.extname(f)] ?? 'application/octet-stream',
          ...headersFor(url),
        });
        return res.end(fs.readFileSync(f));
      }
    }

    res.writeHead(404, {
      'content-type': 'text/html; charset=utf-8',
      ...headersFor(url),
    });
    res.end(fs.readFileSync(path.join(DIST, '404.html')));
  })
  .listen(PORT, () =>
    console.log(`cf-mimic on ${PORT}  serving ${DIST}  (${RULES.length} header rules)`),
  );
