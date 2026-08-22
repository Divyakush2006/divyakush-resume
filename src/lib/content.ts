/* ─────────────────────────────────────────────────────────────────
   Single source of truth for every claim on the site.

   The previous build contradicted itself in ways a reviewer would
   catch immediately: the hero advertised "5+ years of experience"
   while the statement section said "2+ years", and project cards were
   dated 2026 under a footer reading "Est. 2024". Numbers now live
   here once, and every section reads from this file.
   ───────────────────────────────────────────────────────────────── */

export const PROFILE = {
  name: 'Divyakush Punjabi',
  role: 'Full Stack & AI Systems Engineer',
  shortRole: 'Full Stack & AI Systems',
  location: 'India · GMT+5:30',
  links: {
    linkedin: 'https://linkedin.com/in/divyakush-punjabi',
    github: 'https://github.com/divyakush2006',
    site: 'https://www.divyakush.com/',
  },
} as const;

/* ─────────────────────────────────────────────────────────────────
   Contact form delivery.

   The address, the phone number and the résumé download are all gone
   from the site by request — the contact form is the only way in.

   ⚠ ONE STEP LEFT, AND IT MATTERS.

   `token` below is still the raw address. FormSubmit needs *something*
   in the endpoint URL to know where to deliver, and that URL ships in
   the compiled bundle — so as it stands the address is not on the page
   but it is readable by anyone who opens devtools or greps the JS.
   That is most of what taking it off the page was meant to prevent.

   FormSubmit exists to solve this. Submit the live form once; the
   activation email it sends back contains a random-string alias for
   this address. Paste that alias in over the address here and the
   bundle no longer contains it anywhere:

       token: 'a1b2c3d4e5f6...',

   Nothing else changes — the endpoint is built from this one string.
   ───────────────────────────────────────────────────────────────── */
export const CONTACT_FORM = {
  token: 'divyakushpunjabi@gmail.com',
  /** AJAX rather than the redirecting endpoint, so a submission never
      throws the visitor onto a FormSubmit-branded thank-you page. */
  get endpoint() {
    return `https://formsubmit.co/ajax/${this.token}`;
  },
  subject: 'New enquiry from divyakush.com',
} as const;

/** Every headline figure. Change once, propagates everywhere. */
export const METRICS = {
  yearsShipping: '2+',
  projects: '20+',
  roles: '5',
  modelAccuracy: '98.47%',
  nationalRank: 'AIR 140',
} as const;

/* Every entry must resolve to a section that exists. `#about` was
   dropped along with the About section — a nav pointing at a missing
   id is the exact defect this file was written to stop. */
export const NAV_ITEMS = [
  { label: 'Work',       href: '#work' },
  { label: 'Experience', href: '#experience' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Contact',    href: '#contact' },
] as const;

/* The footer indexes the whole page, not just the four the header has
   room for. Same rule as above: every one of these ids exists on the
   home page — work, experience, capabilities, education,
   certifications, insights, contact.

   "Recognition" was here until the section it pointed at was removed.
   A footer link to an id that no longer exists does not fail loudly;
   it silently does nothing when clicked, which is worse. The rule is
   the reason this list is checked against the page rather than
   maintained from memory. */
export const FOOTER_NAV = [
  { label: 'Selected work',  href: '#work' },
  { label: 'Experience',     href: '#experience' },
  { label: 'Capabilities',   href: '#capabilities' },
  { label: 'Education',      href: '#education' },
  { label: 'Certifications', href: '#certifications' },
  { label: 'Insights',       href: '#insights' },
  { label: 'Contact',        href: '#contact' },
] as const;
