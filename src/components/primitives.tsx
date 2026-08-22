import React from 'react';
import { usePathname } from 'next/navigation';
import { Link } from './Link';
import { motion } from 'motion/react';
import { riseIn, viewportOnce } from '../lib/motion';

/* ─────────────────────────────────────────────────────────────────
   A link to a section of the home page.

   On the home page it stays a plain anchor, because that is what the
   browser scrolls smoothly and what `scroll-padding-top` is tuned
   for. From a project page the same link has to become a router link to
   `/#section`, or clicking it either does nothing or reloads the
   whole document. Both the header and the footer use this, so the two
   can never disagree about how a section link behaves.
   ───────────────────────────────────────────────────────────────── */
export function SectionLink({
  href,
  className,
  onClick,
  children,
  ...rest
}: {
  /** A fragment, e.g. `#work`. */
  href: string;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick' | 'className'>) {
  const pathname = usePathname();

  if (pathname === '/') {
    return (
      <a href={href} className={className} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link href={`/${href}`} className={className} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Shared section header.

   Every section previously hand-built its own eyebrow + heading pair,
   each with slightly different sizes, colours, dot treatments and
   bottom margins — which is most of why the old page read as ten
   separate templates rather than one site. This is the only way a
   section heading gets rendered now.
   ───────────────────────────────────────────────────────────────── */

type Tone = 'light' | 'dark';

export function SectionHeader({
  kicker,
  title,
  aside,
  tone,
  className = '',
}: {
  /** Short label above the heading. */
  kicker: string;
  title: React.ReactNode;
  /** Optional supporting line, right-aligned on desktop. */
  aside?: React.ReactNode;
  tone: Tone;
  className?: string;
}) {
  const light = tone === 'light';

  return (
    <motion.div
      variants={riseIn}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className={`mb-14 border-t pt-6 sm:mb-18 ${
        light ? 'border-black/12' : 'border-white/12'
      } ${className}`}
    >
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          {/* Label only. The old "02 / Selected work" numbering implied a
              document you were meant to read in order and added a token
              to parse before the actual label. */}
          <p className={`eyebrow mb-5 ${light ? 'text-ink/55' : 'text-bone-raised/55'}`}>
            {kicker}
          </p>

          <h2 className="text-balance font-display text-display-lg font-bold">{title}</h2>
        </div>

        {aside && (
          <p
            className={`max-w-sm text-sm leading-relaxed md:text-right ${
              light ? 'text-ink/65' : 'text-bone-raised/65'
            }`}
          >
            {aside}
          </p>
        )}
      </div>
    </motion.div>
  );
}
