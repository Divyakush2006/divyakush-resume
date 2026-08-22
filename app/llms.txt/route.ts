import { NAME, ORIGIN, SAME_AS, allRoutes } from '../../src/lib/seo';

/* ─────────────────────────────────────────────────────────────────
   llms.txt

   An emerging convention: a markdown index at the root answering "what
   is this site, and what on it is worth reading" without a crawler
   having to infer it from navigation. It costs nothing, and the
   engines that read it are exactly the ones that cite rather than
   rank.

   Built from the same `allRoutes()` the sitemap and every <head> come
   from, so it cannot drift into describing a site that no longer
   exists — which is the failure mode of a hand-written index, and a
   silent one.

   `force-static` is what makes this legal under `output: 'export'`: the
   handler runs once at build time and its response is written to a
   file. No request ever reaches this function in production.
   ───────────────────────────────────────────────────────────────── */

export const dynamic = 'force-static';

export function GET() {
  const routes = allRoutes();
  const list = (prefix: string) =>
    routes
      .filter((r) => r.url.startsWith(prefix))
      .map((r) => `- [${r.h1}](${ORIGIN}${r.url}): ${r.description}`)
      .join('\n');

  const body =
    `# ${NAME}\n\n` +
    `> Full stack and AI systems engineer. Led engineering at LMX Labs across two ` +
    `platforms live in production, reading a ` +
    `B.Tech at Vellore Institute of Technology, holding a Major Degree in ` +
    `Artificial Intelligence from IIT Ropar. Builds multi-tenant SaaS platforms, ` +
    `semantic retrieval pipelines and production machine learning services.\n\n` +
    `Canonical home: ${ORIGIN}/\n\n` +
    `## Projects\n\n${list('/projects/')}\n\n` +
    `## Record\n\n${list('/insights/')}\n\n` +
    `## Elsewhere\n\n${SAME_AS.map((u) => `- ${u}`).join('\n')}\n`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
