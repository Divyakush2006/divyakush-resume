/* ─────────────────────────────────────────────────────────────────
   Certifications.

   Every row here is a document that exists. The file previously
   carried eighteen entries of which seventeen were openly declared
   placeholders — AWS, Meta, NVIDIA, HashiCorp, MongoDB, Stanford,
   Oracle and ten more, written as dummy content to size the section
   against and never earned. They are gone. A portfolio that lists a
   credential its owner does not hold is the one defect that cannot be
   argued down in an interview, and seventeen of them was the largest
   single risk on this site.

   What replaced them is six credentials, each read off the scan in
   Certifications/ and transcribed field by field:

     · IIT Ropar — Major Certification in AI, ref IITRPRAI-CC6722,
       Jan 2025 to Jun 2026, run with NSDC and Masai.
     · GovernAI — web developer internship, reg 011413, 11 May to
       30 Jun 2026.
     · VUBS Corporation — certificate of appreciation for the corporate
       website, signed by three partners.
     · LayOver — UI/UX design internship, 23 Mar to 20 Jul 2025. Two
       documents exist for this one, a completion certificate and a
       reference letter; the certificate is the artwork and the letter
       is filed alongside it as layover-uiux-letter.webp.
     · LinkedIn Learning with Microsoft — generative AI productivity
       path, 21 Oct 2024, 4h51m.
     · NEC 2024 — E-Cell, IIT Bombay. See the note on that entry: the
       certificate evidences participation in the Basic Track and does
       not state a rank.

   Where a document prints no credential number the field is absent
   rather than invented, and the lightbox omits the row.

   `slug` doubles as the artwork filename:
     public/certificates/<slug>.webp
   Those are real scans, not the generated plates that
   scripts/generate-certificates.mjs draws. The generator is kept for
   any future placeholder but nothing in this file points at it.

   The scans are normalised before they ship — trimmed of the white
   the issuer or the scanner left around them, then centred on one
   1414x1000 canvas with one margin, by
   scripts/normalise-certificates.mjs. Without that step the documents
   arrive at ratios from 0.75 to 1.55 with wildly different amounts of
   baked-in margin, and the grid renders twelve different sizes into
   twelve identical frames. Add a slug there when you add one here.
   ───────────────────────────────────────────────────────────────── */

export const CERT_TRACKS = [
  'AI & ML',
  'Engineering',
  'Web & Product',
  'Design',
  'Competitions',
] as const;

export type CertTrack = (typeof CERT_TRACKS)[number];

export interface Certification {
  slug: string;
  title: string;
  issuer: string;
  /** Issue date, as printed on the certificate. */
  date: string;
  track: CertTrack;
  /** Only where the document actually prints one. */
  credentialId?: string;
  /** One line on what the programme actually covered. */
  summary: string;
  /** Three or four skills, shown as tags in the lightbox. */
  skills: string[];
  /** Path under /public. Swap the extension when a real scan lands. */
  image: string;
  /** True only where the claim is backed by the résumé. */
  verified?: boolean;
}

const cert = (c: Omit<Certification, 'image'>): Certification => ({
  ...c,
  image: `/certificates/${c.slug}.webp`,
});

export const CERTIFICATIONS: Certification[] = [
  cert({
    /* The title here stays as the certificate words it, deliberately,
       and it is the one place on the site that does.

       Everywhere the site describes this qualification in its own voice
       — the education timeline, both IIT Ropar moments in insights.ts —
       it now reads "Major Degree in Artificial Intelligence". This card
       is different in kind: it is a caption printed beside the scan of
       the document, and that document says "Major Certification in
       Artificial Intelligence" three times over — as the course name,
       and again in Prof. Iyengar's title as Head Coordinator. A card
       labelled "Degree" sitting next to artwork that says
       "Certification" is a mismatch a reader can see without leaving
       the page, on the one wall of this site where every field was
       transcribed off a scan precisely so that nothing on it could be
       argued down.

       So: the site says degree, the receipt says what the receipt says.
       If IIT Ropar reissues this wording, change it here to match the
       new document — not to match the rest of the site. */
    slug: 'iitropar-ai-major',
    title: 'Major Certification in Artificial Intelligence',
    issuer: 'IIT Ropar, with NSDC and Masai',
    date: 'Jan 2025 — Jun 2026',
    track: 'AI & ML',
    credentialId: 'IITRPRAI-CC6722',
    summary:
      'An eighteen-month major certification read alongside the B.Tech, from the machine-learning core through to a capstone.',
    skills: ['Machine learning', 'Deep learning', 'Python', 'Capstone'],
    verified: true,
  }),
  cert({
    slug: 'linkedin-microsoft-genai',
    title: 'Build Your Generative AI Productivity Skills',
    issuer: 'LinkedIn Learning with Microsoft',
    date: 'October 2024',
    track: 'AI & ML',
    credentialId: 'e0a3e83c8fd519dd90de5246d898a3ecce542e93f735c95a85bb1748ac2e8a7d',
    summary:
      'A learning path on applying generative models to working practice, completed in four hours fifty-one minutes.',
    skills: ['AI for business', 'AI for design', 'Productivity'],
    verified: true,
  }),
  cert({
    slug: 'governai-internship',
    title: 'Web Developer Internship',
    issuer: 'GovernAI (OPC) Private Limited',
    date: '11 May — 30 Jun 2026',
    track: 'Web & Product',
    credentialId: '011413',
    summary:
      'Front end for the Research Atlas and the GovernAI Simulator, both integrated to their backends, plus a rebuild of the corporate site.',
    skills: ['React', 'Frontend architecture', 'API integration', 'SEO'],
    verified: true,
  }),
  cert({
    slug: 'vubs-appreciation',
    title: 'Corporate Website, End to End',
    issuer: 'VUBS Corporation',
    date: '2026',
    track: 'Web & Product',
    summary:
      'A certificate of appreciation for the design and development of the official VUBS Corporation website, signed by three partners.',
    skills: ['Web development', 'Design', 'Delivery'],
    verified: true,
  }),
  cert({
    slug: 'layover-uiux-internship',
    title: 'UI/UX Design Internship',
    issuer: 'LayOver',
    date: '23 Mar — 20 Jul 2025',
    track: 'Design',
    summary:
      'Four months inside a UI/UX team, working across usability, accessibility and the design system the product is built on.',
    skills: ['UI/UX', 'Usability', 'Accessibility', 'Design systems'],
    verified: true,
  }),
  /* The certificate reads "congratulates you and your team for
     participating in NEC 2024 Basic Track" and prints no placing. The
     insights entry for this event claims All India Rank 140 and the top
     1% of the field; that number is not on this document. Either it
     comes from a source not in Certifications/, or it needs removing —
     it is flagged rather than repeated here. */
  cert({
    slug: 'nec-2024-ecell-iitb',
    title: 'National Entrepreneurship Challenge 2024',
    issuer: 'E-Cell, IIT Bombay',
    date: '2024',
    track: 'Competitions',
    summary:
      'A six-month national competition to build entrepreneurship cells across colleges; certificate of appreciation for the Basic Track.',
    skills: ['Entrepreneurship', 'Team competition'],
    verified: true,
  }),
  cert({
    slug: 'linkedin-microsoft-career-essentials',
    title: 'Career Essentials in Software Development',
    issuer: 'LinkedIn Learning with Microsoft',
    date: 'October 2024',
    track: 'Engineering',
    credentialId: 'ae0605a471993430aec505ca8d8efe155360e8bf5465306d04e742ab136ed314',
    summary:
      'A six-hour learning path across the software development lifecycle, from programming foundations through to delivery practice.',
    skills: ['Programming', 'Software development'],
    verified: true,
  }),
  cert({
    slug: 'linkedin-programming-foundations',
    title: 'Programming Foundations: Beyond the Fundamentals',
    issuer: 'LinkedIn Learning',
    date: 'October 2024',
    track: 'Engineering',
    credentialId: '47f21dc24c348ede1d637e582e93ee57b175b03faf5d9036b656ecc66e8b9075',
    summary:
      'The layer past syntax — data structures, recursion and the reasoning that separates working code from sound code.',
    skills: ['Programming'],
    verified: true,
  }),
  cert({
    slug: 'bserc-iisc-drone-workshop',
    title: 'Advanced Drone Technology (Air Taxi) Workshop',
    issuer: 'Bharat Space Education Research Centre with IISc Bengaluru',
    date: '13 July 2025',
    track: 'Engineering',
    summary:
      'A workshop on advanced drone and air-taxi systems, run with I-STEM CeNSE at the Indian Institute of Science under Viksit Bharat Abhiyan.',
    skills: ['Drone systems', 'Aerospace', 'Embedded'],
    verified: true,
  }),
  cert({
    slug: 'sjmsom-prod-wars',
    title: 'Prod Wars 3.0 — Product Management Case Competition',
    issuer: 'SJMSOM, IIT Bombay',
    date: '2025',
    track: 'Web & Product',
    summary:
      'Participation in the product management case competition at Avenues 2025, run by the Shailesh J. Mehta School of Management.',
    skills: ['Product management', 'Case analysis'],
    verified: true,
  }),
  cert({
    slug: 'iitg-encode-udgam',
    title: 'EnCode 2026: Code To Innovate',
    issuer: 'IIT Guwahati',
    date: '2026',
    track: 'Competitions',
    summary:
      'Participation in the coding competition at Udgam 2026, organised by the Indian Institute of Technology, Guwahati.',
    skills: ['Competitive programming'],
    verified: true,
  }),
  cert({
    slug: 'ey-manthana-round-two',
    title: 'EY Techathon — Round 2',
    issuer: 'EY',
    date: '2025',
    track: 'Competitions',
    summary:
      'Certificate of appreciation for team Manthana, for the detailed presentation submission at round two.',
    skills: ['Solution design', 'Presentation'],
    verified: true,
  }),
];

/* ─────────────────────────────────────────────────────────────────
   Education.

   Degree-level only. The two CBSE rows are deliberately gone: school
   percentages carry no signal next to a live engineering degree, and
   dropping them leaves the section saying one thing — two degrees,
   read in parallel.

   Every figure here is on the résumé. GPA is quoted on the scale it
   was awarded on, because "8.17" without "/ 10" reads as a fail to a
   reviewer used to a 4-point scale.
   ───────────────────────────────────────────────────────────────── */

export interface Education {
  id: string;
  institution: string;
  qualification: string;
  place: string;
  period: string;
  /** Headline figure, e.g. a GPA or a percentage. */
  metric: string;
  metricLabel: string;
  /** Shown small beside the metric — the scale it was measured on. */
  metricScale?: string;
  note: string;
  current?: boolean;
}

export const EDUCATION: Education[] = [
  {
    id: 'vit',
    institution: 'Vellore Institute of Technology',
    qualification: 'B.Tech, Computer Engineering',
    place: 'Vellore, India',
    period: '2024 — 2028',
    metric: '8.17',
    metricLabel: 'GPA',
    metricScale: '/ 10',
    note: 'Core degree. Data structures, operating systems, computer architecture and the systems coursework the project work is built on.',
    current: true,
  },
  {
    id: 'iit-ropar',
    institution: 'Indian Institute of Technology, Ropar',
    qualification: 'Major Degree in Artificial Intelligence',
    place: 'Ropar, India',
    period: 'Jan 2025 — Jun 2026',
    metric: 'AI',
    metricLabel: 'Major',
    note: 'Read concurrently with the B.Tech. Machine learning core through to a capstone: a transformer-based sequential recommender at 98.47% AUC-ROC.',
    /* No `current` flag: the term ran to June 2026 and the major was
       conferred by Prof. Sudarshan Iyengar — see the `iit-ropar-complete`
       moment in insights.ts, which is the record of that day. The B.Tech
       above is the only qualification still in progress. */
  },
];
