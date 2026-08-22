/* ─────────────────────────────────────────────────────────────────
   Insights — the run of years, in order.

   PROVENANCE.

   Every title, date, location and description here traces to one of:
   an entry in `projects.ts`, a document in public/certificates, a
   LinkedIn post written at the time, the organiser's own record of a
   public event, or the author's account of a photograph he is in.
   Where it is one of the last two, the source is linked on the entry
   so a reader can check it. Nothing is invented. Where a location is
   not on record the `location` field is simply absent and the carousel
   omits the chip rather than guessing a city.

   Two claims rest on the author's own record rather than on a
   document: the All India Rank at NEC, and that the team was the only
   one representing VIT Vellore. The participation certificate prints
   neither — it prints participation. They are stated here because he
   states them; they are flagged so nobody later mistakes them for
   something transcribed off paper.

   Numbers are the one thing a reader can check without asking, so they
   are taken from a source and nowhere else. The DevJams field size was
   wrong across this file and projects.ts until the post itself was
   read: more than 250 teams, not more than 400. The placing beside it
   is Top 12, on the author's own record — the post and the shortlist
   photograph both say thirteen, and the note in HackathonsGallery.tsx
   records that disagreement in full rather than quietly taking a side.

   The Smart India Hackathon figures were removed from this entry in
   that same pass, on the reasoning that nothing corroborated them and
   that "400+" looked like the DevJams error migrating. That was wrong,
   and it is worth recording why: the post linked on the entry states
   both of them outright — "Out of 400+ teams, our AI-powered rockfall
   prediction system was shortlisted" and "~97% model accuracy". They
   are restored. The lesson is narrow and useful: a linked source is
   not a claim awaiting corroboration, it *is* the corroboration, and
   the first move is to read it rather than to reason about whether a
   number looks familiar.

   97% model accuracy and 98% AUC-ROC are not in conflict, which is why
   both stand. They are different measurements of the same system —
   accuracy is the share of calls it gets right at one threshold, AUC
   is how well it separates the classes across all of them — and the
   entry states the post's figure because the post is one click away
   from it, while projects.ts states the evaluation metric.

   Names of other people are handled to one rule: a name appears only
   where the person is a public figure at a public event, or where the
   record needs it to mean anything. Team-mates are described by the
   function they held, never by name. The author's own name and his
   team's appear in the two NEC entries, because a leadership claim
   with nobody attached to it is not a claim.

   How it is placed matters more than that it is there. In the team
   entry the name does not open the paragraph, and it carries no
   adjective — it arrives after the reader already knows the size of
   the field, the number of people, the fact that none of them were
   paid and most were never in the same room. By the time the sentence
   names him, the difficulty has been established, so the name lands as
   the answer to a question the reader has already started asking.

   That is deliberate, and it is the opposite of turning up the
   volume. "Led Visionary Ventures to All India Rank 140" is read by a
   hiring panel as a fact about the world; the same sentence with
   "esteemed" or "exceptional" in front of it is read as a fact about
   the author's opinion of himself, and quietly discounted. The weight
   comes from the order of the evidence and from what is left out —
   never from a modifier.

   Where somebody else's standing is described — a professor, a room of
   operators, a summit stage — it is there to set a measure, not to
   borrow shine. The test applied to every one of those paragraphs: it
   has to end somewhere useful about the work. An entry that spends
   four lines on how distinguished the other person is and never
   returns has flattered them and told the reader nothing, which is a
   worse outcome for both parties.

   Two entries — the summit floor and the summit itself — are placed on
   the same two days on the strength of the badge and the clothing
   being identical in both photographs. If that is wrong, only the date
   on `summit-floor` needs changing. One detail from the author's
   account is deliberately not written down: a second chief technology
   officer was named for a company that could not be identified from
   the note, so his presence is recorded without one.

   IMAGES.

   Every entry carries a real photograph at public/insights/<slug>.webp
   and every photograph supplied is placed. The files are not camera
   originals: each is cropped once, by scripts/crop-insight-photos.mjs,
   to a frame that suits the carousel card. That script holds the crop
   rectangles and the reasoning for each.

   Identifications have been wrong twice. An early pass placed several
   photographs by their position in the folder rather than by what is
   visible in them and got five of them wrong. A later audit found four
   more of the same kind: a team photograph captioned as a client
   website, a campus lab captioned as a code release, a summit floor
   captioned as a product launch. All nine are corrected, and the rule
   that produced them is retired — a photograph is now read before it
   is captioned, and where it shows something the record cannot confirm
   the entry says what the picture shows.

   Four milestones lost their slide in that audit, because the
   photographs that had been standing in for them turned out to belong
   to other events. None of them left the site: the two GovernAI
   products have full case studies in projects.ts, and the LMX Labs
   lead and the VUBS engagement are both in the experience rail, with
   the VUBS letter of appreciation in the certifications wall. This
   section is a record of moments that were photographed, not an index
   of everything that happened.
   ───────────────────────────────────────────────────────────────── */

export interface InsightLink {
  label: string;
  href: string;
  kind: 'linkedin' | 'source' | 'live';
}

export interface Insight {
  slug: string;
  /** What happened. */
  title: string;
  /** City and state, only where it is actually on record. */
  location?: string;
  /** As printed in the caption rail. */
  date: string;
  /** One or two lines, over the photograph. */
  blurb: string;
  /**
   * The long version, opened from the card. Paragraphs, in order —
   * what the thing was, what was built or done, and what it cost or
   * taught. This is the reason a card is worth clicking.
   */
  story: string[];
  /** Where a reader can go and check. */
  links?: InsightLink[];
  /**
   * Whether this photograph fills the card on a desktop.
   *
   * The card is 1.46 at 1024px and up and 0.86 on a phone, and the
   * photographs run from 0.66 to 1.66, so no single fit is right for
   * all of them. Two are available:
   *
   *   contain — the whole frame, hung from the top, columns of card
   *             either side filled by the mirrors. Nothing is ever
   *             cut. This is what every slide did.
   *   cover   — the frame scaled until it fills the card, the excess
   *             taken off the bottom (`object-top`). Nothing is
   *             letterboxed. Something is always cut.
   *
   * `fill` chooses `cover`, and only above 768px: on a phone the card
   * is a portrait box, so covering would crop 35% off the *width* of a
   * landscape picture and take the faces at both edges with it. Phones
   * always contain.
   *
   * It is set per entry rather than derived from a ratio because the
   * question is not how much gets cut, it is what. Measured against
   * the 1.46 desktop card, the crop each photograph would take off its
   * own bottom edge:
   *
   *     devjams                 1.46    0.3%   floor
   *     summit-floor            1.34    8.3%   below mid-thigh
   *     startup-summit          1.33    8.8%   below the backdrop
   *     submissions-closed      1.33    8.8%   corridor floor
   *     nec-visionary-ventures  1.26   13.6%   below the seated row
   *     smart-india-hack        1.24   15.3%   grass
   *     ─────────────────────────────────────────────────────────
   *     first-internship        1.19   18.5%   the front row's feet
   *     nec-iit-bombay          1.11   24.1%   the laptop, the desk
   *     electroutsav            1.11   24.3%   the benches and rig
   *     iit-ropar-complete      1.04   28.7%   both figures at the hip
   *
   * The six above the line lose ground, floor or backdrop and are set
   * to fill. The four below lose the thing the photograph is of, and
   * are not. Two more sit outside the table: `iit-ropar-major` is 1.66
   * and would be cut on the *sides*, where a standing figure is, and
   * `iit-ropar-convocation` is a 0.66 portrait that covering would
   * reduce to a waist-up crop of a full-height frame.
   *
   * If a photograph is replaced, re-measure before changing this.
   */
  fill: boolean;
  image: string;
}

/* Every entry now has a photograph, but the plate mechanism stays: an
   entry added before its picture arrives points at the abstract
   <slug>.svg that scripts/generate-insight-plates.mjs draws, which
   reads as deliberate rather than broken. */
const at = (i: Omit<Insight, 'image'> & { photo?: boolean }): Insight => ({
  ...i,
  image: `/insights/${i.slug}.${i.photo ? 'webp' : 'svg'}`,
});

/** Oldest first — the section is read as a run of years. */
export const INSIGHTS: Insight[] = [
  at({
    slug: 'nec-iit-bombay',
    photo: true,
    fill: false,
    title: 'National Entrepreneurship Challenge',
    date: '2024',
    blurb:
      "Team lead of Visionary Ventures, the only team to represent VIT Vellore at E-Cell, IIT Bombay's national challenge — All India Rank 140, in the first semester of the degree.",
    story: [
      "The National Entrepreneurship Challenge is run by the Entrepreneurship Cell of IIT Bombay and it is not a hackathon. It runs for months rather than a weekend, and it asks a campus team to behave like a company: build a business model worth defending, take it to a market, and keep the whole thing moving while every member is also a full-time student somewhere else.",
      'Divyakush Punjabi led Visionary Ventures — the only team to represent VIT Vellore in that year’s challenge — to All India Rank 140, in the first semester of the B.Tech.',
      'The work divided into innovative business models and go-to-market strategy, and the difficulty was rarely the idea. It was deciding under uncertainty against a fixed deadline, holding a distributed team to a schedule nobody was being paid to keep, and carrying accountability for output produced by people you cannot see.',
      'It is the earliest thing on this timeline for a reason: leading before knowing how to is where most of what came later was actually learned.',
    ],
    links: [
      {
        label: 'Write-up on LinkedIn',
        href: 'https://www.linkedin.com/posts/divyakush-punjabi_nec-iitbombay-entrepreneurship-ugcPost-7311167630009106433-MbgE/',
        kind: 'linkedin',
      },
    ],
  }),
  at({
    slug: 'nec-visionary-ventures',
    photo: true,
    fill: true,
    title: 'Visionary Ventures',
    date: '2024',
    blurb:
      'The only team to carry VIT Vellore into the national challenge finished at All India Rank 140. Twelve people, four functions — and Divyakush Punjabi at the head of it.',
    story: [
      'Twelve people, four functions, and a national field. Visionary Ventures was the only team to carry VIT Vellore into the National Entrepreneurship Challenge that year, and it finished at All India Rank 140.',
      'It was run as a company rather than a volunteer list. Research and development held the business model and the evidence underneath it. Marketing and social media ran the public campaign. Content and presentation carried the decks, the blog and the film. Representation fronted the team wherever it had to be spoken for. Every function knew exactly what it owned — which is the only reason a team that size holds at all, because a team this large fails at coordination long before it fails at ideas.',
      'None of them were paid. All of them were full-time students. Most of them were never in the same room. Holding that to a national deadline, for months, is not a matter of enthusiasm. Somebody has to decide what the team is actually claiming, hold twelve people to a schedule none of them is contractually bound to, and answer for output produced by people they cannot see.',
      'That person was Divyakush Punjabi. He built the team, set what it was claiming, and carried the accountability for whether any of it arrived — and he chose to sit with research and development rather than with presentation, which is the tell. He took the function that decided whether the claim was true, not the one that decided how it looked.',
      'He did it in the first semester of his B.Tech, with no track record to draw on and no evidence yet that he could. All India Rank 140 is the number on the record. The more telling fact is that everything further along this timeline — the platforms, the teams, the engineering lead — is the same job, done later, with more evidence and less doubt.',
    ],
    links: [
      {
        label: 'Write-up on LinkedIn',
        href: 'https://www.linkedin.com/posts/divyakush-punjabi_teamwork-entrepreneurship-visionaryventures-share-7312964612952416256-sv5m/',
        kind: 'linkedin',
      },
    ],
  }),
  at({
    slug: 'devjams',
    photo: true,
    fill: true,
    title: "DevJams '24",
    location: 'Vellore, Tamil Nadu',
    date: '2024',
    blurb:
      'Team lead of SYNTAX TERMINATOR — top 12 of more than 250 teams at GDSC DevJams 2024, with a voice-controlled home system built inside the window.',
    story: [
      'DevJams is the flagship hackathon of Google Developer Student Clubs at VIT, and it draws the whole campus. More than 250 teams entered the 2024 edition, and SYNTAX TERMINATOR finished in the top twelve of them.',
      'Divyakush Punjabi led team SYNTAX TERMINATOR, four people, from brainstorming through build to the final pitch.',
      'What went in was a voice-controlled home automation system with no command grammar at all. The Google Gemini API resolves intent from open natural language, Python maps that intent onto actions, and those actions drive Arduino-controlled devices directly — with the Spotify API wired in alongside the hardware so playback is addressable by the same voice path rather than living in a separate app.',
      'Removing the fixed vocabulary is the whole point. A request works because it means something, not because it happened to be worded the way the system expects, which is what makes most voice control in the home feel brittle.',
      'Building it to a hackathon deadline set the scope. Everything that shipped had to work end to end on a table in front of a judge, which is a stricter test than a green build.',
    ],
    links: [
      {
        label: 'The result, on LinkedIn',
        href: 'https://www.linkedin.com/posts/divyakush-punjabi_teamwork-innovation-leadership-activity-7266087499242885121-Sk2I',
        kind: 'linkedin',
      },
    ],
  }),
  at({
    slug: 'iit-ropar-major',
    photo: true,
    fill: false,
    title: 'An AI major, read in parallel',
    location: 'Rupnagar, Punjab',
    date: '2025',
    blurb:
      'Eighteen months of artificial intelligence begin at IIT Ropar, run with NSDC and Masai and read alongside the engineering core rather than after it.',
    story: [
      'A Major Degree in Artificial Intelligence at IIT Ropar, delivered with the National Skill Development Corporation and Masai, running January 2025 to June 2026.',
      'The decision that mattered was to read it in parallel rather than after. A full B.Tech was already running at Vellore; taking eighteen months of AI alongside it meant the two informed each other while both were live — coursework in one turning up as an idea in the other the same term, rather than a year later.',
      'It is also the reason the projects on this site stop being web applications with a model bolted on somewhere around 2025 and start being systems where the model is the thing being engineered.',
    ],
  }),
  at({
    slug: 'startup-summit',
    photo: true,
    fill: true,
    title: 'Bharat’s leading startup summit',
    location: 'Surat, Gujarat',
    date: 'Jun 2025',
    blurb:
      'Two days at 21BY72 Season 4 — eighty-five ventures on the floor, live pitches in front of six hundred investors, and a working lesson in how a business is made to sound like one.',
    story: [
      '21BY72 Season 4 ran on 14 and 15 June 2025 at Avadh Utopia in Surat, organised by IVY Growth Associates. Eighty-five-plus ventures exhibiting, fifteen-plus live pitches in the Trailblazer’s Mine arena with real money on the other side of them, more than a hundred venture funds and five hundred angel investors in the building, and something over twenty thousand people through the doors across the two days.',
      'The two days were spent on the floor rather than in the seats: going stand to stand through fintech, SaaS, healthtech and AI companies, and asking the same few questions of each of them. Doing that eighty times in a row teaches something no reading does. Two founders would describe near-identical products, and one of them would have a business while the other had a demo — and the difference was almost never in the technology.',
      'That is the lesson worth carrying out of it, and it cuts against an engineer’s instinct. The instinct is to explain the mechanism, because the mechanism is the part you built and the part you are proudest of. A summit floor is a very fast education in the fact that the mechanism is the least persuasive thing you own: what moves a room is a sentence that says who this is for and what it replaces, and the ability to hold that sentence steady under questioning. The masterclass track ran on fundraising, branding, legal structure and monetisation, which is the same lesson taught from the front.',
      'The stage carried people who had already done it at national scale — Anupam Mittal of Shaadi.com, Aman Gupta of boAt, Ghazal Alagh of Mamaearth, Raj Shamani, and a fireside chat with Saina Nehwal on mindset, motivation and mastery, across a line-up running past a hundred speakers. The most useful thing about that programme was how little of it was about ideas. An Olympic-level athlete and a consumer-brand founder were, separately, describing the same thing: consistency, a tolerance for a long run of unglamorous days, and the discipline to keep showing up at a standard nobody is checking. That is a measure worth taking away from a summit, and it is available to anyone willing to work to it.',
      'The badge said investor, which in practice meant standing where the hard questions get asked rather than where they get answered. Listening to what a room of professional investors chooses to ask is the cheapest possible education in what your own work is missing.',
    ],
    links: [
      {
        label: 'The summit',
        href: 'https://www.21by72.com/',
        kind: 'live',
      },
    ],
  }),
  at({
    slug: 'summit-floor',
    photo: true,
    fill: true,
    title: 'The calibre of the room',
    location: 'Surat, Gujarat',
    date: 'Jun 2025',
    blurb:
      'A conversation on the exhibition floor with two presidents of TiE Surat, the man who conceived 21BY72, a Vodafone India chief technology officer, and the founder of Insiders Club.',
    story: [
      'On the exhibition floor of the summit, at one of the advisory stands, in company that between them accounts for several decades of building at national scale. Sanjay Punjabi founded the Surat chapter of TiE and served as its first president, and has run an architecture and planning practice since 1994 besides; he chairs Mission 84, the Southern Gujarat Chamber’s programme for carrying the region’s smaller manufacturers into international trade. CA Jignesh Shah, a founder charter member of that same chapter, is its president today. An institution’s first president and its current one, in one frame, is not a common thing to be standing inside.',
      'Nilesh Vohra is chief technology officer for Vodafone India’s global capability centre and group chief technology officer at Cab-E, after two decades across Wipro in Australia, Tech Mahindra and Rolta in the United Kingdom, and an advisory seat at McKinsey on deep tech for telecom. Rachit Poddar conceived 21BY72 itself — the floor everyone was standing on — and is co-founder and director of IVY Growth Associates and managing partner at Arigato Capital: he builds the room and funds what walks into it. Jay Desai, a chartered accountant by training, founded Insiders Club, an invitation-only room for founders, operators and investors, and has made a profession of getting people who build things to say plainly how they did it.',
      'Set side by side they describe a full circuit rather than a guest list — someone who founded the institution, someone who runs it now, someone who has carried enterprise technology at national scale, someone who capitalises the next attempt, and someone who makes sure the account of it survives. Very little in any career happens outside one of those five functions. An afternoon standing where all five overlap teaches more about how ventures actually get built than a season of reading about it.',
      'What that kind of company gives you is not advice. Advice is cheap and mostly generic. It is calibration. People operating at that level are close to impossible to impress with an idea and very easy to interest with an execution, and the scrutiny arrives from four directions at once — who it serves, what happens to it under load, what it replaces, and whether you can say it in one sentence. A piece of work has to answer all four. Listening to which of them your own work answers worst is the cheapest education available.',
      'Divyakush Punjabi was the youngest person in that circle by a wide margin and the only one there without a track record to point at. The honest thing to record is what the conversation changed rather than that it happened: a corrected reading of the distance still to cover, and the practical discovery that the fastest way to earn time from people that far ahead is to arrive with one specific question rather than a pitch, then be quiet and take the answer seriously. Access of that kind is not a credential. It is an opportunity to find out precisely how far short you currently fall, from people with no reason to soften it.',
      'A standard set by people who have already done the thing is a better one to work to than any standard you would set for yourself, because yours is calibrated to what you can currently do. The one on that floor was an enterprise standard, and it is a harder one: not whether a system demonstrates, but whether it stays up, whether somebody who has never met you can operate it, and whether it survives being handed over. Every project further along this timeline was built to that number — multi-tenant platforms carrying real tenants, retrieval systems that answer from sources they can cite, models that ship behind an interface somebody else maintains. Standing in that room reset the measure. The work since has been the argument.',
    ],
  }),
  at({
    slug: 'first-internship',
    photo: true,
    fill: false,
    title: 'The first internship, signed off',
    date: 'Jul 2025',
    blurb:
      'Taken the evening the first professional engagement closed out — four months of UI/UX and front-end work at LayOver, and the team it was done alongside.',
    story: [
      'A UI/UX design internship at LayOver, running 23 March to 20 July 2025. It was the first professional engagement of the lot, and this photograph is the day it ended.',
      'The work ran from research through to production: user research and usability testing on the mobile flows, high-fidelity wireframes and interactive prototypes in Figma, accessibility held as a requirement rather than a pass at the end, and the prototypes translated into responsive React components against the design system the product is built on. Two documents came out of it — a completion certificate and a reference letter — and both are in the certifications wall.',
      'What an internship actually teaches is not a tool. It is that the work stops being judged by whether you like it. A design is finished when somebody who has never met you can use it without being told how, and that standard is set by other people, arrives on their schedule, and is not negotiable — which is a different discipline from a personal project you can keep improving until it satisfies you.',
      'The record of it is a certificate and a letter. The photograph is the other half: the people it was done with, on the evening the last piece of it was handed over. Both are worth keeping, and only one of them is filed.',
    ],
  }),
  at({
    slug: 'electroutsav',
    photo: true,
    fill: false,
    title: 'Adaptive traffic control, in silicon',
    date: '2025',
    blurb:
      'First in its track at the IIC IdeaThon and carried through to ElectroUtsav 2025 — a Verilog traffic controller on FPGA with a sub-10-nanosecond emergency override.',
    story: [
      'A smart adaptive traffic light controller, written in Verilog HDL and run on an FPGA. It took first place in its track at the IIC IdeaThon and was shortlisted through to ElectroUtsav 2025.',
      'The controller adjusts green time to measured traffic density instead of running a fixed cycle, and it is built as a modular finite state machine so that every transition is deterministic and every timing figure is one you can reason about rather than measure and hope.',
      'The emergency override is the part worth knowing about: it responds in under ten nanoseconds, because it is not software. There is no scheduler to wait for and no interrupt latency to argue about — the priority path is wired into the fabric, and that is precisely the reason to reach for hardware rather than a microcontroller and a loop.',
      'It is also the clearest lesson on this timeline about choosing a substrate. The same behaviour in firmware would have been easier to write, impossible to guarantee, and wrong for the one requirement that actually mattered.',
    ],
    links: [
      {
        label: 'Write-up on LinkedIn',
        href: 'https://www.linkedin.com/posts/divyakush-punjabi_fpga-verilog-digitalsystems-ugcPost-7395119370793988096-Zy26/',
        kind: 'linkedin',
      },
    ],
  }),
  at({
    slug: 'submissions-closed',
    photo: true,
    fill: true,
    title: 'The day the submissions went in',
    location: 'Vellore, Tamil Nadu',
    date: '2025',
    blurb:
      'Outside the FPGA lab, the hour every deliverable for the hardware project was finally filed — the half of engineering nobody photographs.',
    story: [
      'This is what the end of a submission window looks like. Every deliverable the hardware project required — the documentation, the forms, the artefacts, the version of the design that actually matches the board rather than the one from three revisions ago — checked, packaged and filed, on the day it was due.',
      'It is worth a slide precisely because it is not the demo and not the result. Technical work is lost far more often at this stage than at the design stage: a portal that closes on the hour, a report that describes an earlier build, a figure quoted from memory instead of from the run that produced it. A design that works and a submission that is complete are two separate pieces of work, and only one of them is ever assessed.',
      'The team split it so that nothing waited on any single person, which is the only arrangement that survives a fixed deadline and a group of full-time students. The consequence was that the last few hours went on checking rather than building — which is exactly the state you want to be in when a window closes, and almost never the state anyone is actually in.',
      'The photograph was taken because the work was finished, not because it had gone well or badly; at that point nobody knew. Finishing is a skill in its own right, it is rarer than it should be, and this is the only picture on this timeline of it.',
    ],
  }),
  at({
    slug: 'smart-india-hack',
    photo: true,
    fill: true,
    title: 'Smart India Hackathon 2025',
    date: '2025',
    blurb:
      'Shortlisted out of more than 400 teams at Smart India Hackathon 2025 for an AI and IoT rockfall early-warning system, architected end to end.',
    story: [
      'Sudden rockfalls in open-pit mines kill people, stop production and cost enormous amounts of money, and the industry response is overwhelmingly reactive — you find out when it has already happened. The brief was to make it predictive.',
      'What was built is an early-warning system that estimates rockfall probability from multi-sensor data fusion at around 97% model accuracy — 98% AUC-ROC on the evaluation split — runs across an edge-and-cloud split so a mine keeps its warning when connectivity does not, raises real-time alerts, carries an SOS and emergency buzzer path for people on the ground, and reports into a live monitoring dashboard. No public dataset fitted the problem, so the training set was built from scratch inside a week.',
      'The engineering here was end to end and single-handed: the front end, the backend, the database design, the SOS module, the buzzer integration and the web application experience.',
      'It cleared the internal round and went through to detailed submission on the national portal, shortlisted from a field of more than four hundred teams. It did not reach the national finals — but the depth of what was standing at the end of it is a long way past a hackathon prototype, and it is a full case study on this site rather than a line on a list.',
    ],
    links: [
      {
        label: 'Write-up on LinkedIn',
        href: 'https://www.linkedin.com/posts/divyakush-punjabi_smartindiahackathon-sih2025-ai-ugcPost-7434008786127998976-1W2z/',
        kind: 'linkedin',
      },
      {
        label: 'Source on GitHub',
        href: 'https://github.com/Divyakush2006/AI-ROCKFALL-DETECTION-AND-PREVENTION',
        kind: 'source',
      },
    ],
  }),
  at({
    slug: 'iit-ropar-convocation',
    photo: true,
    fill: false,
    title: 'Convocation day at IIT Ropar',
    location: 'Rupnagar, Punjab',
    date: 'Jun 2026',
    blurb:
      'Outside the hall in Rupnagar, before the ceremony — the banner for the Major in Artificial Intelligence, eighteen months after the first module opened.',
    story: [
      'The banner outside the venue carried the three marks the programme ran under — IIT Ropar, the National Skill Development Corporation and Masai — over a single line: the successful completion of the Major in Artificial Intelligence. January 2025 to June 2026, closed out at a convocation in Rupnagar.',
      'Almost none of those eighteen months happened here. The coursework, the assessments and the capstone were all done from a campus in Tamil Nadu, in the gaps around a full B.Tech that was running at the same time. Convocation was the first time the programme had an address and a room rather than a login.',
      'That is the part of the day worth writing down, and it is the part a hiring panel rarely sees. A qualification read in parallel is invisible while it is happening: no cohort in the corridor, nobody asking how the term is going, and no shared deadline that anyone around you is also working to. It gets finished on self-imposed dates or it does not get finished at all. Walking up to a banner with the completion printed on it is the first external confirmation that the second track was ever there.',
      'What travels out of it is the work rather than the ceremony — a machine-learning core through to a capstone, a transformer-based sequential recommender that finished at 98.47% AUC-ROC, and the reason the projects on this site stop bolting a model onto an application somewhere in 2025 and start engineering the model as the product.',
      'The certificate itself was handed over inside, by Prof. Sudarshan Iyengar, Head Coordinator for the programme — the next moment in this run, and the one where the conversation afterwards turned out to be worth more than the paper.',
    ],
  }),
  at({
    slug: 'iit-ropar-complete',
    photo: true,
    fill: false,
    title: 'One with the grandmaster of computer science at IIT Ropar',
    location: 'Rupnagar, Punjab',
    date: 'Jun 2026',
    blurb:
      'The Major in Artificial Intelligence conferred at IIT Ropar by Prof. Sudarshan Iyengar — and a long conversation afterwards about what the field leaves for engineers.',
    story: [
      'Eighteen months of coursework closed out: the Major Degree in Artificial Intelligence at IIT Ropar, run with NSDC and Masai, completed alongside a full engineering degree rather than after it.',
      'The certificate was handed over by Prof. Sudarshan Iyengar, whose research at IIT Ropar is in collective intelligence and social computing — how groups come to know things, which is an unusually good lens to have on a field currently arguing about machines that do — and whose NPTEL and SWAYAM courses have taught this subject to more people than most universities will reach in a century.',
      'Which is why the conversation afterwards was the part worth travelling for. Someone who has explained computing to that many learners has no patience for the fashionable version of a question, and the one on the table was where artificial intelligence is actually going and what it leaves for engineers to do. The honest form of it is not whether the work disappears. It is which parts of it stop being valuable and which become the whole job — and an answer to that, from someone with that vantage point, is a better thing to carry out of a programme than the certificate is.',
    ],
  }),
];
