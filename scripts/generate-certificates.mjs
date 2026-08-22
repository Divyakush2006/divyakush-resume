/* ─────────────────────────────────────────────────────────────────
   Placeholder certificate artwork.

   Generates one SVG per certification into `public/certificates/`.
   These are DUMMY documents standing in for real scans — the layout,
   aspect ratio and weight are what the section is designed around, so
   dropping a real 1414x1000-ish scan over any of them needs no code
   change. See public/certificates/README.md.

   SVG rather than raster because these are served through <img>: they
   stay sharp in the lightbox at any size, weigh ~3 kB each, and can be
   regenerated from data instead of re-exported by hand.

   `slug` here MUST match `slug` in src/lib/certifications.ts — that is
   the only link between the data and the file on disk.

   Run:  node scripts/generate-certificates.mjs
   ───────────────────────────────────────────────────────────────── */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/certificates');

const RECIPIENT = 'Divyakush Punjabi';

/* ink   — body copy and rules
   tone  — the issuer's signature colour, used for the frame, the seal
           and the eyebrow. Kept desaturated: eighteen of these sit in
           one grid, and saturated brand colour turns it into confetti.
   mark  — watermark initials. */
const CERTS = [
  { slug: 'microsoft-software-development-essentials', issuer: 'Microsoft',        mark: 'MS',  tone: '#2B579A', title: 'Software Development Essentials',            date: 'March 2025',     id: 'MS-SDE-4471-2025', signer: 'Program Director, Microsoft Learn' },
  { slug: 'deeplearning-machine-learning-spec',        issuer: 'DeepLearning.AI',  mark: 'DL',  tone: '#1A6B7A', title: 'Machine Learning Specialization',            date: 'August 2025',    id: 'DLAI-MLS-8820-2025', signer: 'Instructor, DeepLearning.AI' },
  { slug: 'deeplearning-deep-learning-spec',           issuer: 'DeepLearning.AI',  mark: 'DL',  tone: '#1A6B7A', title: 'Deep Learning Specialization',               date: 'November 2025',  id: 'DLAI-DLS-3164-2025', signer: 'Instructor, DeepLearning.AI' },
  { slug: 'huggingface-transformers-nlp',              issuer: 'Hugging Face',     mark: 'HF',  tone: '#B0761C', title: 'Transformers & Natural Language Processing', date: 'January 2026',   id: 'HF-NLP-2209-2026', signer: 'Course Lead, Hugging Face' },
  { slug: 'stanford-supervised-machine-learning',      issuer: 'Stanford Online',  mark: 'SO',  tone: '#7A2E2E', title: 'Supervised Machine Learning',                date: 'June 2025',      id: 'SU-SML-6033-2025', signer: 'Faculty, Stanford Online' },
  { slug: 'nvidia-fundamentals-deep-learning',         issuer: 'NVIDIA',           mark: 'NV',  tone: '#4A6B18', title: 'Fundamentals of Deep Learning',              date: 'February 2026',  id: 'NV-DLI-5518-2026', signer: 'Deep Learning Institute' },
  { slug: 'google-cloud-generative-ai',                issuer: 'Google Cloud',     mark: 'GC',  tone: '#2A5CA8', title: 'Generative AI Fundamentals',                 date: 'April 2026',     id: 'GC-GAI-7742-2026', signer: 'Google Cloud Skills Boost' },

  { slug: 'aws-cloud-practitioner-essentials',         issuer: 'Amazon Web Services', mark: 'AW', tone: '#A5661A', title: 'Cloud Practitioner Essentials',          date: 'September 2025', id: 'AWS-CPE-1287-2025', signer: 'AWS Training and Certification' },
  { slug: 'docker-foundations-professional',           issuer: 'Docker',           mark: 'DK',  tone: '#1F6FB2', title: 'Docker Foundations Professional',            date: 'July 2025',      id: 'DKR-FDN-9903-2025', signer: 'Docker Education' },
  { slug: 'hashicorp-terraform-associate',             issuer: 'HashiCorp',        mark: 'HC',  tone: '#4A3A8C', title: 'Terraform Associate Fundamentals',           date: 'December 2025',  id: 'HC-TFA-6650-2025', signer: 'HashiCorp Learn' },
  { slug: 'postman-api-fundamentals',                  issuer: 'Postman',          mark: 'PM',  tone: '#B0521C', title: 'API Fundamentals Student Expert',            date: 'May 2025',       id: 'PM-API-4408-2025', signer: 'Postman Student Program' },
  { slug: 'meta-backend-developer',                    issuer: 'Meta',             mark: 'MT',  tone: '#34518F', title: 'Back-End Developer Professional',            date: 'March 2026',     id: 'MTA-BED-2076-2026', signer: 'Meta Professional Certificates' },

  { slug: 'mongodb-associate-developer',               issuer: 'MongoDB',          mark: 'MD',  tone: '#2E6B45', title: 'Associate Developer Learning Path',          date: 'October 2025',   id: 'MDB-ADV-3391-2025', signer: 'MongoDB University' },
  { slug: 'ibm-data-analysis-python',                  issuer: 'IBM',              mark: 'IB',  tone: '#1F4F9C', title: 'Data Analysis with Python',                  date: 'February 2025',  id: 'IBM-DAP-5124-2025', signer: 'IBM Skills Network' },
  { slug: 'kaggle-intermediate-machine-learning',      issuer: 'Kaggle',           mark: 'KG',  tone: '#1B7BA8', title: 'Intermediate Machine Learning',              date: 'June 2025',      id: 'KG-IML-8815-2025', signer: 'Kaggle Learn' },

  { slug: 'freecodecamp-responsive-web-design',        issuer: 'freeCodeCamp',     mark: 'FC',  tone: '#35604A', title: 'Responsive Web Design',                      date: 'November 2024',  id: 'FCC-RWD-7290-2024', signer: 'freeCodeCamp.org' },
  { slug: 'google-ux-design-foundations',              issuer: 'Google',           mark: 'GO',  tone: '#2A5CA8', title: 'Foundations of User Experience Design',      date: 'January 2025',   id: 'GG-UXD-6607-2025', signer: 'Grow with Google' },

  { slug: 'oracle-java-foundations',                   issuer: 'Oracle',           mark: 'OR',  tone: '#8C2B2B', title: 'Java Foundations',                           date: 'December 2024',  id: 'ORA-JAF-1935-2024', signer: 'Oracle Academy' },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Greedy wrap so long programme titles break sensibly over two lines. */
function wrap(text, max) {
  const out = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > max) {
      out.push(line);
      line = word;
    } else {
      line = line ? line + ' ' + word : word;
    }
  }
  if (line) out.push(line);
  return out.slice(0, 2);
}

/* Signature scribbles. Varied by index so eighteen certificates are
   not signed by eighteen identical hands. */
const SIGNATURES = [
  'M0,26 C22,-6 38,34 58,14 C74,-2 82,30 104,12 C118,0 128,20 148,8',
  'M0,22 C16,-4 30,32 48,10 C62,-6 76,28 96,10 C112,-4 126,24 146,10',
  'M0,28 C18,2 26,30 46,16 C66,2 72,32 94,16 C112,3 124,26 150,12',
  'M0,20 C20,0 32,28 52,12 C70,-2 84,26 102,14 C120,2 132,22 152,10',
];

function certificate(c, i) {
  const W = 1414;
  const H = 1000;
  const titleLines = wrap(c.title, 30);

  const title = titleLines
    .map(
      (line, n) =>
        `<text x="${W / 2}" y="${560 + n * 62}" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="46" font-weight="700" fill="#20242B" letter-spacing="-0.6">${esc(line)}</text>`,
    )
    .join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(c.title)} certificate issued by ${esc(c.issuer)}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FDFCF9"/>
      <stop offset="1" stop-color="#F3F1EA"/>
    </linearGradient>
    <linearGradient id="band" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${c.tone}"/>
      <stop offset="1" stop-color="${c.tone}" stop-opacity="0.35"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#paper)"/>

  <!-- Issuer band along the top edge -->
  <rect x="0" y="0" width="${W}" height="10" fill="url(#band)"/>

  <!-- Double frame -->
  <rect x="40" y="42" width="${W - 80}" height="${H - 82}" fill="none" stroke="${c.tone}" stroke-width="2.5" opacity="0.55"/>
  <rect x="54" y="56" width="${W - 108}" height="${H - 110}" fill="none" stroke="#20242B" stroke-width="1" opacity="0.22"/>

  <!-- Corner brackets -->
  <g stroke="${c.tone}" stroke-width="3" fill="none" opacity="0.8">
    <path d="M74,96 L74,76 L94,76"/>
    <path d="M${W - 74},96 L${W - 74},76 L${W - 94},76"/>
    <path d="M74,${H - 96} L74,${H - 76} L94,${H - 76}"/>
    <path d="M${W - 74},${H - 96} L${W - 74},${H - 76} L${W - 94},${H - 76}"/>
  </g>

  <!-- Watermark -->
  <text x="${W / 2}" y="${H / 2 + 130}" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="420" font-weight="700" fill="${c.tone}" opacity="0.045">${esc(c.mark)}</text>

  <!-- Issuer -->
  <text x="${W / 2}" y="168" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="34" font-weight="700" fill="#20242B" letter-spacing="7">${esc(c.issuer.toUpperCase())}</text>
  <line x1="${W / 2 - 90}" y1="196" x2="${W / 2 + 90}" y2="196" stroke="${c.tone}" stroke-width="2"/>

  <!-- Eyebrow -->
  <text x="${W / 2}" y="272" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="20" font-weight="600" fill="${c.tone}" letter-spacing="9">CERTIFICATE OF COMPLETION</text>

  <!-- Recipient -->
  <text x="${W / 2}" y="342" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="22" font-style="italic" fill="#20242B" opacity="0.6">This is to certify that</text>
  <text x="${W / 2}" y="432" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="76" font-weight="700" fill="#12161C">${esc(RECIPIENT)}</text>
  <line x1="${W / 2 - 300}" y1="466" x2="${W / 2 + 300}" y2="466" stroke="#20242B" stroke-width="1" opacity="0.25"/>

  <text x="${W / 2}" y="512" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="22" font-style="italic" fill="#20242B" opacity="0.6">has successfully completed the programme</text>

  <!-- Programme title -->
  ${title}

  <!-- Seal -->
  <g transform="translate(${W / 2}, 742)">
    <circle r="62" fill="none" stroke="${c.tone}" stroke-width="2" opacity="0.75"/>
    <circle r="52" fill="none" stroke="${c.tone}" stroke-width="1" opacity="0.45"/>
    <circle r="42" fill="${c.tone}" opacity="0.1"/>
    <text y="12" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="34" font-weight="700" fill="${c.tone}" letter-spacing="2">${esc(c.mark)}</text>
  </g>

  <!-- Signature -->
  <g transform="translate(150, 826)">
    <path d="${SIGNATURES[i % SIGNATURES.length]}" fill="none" stroke="#12161C" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    <line x1="0" y1="62" x2="300" y2="62" stroke="#20242B" stroke-width="1" opacity="0.3"/>
    <text y="90" font-family="Helvetica Neue, Arial, sans-serif" font-size="18" font-weight="600" fill="#20242B" opacity="0.72">${esc(c.signer)}</text>
  </g>

  <!-- Issue details -->
  <g transform="translate(${W - 150}, 826)" text-anchor="end">
    <text y="26" font-family="Helvetica Neue, Arial, sans-serif" font-size="26" font-weight="700" fill="#12161C">${esc(c.date)}</text>
    <line x1="-300" y1="62" x2="0" y2="62" stroke="#20242B" stroke-width="1" opacity="0.3"/>
    <text y="90" font-family="Courier New, monospace" font-size="17" fill="#20242B" opacity="0.72">ID ${esc(c.id)}</text>
  </g>
</svg>
`;
}

mkdirSync(OUT, { recursive: true });
CERTS.forEach((c, i) => {
  writeFileSync(resolve(OUT, `${c.slug}.svg`), certificate(c, i), 'utf8');
});
console.log(`wrote ${CERTS.length} certificates to public/certificates/`);
