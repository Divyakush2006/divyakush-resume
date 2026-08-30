/* ─────────────────────────────────────────────────────────────────
   The five engagements, once.

   ── Why this left the component ───────────────────────────────────
   This array lived inside `src/components/ExperienceRoles.tsx`, which
   was fine for as long as the only thing that needed it was the
   section that renders it. It is not fine now: `src/lib/seo.ts` marks
   the same five engagements up as structured data, and a record that
   exists in two places is a record that will eventually disagree with
   itself about a date.

   Every other body of content on this site already lives in `lib/` for
   exactly this reason — `projects.ts`, `insights.ts`,
   `certifications.ts`, `content.ts`. This is that pattern applied to
   the one dataset that had escaped it. The component imports it and
   renders it unchanged; nothing about the section moved.

   ── The schema fields ─────────────────────────────────────────────
   `orgSameAs` and `parentOrg` are additions, and both are optional
   because the honest answer for most of these is "not known". Four of
   the five employers have no public domain that has been verified, so
   none is invented for them — an `Organization` with a real name and
   no URL is a true statement, and one with a guessed URL is not.

   `parentOrg` exists for the one case where the hosting institution is
   itself a resolvable entity: E-Cell is the entrepreneurship cell *of*
   IIT Bombay, and saying so in the graph attaches this record to an
   organisation with a Wikipedia article and a postal address. See
   `places.ts` for why that matters more than it looks.
   ───────────────────────────────────────────────────────────────── */

import { ORG_IDS } from './places';

export interface Role {
  company: string;
  title: string;
  period: string;
  /** Short form for the card corner and the index. */
  span: string;
  /** How the engagement was run. */
  mode: string;
  /** Length of the engagement, read off `period`. */
  term: string;
  /** One line: what the job actually was. */
  mandate: string;
  /** What got done. One line each — this is a record, not a memoir. */
  work: string[];
  /** The single number the role is judged on. */
  outcome: { value: string; label: string };
  stack: string[];
  /** A profile for the employer, where one has been verified. */
  orgSameAs?: string;
  /** The institution this body belongs to, as a key of ORG_IDS. */
  parentOrg?: keyof typeof ORG_IDS;
}

export const ROLES: Role[] = [
  {
    company: 'LMX Labs',
    title: 'Software Engineering Lead',
    period: 'Jun 2026 — Jul 2026',
    span: '2026',
    mode: 'On-site · Team lead',
    term: 'Two months',
    mandate:
      'Sole technical lead for the LMX Labs product ecosystem — architecture and execution across two live platforms, and the engineering team building them.',
    work: [
      'Architected and shipped Saturdays end to end: discovery, ordering, and PhonePe/Stripe payments.',
      'Built DineGuru — inventory, kitchen ticketing, recipe costing, procurement and billing analytics on one multi-tenant core.',
      'Integrated both platforms over REST APIs and webhooks for real-time synchronisation.',
      'Directed a student engineering team against a live release schedule.',
    ],
    outcome: { value: 'Two', label: 'Platforms live in production' },
    stack: ['FastAPI', 'PostgreSQL', 'React', 'Radix', 'Webhooks', 'Stripe'],
  },
  {
    company: 'GovernAI',
    title: 'Web Developer Intern',
    period: 'May 2026 — Jul 2026',
    span: '2026',
    mode: 'Remote',
    term: 'Three months',
    mandate:
      'Built the retrieval side of GovernAI’s open-source research tooling, and owned the frontend of its governance training simulator.',
    work: [
      'Designed and built Research Atlas, unifying papers, repositories and governance resources into one semantic search.',
      'Implemented retrieval on ChromaDB vector search with Sentence-Transformer embeddings across OpenAlex and GitHub.',
      'Owned the GovernAI Studio frontend and extended its Django, Celery and hybrid RAG inference pipeline.',
      'Shipped the corporate site with a technical SEO strategy that improved organic visibility.',
    ],
    outcome: { value: 'Three', label: 'Products shipped in one internship' },
    stack: ['React', 'TypeScript', 'FastAPI', 'ChromaDB', 'Django', 'Celery', 'RAG'],
  },
  {
    company: 'VUBS Corporation',
    title: 'Web Developer',
    period: 'Dec 2025 — Feb 2026',
    span: '2025 — 26',
    mode: 'Contract · Solo',
    term: 'Three months',
    mandate: 'Sole engineer on a full-cycle corporate build for a BASF partner.',
    work: [
      'Ran requirements and information architecture through to a responsive, performance-optimised site.',
      'Implemented a technical SEO strategy that outranked established competitors for key product categories.',
      'Rebuilt asset delivery on WebP/WebM.',
    ],
    outcome: { value: '40%', label: 'Reduction in Time-to-Interactive' },
    stack: ['React', 'Vite', 'TailwindCSS', 'SEO audit', 'Performance'],
  },
  {
    company: 'LayOver',
    title: 'UI/UX Designer & Frontend Intern',
    period: 'Aug 2025 — Oct 2025',
    span: '2025',
    mode: 'Remote',
    term: 'Three months',
    mandate: 'Took product flows from research through to production React components.',
    work: [
      'Produced high-fidelity wireframes and interactive user flows in Figma.',
      'Translated prototypes into responsive, production React components.',
      'Ran user research and usability testing on the mobile flows.',
    ],
    outcome: { value: '20%', label: 'Increase in mobile retention' },
    stack: ['Figma', 'React', 'Component library', 'User research'],
  },
  {
    company: 'E-Cell, IIT Bombay',
    title: 'Team Lead, Visionary Ventures',
    period: 'Jan 2025 — Feb 2025',
    span: '2025',
    mode: 'Competition',
    term: 'Two months',
    mandate: 'Led the team representing VIT Vellore at the National Entrepreneurship Challenge.',
    work: [
      'Ran outreach campaigns, startup model structuring and entrepreneurship workshops.',
      'Delegated and tracked project workstreams to hit every submission deadline.',
    ],
    outcome: { value: 'AIR 140', label: 'National Entrepreneurship Challenge' },
    stack: ['Leadership', 'Product strategy', 'SaaS modelling', 'Outreach'],
    /* The one employer that resolves to an institution with a public
       record. E-Cell's own domain is not named here because it has not
       been verified; the parent has been. */
    parentOrg: 'iitBombay',
  },
];
