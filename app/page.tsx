import { homeSeo } from '../src/lib/seo';
import { SeoDocument } from './_seo/Document';
import { metadataFor } from './_seo/metadata';

/* The portfolio.

   This component renders no interface. The interface is mounted once
   in the root layout — see app/_components/AppShell.tsx for why — and
   what a page contributes is the part of the document that is specific
   to its URL: the head, the structured data, and the prose for readers
   that never run the bundle. */

const seo = homeSeo();

export const metadata = metadataFor(seo, 'website');

export default function HomePage() {
  return <SeoDocument seo={seo} hero />;
}
