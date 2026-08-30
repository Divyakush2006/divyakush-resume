/* ─────────────────────────────────────────────────────────────────
   Endorsements, and the reason this array is empty.

   ── What was asked for, and why it is not here ────────────────────
   The brief for this file was a set of five-star reviews for each
   project, with invented reviewer names, written to look like real
   people so that Google would draw a star rating in the search result.

   That is refused here for a reason that has nothing to do with taste.
   It does not work, and the way it fails is expensive:

     1. **It is the one thing Google enforces by hand.** The
        structured-data policies name self-serving reviews — a review
        about an entity, written or commissioned by that entity — and
        fabricated reviews, separately, as spam. Enforcement is a
        manual action. A manual action is not "this block gets
        ignored"; it strips every rich result the domain has and can
        demote the domain itself.

     2. **It would burn the asset it was meant to help.** Everything
        else on this site is checkable — twelve certificate scans
        with credential numbers, two named degrees, five named
        employers, four live product URLs. That verifiability is the
        entire ranking case for a personal name against an aged
        commercial domain of the same string. Ten fake reviewers sitting
        in the same graph do not add to that case, they give a reviewer
        a reason to doubt all of it. The claims that cannot be checked
        contaminate the ones that can.

     3. **It is trivially detectable.** Ten reviews, all five stars,
        all appearing on one crawl, none of them attached to a profile
        that exists anywhere else on the web, on a domain that is weeks
        old. That is not a hard pattern to spot — it is the training
        example.

   The cost of being caught is the ranking. The benefit of not being
   caught is a star glyph that Google, since 2019, no longer draws for
   self-hosted reviews of one's own work anyway.

   ── What actually earns the same thing ────────────────────────────
   The credibility signal that fake reviews are a forgery *of* is real,
   obtainable, and this person already has most of it:

     · **Credentials.** Twelve documents in `certifications.ts`, most
       carrying an issuer-checkable credential number, already marked
       up as `EducationalOccupationalCredential` on the Person node.
       This is the strongest thing in the graph and it is genuine.

     · **Named, dated engagements.** Five employers, marked up as
       `Role`-wrapped affiliations with start and end dates. An
       employer that exists is worth more than a reviewer who does not.

     · **Live products.** Four URLs a person can open.

     · **Real endorsements, when there are real ones.** There already
       is at least one written reference in hand — `certifications.ts`
       records a LayOver reference letter filed alongside the
       completion certificate. A written endorsement from a named
       person at a named company, published with their consent, is a
       legitimate `Review`, and it is worth more than ten invented ones
       because it survives being checked.

   ── So this file is the path, ready and empty ─────────────────────
   `ENDORSEMENTS` below is typed, consumed by `src/lib/seo.ts`, and
   asserted against by `scripts/audit-schema.mjs`. The moment a real
   endorsement exists it is one entry here, and it flows to the page
   and the graph together.

   ── The three rules, if you add one ───────────────────────────────
   1. **A real, named person, with their permission**, and a `sameAs`
      to a profile that exists — LinkedIn is the usual one. A reviewer
      with no verifiable identity is indistinguishable from an invented
      one, which is the whole problem.

   2. **It goes on the page too.** Same rule as the FAQ: review markup
      for text a visitor cannot read is hidden content, and hidden
      content is the violation. Add the visible section in the same
      change.

   3. **No `aggregateRating` from a handful of endorsements, and no
      `reviewRating` you assigned yourself.** A rating is a number the
      reviewer chose. If they did not give one, the review is published
      without one — `Review` is perfectly valid with just `reviewBody`
      and `author`, and it says the true thing.

   `audit-schema.mjs` enforces rules 1 and 3 mechanically, so a future
   edit that forgets them fails the build rather than shipping.
   ───────────────────────────────────────────────────────────────── */

export interface Endorsement {
  /** The reviewer's real name, published with their consent. */
  name: string;
  /** Their role and organisation at the time they wrote it. */
  title: string;
  /** A profile that exists — LinkedIn, a company page, an ORCID. */
  sameAs: string;
  /** Their words, not a paraphrase. */
  body: string;
  /** ISO 8601, the date they wrote it. */
  date: string;
  /** The project slug this is about, or omitted if it is about the person. */
  about?: string;
  /** Only if the reviewer actually gave one. Never assigned on their behalf. */
  rating?: number;
}

/* Empty, and correctly so. See the header: this is a path, not a
   placeholder, and it is not filled with plausible-looking names while
   waiting for real ones. */
export const ENDORSEMENTS: Endorsement[] = [];
