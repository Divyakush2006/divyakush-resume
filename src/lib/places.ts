/* ─────────────────────────────────────────────────────────────────
   The real places this person is attached to, as schema.

   ── Why this file exists ──────────────────────────────────────────
   A name is not an entity. "Divyakush Punjabi" is a string that a
   search engine has no reason to believe refers to anybody in
   particular, and there is at least one large, aged, commercially
   active organisation indexed under a near-identical string. The way
   out of that is not to repeat the name more often. It is to attach it
   to things that already exist in the knowledge graph — a university
   with a Wikipedia article, a city with a postal code, an institute
   with a registered address — until the name resolves to a node rather
   than to a guess.

   That is what every entry below is for. Each one is a place that can
   be checked against a public record, and each carries the two
   properties that make a place resolvable rather than decorative:

     · `address` — locality, region, postal code, country. This is the
       "city and state schema" in its only legitimate form: the real
       address of a real institution this person genuinely attended or
       worked with.

     · `sameAs` — the Wikipedia article and the official domain. Entity
       resolution is string matching against things already in the
       graph, and a Wikipedia URL is the strongest such string there
       is. Naming `vit.ac.in` and the VIT Wikipedia article next to
       this person's name is what turns "some student" into "this
       specific institution's student".

   ── What is deliberately not here ─────────────────────────────────
   **No `geo` coordinates.** Every other number on this site is read
   off a document or a file rather than typed from memory, and a
   latitude recalled to four decimal places is exactly the kind of
   figure that is confidently wrong. The address resolves the place;
   the coordinate pair would only restate it less reliably. If campus
   coordinates are ever wanted, take them from the institution's own
   published contact page and cite it in a comment here.

   **No city this person has no connection to.** The obvious next move
   after "add location schema" is to add every metro in India — a
   `Place` for Mumbai, Delhi, Bengaluru, Hyderabad, Pune, and a landing
   page for each. That is the textbook definition of a doorway page,
   it is named in Google's spam policies, and the penalty for it lands
   on the whole domain rather than on the pages that earned it. The
   cities below are the four this person has actually been in, and the
   evidence for each is a dated photograph in `insights.ts`.

   Location authority is earned the same way entity authority is: by
   being genuinely attached to real places, in public, repeatedly.
   ───────────────────────────────────────────────────────────────── */

type Node = Record<string, unknown>;

export const COUNTRY = 'IN';

/** A postal address, at the precision a public record states it. */
export const address = (
  locality: string,
  region: string,
  postalCode?: string,
  street?: string,
): Node => ({
  '@type': 'PostalAddress',
  ...(street ? { streetAddress: street } : {}),
  addressLocality: locality,
  addressRegion: region,
  ...(postalCode ? { postalCode } : {}),
  addressCountry: COUNTRY,
});

/* ── Cities ───────────────────────────────────────────────────────
   The four Indian cities named in `insights.ts`, each as a Place with
   a real address. `contentLocation` on those Articles pointed at a
   bare `{ name: 'Vellore, Tamil Nadu' }` — a string, which a consumer
   can do nothing with. These are the same four places said in a form
   that resolves: locality, region, country, and the Wikipedia article
   for the city itself.

   Keyed by the exact string `insights.ts` prints, so the lookup is
   total and a typo shows up as a missing node rather than as a
   silently wrong one. */
export const CITIES: Record<string, Node> = {
  'Vellore, Tamil Nadu': {
    '@type': 'Place',
    name: 'Vellore',
    address: address('Vellore', 'Tamil Nadu', '632014'),
    sameAs: 'https://en.wikipedia.org/wiki/Vellore',
  },
  'Rupnagar, Punjab': {
    '@type': 'Place',
    name: 'Rupnagar',
    address: address('Rupnagar', 'Punjab', '140001'),
    sameAs: 'https://en.wikipedia.org/wiki/Rupnagar',
  },
  'Surat, Gujarat': {
    '@type': 'Place',
    name: 'Surat',
    address: address('Surat', 'Gujarat'),
    sameAs: 'https://en.wikipedia.org/wiki/Surat',
  },
  'Mumbai, Maharashtra': {
    '@type': 'Place',
    name: 'Mumbai',
    address: address('Mumbai', 'Maharashtra'),
    sameAs: 'https://en.wikipedia.org/wiki/Mumbai',
  },
};

/** The Place node for a printed location string, or a bare name if the
    city is not one of the four above. Never invents an address. */
export function placeFor(printed: string | undefined): Node | undefined {
  if (!printed) return undefined;
  return CITIES[printed] ?? { '@type': 'Place', name: printed };
}

/* ── Where this person actually is ────────────────────────────────
   Vellore, Tamil Nadu — the same answer `public/humans.txt` has given
   since the site launched, and the campus he reads a degree at. One
   home location, stated once, referenced by `@id`.

   This is the node that answers "where is Divyakush Punjabi based",
   which is the location query that is actually his to win. */
export const HOME_PLACE_ID = '#place-vellore';

export const homePlace = (origin: string): Node => ({
  '@type': 'Place',
  '@id': `${origin}/${HOME_PLACE_ID}`,
  name: 'Vellore, Tamil Nadu, India',
  address: address('Vellore', 'Tamil Nadu', '632014'),
  sameAs: 'https://en.wikipedia.org/wiki/Vellore',
});

/* ── Institutions ─────────────────────────────────────────────────
   The two degrees and the one competition body, as organisations with
   addresses and Wikipedia articles.

   `alumniOf` on the Person node used to carry two objects with nothing
   in them but a `name`. A consumer reading that learns the person
   claims a relationship to a string. Reading these, it learns the
   person claims a relationship to a specific institution at a specific
   address with a specific Wikipedia article — and can check the last
   one. That difference is the whole reason this file was written.

   Addresses are the institutions' own published campus addresses.
   `founded`, `numberOfEmployees` and the rest are not here: they are
   facts about the university, not about this person, and restating
   them buys nothing while giving something to get wrong. */
export const ORG_IDS = {
  vit: '#org-vit',
  iitRopar: '#org-iit-ropar',
  iitBombay: '#org-iit-bombay',
} as const;

export const organisations = (origin: string): Node[] => [
  {
    '@type': 'CollegeOrUniversity',
    '@id': `${origin}/${ORG_IDS.vit}`,
    name: 'Vellore Institute of Technology',
    alternateName: 'VIT Vellore',
    url: 'https://vit.ac.in/',
    address: address('Vellore', 'Tamil Nadu', '632014', 'Tiruvalam Road, Katpadi'),
    sameAs: [
      'https://en.wikipedia.org/wiki/Vellore_Institute_of_Technology',
      'https://vit.ac.in/',
    ],
  },
  {
    '@type': 'CollegeOrUniversity',
    '@id': `${origin}/${ORG_IDS.iitRopar}`,
    name: 'Indian Institute of Technology Ropar',
    alternateName: 'IIT Ropar',
    url: 'https://www.iitrpr.ac.in/',
    address: address('Rupnagar', 'Punjab', '140001'),
    sameAs: [
      'https://en.wikipedia.org/wiki/Indian_Institute_of_Technology_Ropar',
      'https://www.iitrpr.ac.in/',
    ],
  },
  {
    '@type': 'CollegeOrUniversity',
    '@id': `${origin}/${ORG_IDS.iitBombay}`,
    name: 'Indian Institute of Technology Bombay',
    alternateName: 'IIT Bombay',
    url: 'https://www.iitb.ac.in/',
    address: address('Mumbai', 'Maharashtra', '400076', 'Powai'),
    sameAs: [
      'https://en.wikipedia.org/wiki/Indian_Institute_of_Technology_Bombay',
      'https://www.iitb.ac.in/',
    ],
  },
];
