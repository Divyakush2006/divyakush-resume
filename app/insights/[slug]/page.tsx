import { notFound } from 'next/navigation';

import { INSIGHTS } from '../../../src/lib/insights';
import { insightSeo } from '../../../src/lib/seo';
import { SeoDocument } from '../../_seo/Document';
import { metadataFor } from '../../_seo/metadata';

/* ─────────────────────────────────────────────────────────────────
   One moment, at its own URL.

   This is a modal route. The interface it names — a story open over
   the portfolio — is not rendered here and never was: the carousel in
   the layout reads the pathname and opens the matching card, which is
   what keeps the page underneath from being torn down and rebuilt every
   time somebody steps to the next moment.

   What this route contributes is a document. Twelve of them exist so
   that a story can be linked, shared, unfurled and indexed as a piece
   of writing in its own right — each with its own title, description,
   canonical, Article node and full prose — rather than as a fragment of
   the home page that no crawler can reach.

   `hero` is set for the same reason it is set on `/`: this URL renders
   the home page, so the hero portrait is still the Largest Contentful
   Paint element and still needs its preload.
   ───────────────────────────────────────────────────────────────── */

type Params = { params: Promise<{ slug: string }> };

/** Twelve routes, from the twelve moments. Nothing is listed twice. */
export function generateStaticParams() {
  return INSIGHTS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const seo = insightSeo(slug);
  if (!seo) return {};
  return metadataFor(seo, 'article');
}

export default async function InsightPage({ params }: Params) {
  const { slug } = await params;
  const seo = insightSeo(slug);
  if (!seo) notFound();
  return <SeoDocument seo={seo} hero />;
}
