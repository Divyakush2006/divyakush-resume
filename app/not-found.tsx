import type { Metadata } from 'next';

import { NAME, ORIGIN } from '../src/lib/seo';
import { PROJECTS } from '../src/lib/projects';

/* ─────────────────────────────────────────────────────────────────
   The 404, which is a real one.

   The export writes this to `out/404.html`, and Cloudflare Pages
   serves that file — with a 404 status — for any path that has no
   document of its own. The application still boots and renders its own
   NotFound screen, so a reader sees the designed page; a crawler is
   told the truth.

   That distinction is the whole point. The site used to carry a
   catch-all rewrite to index.html, which meant every mistyped URL
   answered 200 with the home page's title and canonical. Google calls
   that a soft 404 and reports it as an error, and it is how a site
   ends up with hundreds of indexed URLs that were never pages.

   `noindex, follow` for the same reason: do not index this, but do
   follow the links out of it — which is why the ten projects are
   listed below rather than left as a dead end.
   ───────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: `Page not found — ${NAME}`,
  description: 'That URL does not exist on this site.',
  robots: { index: false, follow: true },
};

export default function NotFoundDocument() {
  return (
    <noscript>
      <h1>Page not found</h1>
      <p>That URL does not exist on this site.</p>
      <ul>
        {PROJECTS.map((p) => (
          <li key={p.slug}>
            <a href={`${ORIGIN}/projects/${p.slug}`}>{p.title}</a>
          </li>
        ))}
      </ul>
      <p>
        <a href={`${ORIGIN}/`}>{NAME}</a>
      </p>
    </noscript>
  );
}
