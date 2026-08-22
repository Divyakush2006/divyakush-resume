import React from 'react';
import { Link } from './Link';
import { ArrowRight } from 'lucide-react';

import { SectionHeader } from './primitives';
import { PROJECTS } from '../lib/projects';
import { Picture } from './Picture';

/* ─────────────────────────────────────────────────────────────────
   Selected work, on a phone: a list.

   The desktop version of this section is a scroll-linked deck — ten
   full-viewport frames, each pinned in turn while the page scrolls
   through it, content inside animating on a timeline driven by scroll
   position. It is the best thing on the site at 1440px and the wrong
   thing at 390px, for reasons that have nothing to do with taste:

     · Ten viewports plus a dwell each makes the section roughly twenty
       screens tall. On a phone that is a long, committed scroll before
       anything below it can be reached.
     · Pinning fights the browser's own scroll handling — most of all
       on iOS, where the compositor is already doing address-bar
       collapse and rubber-banding on the same gesture.
     · Every frame holds a full-bleed cover with a 70px-blur shadow.
       Ten of those are ten large composited layers on the hardware
       least able to hold them.

   So below `md` the deck is replaced by this: the same ten projects,
   the same covers, the same result band, the same link, laid out as a
   plain document that scrolls at the speed the reader moves it. No
   pinning, no scroll-linked transforms, no per-frame animation.

   Desktop is untouched. This renders instead of the deck, never
   alongside it — see the branch at the top of SelectedWorks.
   ───────────────────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, '0');

export function WorksListMobile() {
  return (
    <section
      id="work"
      className="relative z-10 bg-bone py-20 text-ink on-light"
      style={{ scrollMarginTop: 'var(--nav-h)' }}
    >
      <div className="mx-auto w-full max-w-shell px-gutter">
        <SectionHeader
          kicker="Selected work"
          tone="light"
          title={<>What got built, and what each one proves.</>}
          aside={
            <>
              {PROJECTS.length} projects — multi-tenant platforms carrying real tenants, retrieval
              systems that cite their sources, and hardware that had to work in a room.
            </>
          }
        />

        <ol className="flex flex-col gap-14">
          {PROJECTS.map((project, i) => (
            <li key={project.slug} className="border-t border-black/12 pt-8">
              <article>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-meta-sm uppercase text-ink/55">
                  <span className="text-accent-dim">{pad(i + 1)}</span>
                  <span aria-hidden="true" className="h-px w-4 bg-black/20" />
                  <span>{project.category}</span>
                  <span aria-hidden="true" className="h-px w-4 bg-black/20" />
                  <span>{project.year}</span>
                </p>

                <h3 className="mt-4 text-balance font-display text-display-sm font-bold leading-tight text-ink">
                  {project.title}
                </h3>

                {/* Cover, with the result as its caption — the one fact
                    the deck frame put over the picture. */}
                <figure className="mt-5 overflow-hidden rounded-panel border border-black/12">
                  <Picture
                    src={project.cover}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    sizes="100vw"
                    className="block aspect-[16/10] w-full object-cover object-center"
                  />
                  <figcaption className="bg-ink px-4 py-2.5">
                    <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <span className="shrink-0 font-mono text-meta-sm uppercase text-bone-raised/40">
                        Result
                      </span>
                      <span className="shrink-0 font-display text-[15px] font-bold leading-none tracking-tight text-accent">
                        {project.proof.value}
                      </span>
                      <span className="min-w-0 text-[12px] leading-snug text-bone-raised/55">
                        {project.proof.label}
                      </span>
                    </p>
                  </figcaption>
                </figure>

                <p className="mt-5 text-lede font-medium text-ink/75">{project.summary}</p>

                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {project.stack.map((s) => (
                    <li
                      key={s}
                      className="rounded border border-black/12 bg-black/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink/65"
                    >
                      {s}
                    </li>
                  ))}
                </ul>

                {/* The top margin lives on the wrapper, not the link.
                    `mt-6` and `-my-4` both set `margin-top`, and which
                    wins is decided by their order in Tailwind's
                    generated stylesheet rather than the order written —
                    a coin flip that would silently eat either the
                    spacing or the 46px hit area. */}
                <div className="mt-6">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="-my-4 inline-flex items-center gap-3 py-4 font-mono text-meta-sm font-bold uppercase tracking-wider text-ink/65"
                  >
                    View in detail
                    <ArrowRight className="h-3.5 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default WorksListMobile;
