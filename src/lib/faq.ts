/* ─────────────────────────────────────────────────────────────────
   The questions a person actually types after the name, and the
   answers, once.

   ── The rule this file exists to keep ─────────────────────────────
   FAQPage markup is only legitimate when the same question and the
   same answer are on the page for a human to read. Google's
   structured-data policy calls marking up content the visitor cannot
   see "hidden content", and it is one of the few violations that is
   enforced by a manual action rather than by quietly ignoring the
   block.

   So this module is the single source, and it is consumed twice:

     · `src/components/FrequentQuestions.tsx` renders it, visibly, on
       the home page.
     · `src/lib/seo.ts` marks the same array up as FAQPage.

   Neither one owns the text. Adding a question here puts it on the
   page and in the graph together, and there is no way to put one
   without the other — which is the only arrangement that cannot drift
   into a violation six months from now when somebody edits one copy.

   ── What this is actually worth, honestly ─────────────────────────
   Not a rich result. Google restricted FAQ rich snippets in August
   2023 to well-known government and health sites; a personal site will
   not draw the accordion in a search result no matter how correct the
   markup is. Anybody promising otherwise is selling a 2022 playbook.

   It is worth two other things, and they are the two this site is
   actually optimising for:

     1. **Entity resolution.** A `Person` node says what someone is
        called. An FAQPage whose `mainEntity` questions are all about
        that person, answered in prose, is a machine-readable
        description of *who they are* — which is what a knowledge graph
        needs before it will treat a name as a thing rather than as a
        string.

     2. **Answer engines.** `public/robots.txt` explicitly welcomes
        GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot and
        Google-Extended. Those readers do not render JavaScript and do
        not draw rich results — they extract question/answer pairs and
        quote them. This is the format they are best at reading, and
        the citation is the point.

   ── The rule for answers ──────────────────────────────────────────
   Every answer below is checkable against something already on this
   site: `content.ts` for the figures, `certifications.ts` for the
   degrees, `ExperienceRoles.tsx` for the roles, `projects.ts` for the
   work. Nothing here is a claim that is made only here. If an answer
   cannot be traced to one of those, it does not belong in an FAQ — it
   belongs in the section that would carry the evidence for it.
   ───────────────────────────────────────────────────────────────── */

import { METRICS } from './content';

export interface FaqEntry {
  /** Anchor id, so a single question can be linked. */
  id: string;
  question: string;
  /** Paragraphs. Rendered in order, joined with a space for JSON-LD. */
  answer: string[];
}

export const FAQ: FaqEntry[] = [
  {
    id: 'who',
    question: 'Who is Divyakush Punjabi?',
    answer: [
      'Divyakush Punjabi is a full stack and AI systems engineer based in Vellore, Tamil Nadu, India. ' +
        'He led engineering at LMX Labs as Software Engineering Lead, where he shipped two platforms that ' +
        'run in production, and built the retrieval side of GovernAI’s open-source research tooling.',
      'He reads a B.Tech in Computer Engineering at Vellore Institute of Technology and holds a Major ' +
        'Degree in Artificial Intelligence from IIT Ropar, read concurrently and conferred in June 2026.',
    ],
  },
  {
    id: 'what-he-builds',
    question: 'What does Divyakush Punjabi build?',
    answer: [
      'Production systems, in three areas: multi-tenant SaaS, semantic retrieval, and machine learning ' +
        'services that are actually served rather than left in a notebook.',
      'Four of them are live products. Saturdays is a consumer food-delivery platform with discovery, ' +
        'ordering and PhonePe and Stripe payments. DineGuru is multi-tenant restaurant SaaS covering ' +
        'inventory, kitchen ticketing, recipe costing, procurement and billing analytics on one core. ' +
        'GovernAI Research Atlas is a semantic search unifying papers, repositories and governance ' +
        'resources over a ChromaDB vector index. GovernAI Studio is an AI-governance training simulator ' +
        'built on Django, Celery and a hybrid RAG inference pipeline.',
    ],
  },
  {
    id: 'where-based',
    question: 'Where is Divyakush Punjabi based?',
    answer: [
      'Vellore, Tamil Nadu, India — the campus of Vellore Institute of Technology, where he reads his ' +
        'B.Tech. He works to GMT+5:30.',
      'The record on this site runs across four Indian cities: Vellore and the VIT campus in Tamil Nadu, ' +
        'Rupnagar in Punjab for the IIT Ropar programme and its convocation, Surat in Gujarat, and the ' +
        'IIT Bombay campus in Mumbai for the National Entrepreneurship Challenge. Engagements have been ' +
        'run both on-site and remote.',
    ],
  },
  {
    id: 'education',
    question: 'Where does Divyakush Punjabi study?',
    answer: [
      'Two degrees, read in parallel. The core is a B.Tech in Computer Engineering at Vellore Institute ' +
        'of Technology, Vellore, Tamil Nadu, running 2024 to 2028, currently at a GPA of 8.17 out of 10.',
      'Alongside it he read a Major Degree in Artificial Intelligence at the Indian Institute of ' +
        'Technology Ropar, Rupnagar, Punjab, from January 2025 to June 2026 — machine learning core ' +
        `through to a capstone: a transformer-based sequential recommender at ${METRICS.modelAccuracy} AUC-ROC.`,
    ],
  },
  {
    id: 'experience',
    question: 'What is Divyakush Punjabi’s professional experience?',
    answer: [
      `${METRICS.roles} roles across product startups, an AI governance lab, and a BASF partner.`,
      'Software Engineering Lead at LMX Labs, sole technical lead across two live platforms and the team ' +
        'building them. Web Developer Intern at GovernAI, shipping three products in one internship. Web ' +
        'Developer at VUBS Corporation, sole engineer on a full-cycle corporate build that cut ' +
        'Time-to-Interactive by 40%. UI/UX Designer and Frontend Intern at LayOver, where the mobile ' +
        'flows he researched and rebuilt lifted retention 20%. And Team Lead of Visionary Ventures, the ' +
        `team representing VIT Vellore at E-Cell IIT Bombay’s National Entrepreneurship Challenge, ${METRICS.nationalRank}.`,
    ],
  },
  {
    id: 'stack',
    question: 'What technologies does Divyakush Punjabi work with?',
    answer: [
      'On the server: Python, FastAPI, Django, Celery and PostgreSQL, with ChromaDB for vector retrieval. ' +
        'On the client: React, TypeScript, Next.js and Tailwind CSS. For machine learning: TensorFlow, ' +
        'Sentence-Transformers and retrieval-augmented generation.',
      'Closer to the metal, the work runs to Verilog HDL, embedded systems and computer vision at the ' +
        'edge — an adaptive traffic controller in RTL, and Netra, a closed perception-to-motion loop over MQTT.',
    ],
  },
  {
    id: 'availability',
    question: 'Is Divyakush Punjabi available for work?',
    answer: [
      'Yes — for full-time software engineering and AI roles, and for contract work, across India and ' +
        'remotely. Both of the 2026 engagements finished in July 2026.',
      'Previous engagements have been run on-site, remote and on contract, so either arrangement is ' +
        'familiar rather than an experiment.',
    ],
  },
  {
    id: 'contact',
    question: 'How do you contact Divyakush Punjabi?',
    answer: [
      'Through the contact form on this site, which is the only route in — the address and phone number ' +
        'are deliberately not published. It reaches him directly.',
      'He is also on LinkedIn at linkedin.com/in/divyakush-punjabi, on GitHub at github.com/Divyakush2006, ' +
        'and writes at dev.to/divyakush.',
    ],
  },
];

/** One answer as the single string JSON-LD's `acceptedAnswer` wants. */
export const answerText = (entry: FaqEntry) => entry.answer.join(' ');
