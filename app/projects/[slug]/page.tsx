import { notFound } from 'next/navigation';

import { PROJECTS } from '../../../src/lib/projects';
import { projectSeo } from '../../../src/lib/seo';
import { SeoDocument } from '../../_seo/Document';
import { metadataFor } from '../../_seo/metadata';

/* ─────────────────────────────────────────────────────────────────
   One project, at its own URL.

   Ten documents, and the ones that carry the most words on the site:
   the lede, the summary, every build note and every feature write-up,
   in <noscript> for the readers that never run the bundle. Those are
   the words that make a project rank for anything beyond its own name.

   No hero preload here. These pages paint their own cover, not the
   portrait, and they already do it in a few hundred milliseconds —
   preloading an image the page does not render would be a wasted
   download on the connection least able to spare it.
   ───────────────────────────────────────────────────────────────── */

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const seo = projectSeo(slug);
  if (!seo) return {};
  return metadataFor(seo, 'article');
}

export default async function ProjectRoute({ params }: Params) {
  const { slug } = await params;
  const seo = projectSeo(slug);
  if (!seo) notFound();
  return <SeoDocument seo={seo} />;
}
