import React from 'react';
import { Link } from '../components/Link';
import { ArrowUpRight } from 'lucide-react';
import { PROJECTS } from '../lib/projects';

/* A 404 that is still a way in: the ten projects are listed, so a
   mistyped slug lands somewhere useful rather than at a dead end. */
export function NotFound() {
  return (
    <main id="main" className="flex min-h-[100svh] flex-col justify-center bg-ink pt-[var(--nav-h)]">
      <div className="mx-auto w-full max-w-shell px-gutter py-24">
        <p className="eyebrow text-bone-raised/50">404</p>
        <h1 className="mt-6 max-w-[16ch] text-balance font-display text-display-lg font-bold leading-[0.94] text-bone-raised">
          That page does not exist.
        </h1>
        <p className="mt-6 max-w-xl text-lede text-bone-raised/60">
          The projects below do. Or go back to the top of the site.
        </p>

        <Link
          href="/"
          className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-3.5 font-mono text-meta-sm font-bold uppercase text-ink transition-colors hover:bg-white"
        >
          Back to the site
          <ArrowUpRight
            className="h-4 w-4 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>

        <ul className="mt-16 grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-2">
          {PROJECTS.map((project) => (
            <li key={project.slug} className="bg-ink">
              <Link
                href={`/projects/${project.slug}`}
                className="flex items-baseline justify-between gap-6 px-1 py-5 transition-colors hover:bg-white/[0.04] sm:px-5"
              >
                <span className="font-display text-display-sm font-bold text-bone-raised">
                  {project.title}
                </span>
                <span className="shrink-0 font-mono text-meta-sm uppercase text-bone-raised/40">
                  {project.year}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export default NotFound;
