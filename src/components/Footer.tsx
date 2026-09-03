import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUp, Briefcase, Github, Linkedin, Star } from 'lucide-react';
import { FOOTER_NAV, PROFILE } from '../lib/content';
import { EASE_OUT } from '../lib/motion';
import { SectionLink } from './primitives';

/* ─────────────────────────────────────────────────────────────────
   Footer.

   Rebuilt as a close, not a second navigation bar.

   What it was: a keyword marquee — the same device as the capability
   wall two sections up — over a single thin row of name, four links
   and a copyright. Read at the bottom of the page it was
   indistinguishable from the header, which is why it landed as "more
   site" rather than an ending.

   What makes an ending:
     · The marquee is gone. It duplicated the capability wall and gave
       the eye something still moving at the point the page should be
       coming to rest.
     · A full index instead of four links. The header carries four
       because it has room for four; a footer is where the rest of the
       page gets accounted for, and eight sections exist.
     · Real closing information — availability, and the local time
       where the work happens, live. A recruiter three timezones away
       reads that as "when can I expect a reply", which is the actual
       question at the bottom of a portfolio.
     · An oversized wordmark, revealed from behind its own baseline,
       as the last thing on the page. That is the signature — the one
       element the header cannot also be doing.
   ───────────────────────────────────────────────────────────────── */

const SOCIALS = [
  { name: 'LinkedIn', url: PROFILE.links.linkedin, icon: Linkedin },
  { name: 'GitHub', url: PROFILE.links.github, icon: Github },
];

/* ── Google preferred sources ─────────────────────────────────────
   The deeplink that opens Google's source-preferences dialog with this
   site filled in. A reader who confirms it gets a "Preferred" badge on
   this domain's links inside AI Overviews and AI Mode, and Google
   reports preferred sources are around twice as likely to be clicked.

   ── Why a link and not Google's button ────────────────────────────
   Google documents two ways to offer this. The recommended one is two
   lines: a <script> from news.google.com and a <div> the library fills
   with a translated, themed button. It is not used here.

   That script is a third-party origin, and `script-src` in
   public/_headers currently permits exactly `'self'`,
   googletagmanager and Cloudflare Insights. Adding news.google.com —
   and whatever `connect-src` and `frame-src` the library needs once it
   initialises — widens a policy that was just narrowed, to render a
   button. It is also another blocking third-party script on a site
   whose weakest measurement is mobile first paint.

   The deeplink is Google's own documented no-JavaScript alternative.
   It costs one anchor: no script, no CSP change, no request until the
   reader clicks.

   ── What this does and does not do ────────────────────────────────
   Preferred sources are chosen by readers, not granted by Google.
   There is no application, no approval and no markup that qualifies a
   site — eligibility is only that it is a domain or subdomain (not a
   subdirectory) publishing fresh content, which this is. So this link
   does not make the site a preferred source; it removes the friction
   for somebody who already wants to pick it. That is the whole of what
   is available here, and worth exactly one anchor in a footer.

   Built from `PROFILE.links.site` rather than typed, so the host in
   the query cannot drift from the host the site is served on.

   ── Bare domain, not the `www` host ───────────────────────────────
   The first version passed `new URL(...).host`, which is
   `www.divyakush.com`, and Google's own documented deeplink is

     https://www.google.com/preferences/source?q=example.com

   — the registrable domain, with no subdomain. The tool works at
   domain and subdomain level, and `www` is a subdomain: asking it for
   `www.divyakush.com` asks a question about a different string from
   the one it files the site under. So the prefix is stripped, and only
   that prefix — a real subdomain would still be passed through, which
   is what the anchored `^` is for. */
const PREFERRED_SOURCE_URL = `https://www.google.com/preferences/source?q=${
  new URL(PROFILE.links.site).host.replace(/^www\./, '')
}`;


/** The account, not the URL. The row already names the platform, so the
    host is noise; the handle is the part that identifies anything. */
const handleOf = (url: string) => `/${url.replace(/\/+$/, '').split('/').pop()}`;

/** Local time where the work happens. IST is UTC+5:30 — a half-hour
    offset, so it cannot be derived by rounding and is asked for by
    name. */
const CLOCK = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function useLocalTime() {
  const [time, setTime] = useState(() => CLOCK.format(new Date()));

  useEffect(() => {
    /* Thirty seconds, not one. The display has minute resolution, so a
       one-second interval would re-render fifty-nine times for nothing. */
    const id = window.setInterval(() => setTime(CLOCK.format(new Date())), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return time;
}

/* Measured on `ink-sunk`, which is darker than the panels elsewhere and
   so needs its own numbers:
     bone-raised/35 → 2.89:1   fails 4.5:1
     bone-raised/45 → 4.11:1   fails
     bone-raised/55 → 5.70:1   passes
     bone-raised/65 → 7.68:1   passes
   Every label in here was /35. They are the words that tell you what
   each column is, so they were the least readable text in the section
   and the most load-bearing. */
const COLUMN_LABEL = 'font-mono text-meta-sm uppercase text-bone-raised/55';

/* Two separate reasons the obvious version of this reveal never fired,
   both worth keeping written down.

   1. The shared `viewportOnce` carries `margin: '-12% 0px -12% 0px'`,
      which shrinks the observer root at the *bottom* as well as the
      top. The wordmark sits about 100px above the end of the document
      — closer to it than that margin is deep — so at full scroll it
      is still outside the shrunken root, and there is no further to
      scroll. Hence this config, with no negative bottom inset.

   2. Even then, `whileInView` on the text itself cannot work. The mask
      around it is `overflow-hidden`, and IntersectionObserver clips
      against ancestor overflow — so while the text sits translated
      108% down, behind the mask, its visible area is exactly zero and
      it never counts as in view. The mask hides the element, so the
      element never animates out from behind the mask.

      The observer therefore goes on the *container*, which is always
      visible, and the text follows as a variant. */
const LAST_ELEMENT = { once: true, margin: '0px 0px -40px 0px' } as const;

export function Footer() {
  const year = new Date().getFullYear();
  const time = useLocalTime();
  const reduced = useReducedMotion() ?? false;

  const toTop = () =>
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });

  return (
    /* `id` is load-bearing, not decoration: the nav hides itself once
       the outro covers the lower half of the screen, and it needs to
       find *this* element to do it. Locating it by tag name broke the
       moment a second `<footer>` appeared anywhere earlier in the
       document. */
    <footer
      id="site-footer"
      className="relative z-10 border-t border-white/12 bg-ink-sunk text-bone-raised"
    >
      <div className="mx-auto w-full max-w-shell px-gutter">
        {/* ── Index ── */}
        <div className="grid grid-cols-1 gap-12 pt-20 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-16 lg:pt-24">
          <nav aria-label="All sections">
            <p className={COLUMN_LABEL}>Index</p>
            <ul className="mt-6 grid grid-cols-1 gap-x-10 gap-y-3.5 sm:grid-cols-2">
              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <SectionLink
                    href={item.href}
                    /* `py-1 -my-1` is a hit area, not spacing. At
                       `text-sm` the line box is 20px, under the 24px
                       WCAG 2.2 minimum for a touch target; the padding
                       takes it to 28px and the negative margin removes
                       that padding again from the layout, so the row
                       pitch is unchanged and only the tappable box
                       grows. The rows are 14px apart, so neighbouring
                       targets still clear each other by 6px. */
                    className="group -my-1 inline-flex items-center gap-2.5 py-1 text-sm text-bone-raised/65 transition-colors duration-200 hover:text-bone-raised"
                  >
                    <span
                      aria-hidden="true"
                      className="h-px w-0 bg-accent transition-all duration-300 ease-out group-hover:w-4"
                    />
                    {item.label}
                  </SectionLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Two lines per row, not one.
              Measured, this column reached 47% of its own height — two
              short links in a box as tall as eight, which is the hole
              the section read as. Naming the account underneath fills
              it with the one thing a link like this withholds: which
              account it actually goes to, before you click it. */}
          <div>
            <p className={COLUMN_LABEL}>Elsewhere</p>
            <ul className="mt-6 flex flex-col gap-5">
              {SOCIALS.map(({ name, url, icon: Icon }) => (
                <li key={name}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3"
                  >
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0 text-bone-raised/55 transition-colors duration-200 group-hover:text-accent"
                      aria-hidden="true"
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm leading-none text-bone-raised/65 transition-colors duration-200 group-hover:text-bone-raised">
                        {name}
                      </span>
                      <span className="mt-1.5 truncate font-mono text-meta-sm text-bone-raised/55">
                        {handleOf(url)}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={COLUMN_LABEL}>Status</p>

            {/* A mark, not a pulse. The dot that was here blinked on a
                2.4s loop for as long as the footer was on screen —
                permanent motion in the one part of the page a reader
                has stopped to read, and it said nothing the words next
                to it did not already say. A briefcase states the same
                thing and holds still. */}
            <p className="mt-6 inline-flex items-center gap-2.5 text-sm text-bone-raised">
              <Briefcase className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              Available for work
            </p>
            <p className="mt-3 max-w-[26ch] text-sm leading-relaxed text-bone-raised/65">
              Open to full-time, contract and collaborative engagements.
            </p>

            <dl className="mt-8 border-t border-white/8 pt-6">
              <dt className={COLUMN_LABEL}>Local time</dt>
              <dd className="mt-2.5 font-mono text-sm text-bone-raised/85">
                {/* `time` already ticks; the label states the zone once
                    rather than repeating it in the formatted string. */}
                {time} <span className="text-bone-raised/55">IST · UTC+5:30</span>
              </dd>
            </dl>

            {/* Not in the "Elsewhere" column, deliberately. Those two
                rows are profiles of this person, they carry rel="me" in
                the crawler-facing markup, and they are what `sameAs` in
                the JSON-LD names. A Google preference dialog is an
                action a reader takes, not an account he holds, and
                filing it with the profiles would weaken the one signal
                that column exists to make. */}
            <div className="mt-8 border-t border-white/8 pt-6">
              <p className={COLUMN_LABEL}>On Google</p>
              <a
                href={PREFERRED_SOURCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                /* `py-1.5` with the top margin reduced to match, so the
                   link sits where it looks like it should while its hit
                   area clears 24px. At `mt-3` with no padding the box
                   measured 221x23 and `npm run audit:responsive` failed
                   it — one pixel under the WCAG 2.2 target-size
                   minimum, which is exactly the kind of miss that is
                   invisible on a desktop and irritating on a phone. */
                className="group mt-1.5 inline-flex items-start gap-2.5 py-1.5 text-sm leading-relaxed text-bone-raised/65 transition-colors duration-200 hover:text-bone-raised"
              >
                <Star
                  className="mt-0.5 h-4 w-4 shrink-0 text-bone-raised/55 transition-colors duration-200 group-hover:text-accent"
                  aria-hidden="true"
                />
                <span className="max-w-[26ch]">Set this site as a preferred source</span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Wordmark ──
            Fluid to the shell width, so it reads as a closing plate at
            every size instead of a heading that happens to be large.
            Masked by its own container and lifted from below on entry.

            The gap above it measured 96px, which is what left the lower
            half of the section reading as a separate, emptier page. It
            is now 56px: enough that the signature is clearly not part
            of the columns, not so much that it floats free of them. */}
        <motion.div
          initial={reduced ? false : 'hidden'}
          whileInView="show"
          viewport={LAST_ELEMENT}
          className="mt-14 overflow-hidden border-t border-white/8 pt-9 lg:mt-16"
        >
          <motion.p
            aria-hidden="true"
            variants={{ hidden: { y: '108%' }, show: { y: '0%' } }}
            transition={{ duration: 0.9, ease: EASE_OUT }}
            /* Tuned so the name fills ~93% of the plate at every width
               rather than the 84% it started at — a signature that
               stops well short of its own margins reads as a heading,
               not a close. The remaining 7% is deliberate slack: the
               display face is hotlinked from a CDN and falls back to
               Inter, which sets wider, and `whitespace-nowrap` inside
               an `overflow-hidden` mask would clip the surname rather
               than wrap it. Measured at 360, 390, 430, 768, 1024,
               1280, 1440, 1600 and 1920. */
            /* /12 composited to about #232323 on this surface, which is
               close enough to the ground that it read as a compression
               artefact rather than a signature. /15 is the next stop the
               theme's opacity scale actually carries — an arbitrary /13
               or /14 emits no rule at all. */
            /* `pb` is what keeps the descenders. `leading-[0.86]` makes
               the line box shorter than the glyphs it carries, which is
               fine on its own — text paints outside its line box quite
               happily — but this one is inside an `overflow-hidden`
               mask it needs for the reveal, and the mask is sized by
               this element. So the box ended exactly at the baseline's
               line-box bottom and the tails of the `y` and the `j` were
               cut off flat.

               Measured ink sits 0.136em below that edge at both ends of
               the clamp (6.4px at 46.8px type, 20.3px at 168px), so the
               padding is set at 0.2em: past the measurement, with room
               for the fallback face, since the display font is
               hotlinked and Inter sets deeper. Padding rather than a
               looser `leading` because leading would add the same space
               above the caps and drop the signature off its rule. */
            className="select-none whitespace-nowrap pb-[0.2em] font-display text-[clamp(2.6rem,12vw,10.5rem)] font-bold leading-[0.86] tracking-[-0.05em] text-bone-raised/15"
          >
            {PROFILE.name}
          </motion.p>
        </motion.div>

        {/* ── Bottom rail ── */}
        <div className="flex flex-col gap-5 border-t border-white/8 py-8 sm:flex-row sm:items-center sm:justify-between">
          {/* ── Copyright ──
              A notice, not a decoration. It names the year, the holder
              and the reservation, then states in one line what the
              reservation covers — which is the part a reader needs if
              they are working out whether a photograph or a paragraph
              here can be lifted, and the part a company's legal review
              looks for when it reads a portfolio as a work sample.

              The tone is the site's, not a template's: the trailing
              sentence exists because several logos and product names on
              this page belong to other people, and saying so is both
              accurate and the thing that keeps nominative use nominative.

              On colour: /35 composited to 2.89:1 against `ink-sunk`,
              under the 4.5:1 minimum — the one line on the page with
              legal weight was also the least readable text on it. /55
              measures 5.70:1. See the table above COLUMN_LABEL. */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-meta-sm uppercase text-bone-raised/55">
              © {year} {PROFILE.name}. All rights reserved.
            </p>
            <p className="max-w-[64ch] text-[11px] leading-relaxed text-bone-raised/55">
              {PROFILE.role} — the writing, design, code and photographs on this site are the
              work of {PROFILE.name} unless credited otherwise. Product names, logos and
              brands remain the property of their respective owners and appear here for
              identification only.
            </p>
          </div>

          <button
            type="button"
            onClick={toTop}
            className="group inline-flex w-fit items-center gap-2.5 rounded-full border border-white/12 px-4 py-2.5 font-mono text-meta-sm uppercase text-bone-raised/65 transition-colors duration-200 hover:border-accent hover:text-accent"
          >
            Back to top
            <ArrowUp
              className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </footer>
  );
}
