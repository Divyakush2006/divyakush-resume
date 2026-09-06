import type { ImgHTMLAttributes } from 'react';

/* ─────────────────────────────────────────────────────────────────
   When a content image is allowed to start downloading.

   Every photograph, cover and certificate below the fold used to carry
   `loading="lazy"`, and on paper that is the correct attribute: do not
   spend a byte on a picture the reader may never scroll to.

   In practice it produced the worst possible sequence. The entrance
   animation is driven by `whileInView`, which fires on an
   IntersectionObserver; the browser's own lazy-load threshold fires on
   roughly the same boundary. So arriving at a section did all of this,
   in this order:

     1. the observer fires, the reveal starts
     2. an empty box fades and slides up over 750ms
     3. *now* the image is requested
     4. it arrives, decodes, and snaps in on top of the finished
        animation

   The picture always appears after its own entrance. Measured on the
   home page at 1440px: 25 images, 3 of which load before any scroll.
   The other 22 each pay that sequence.

   The fix is to separate the two things that had been conflated.
   Downloading is a network decision and belongs at page start;
   revealing is a choreography decision and stays exactly where it was,
   on the observer. An image that is already decoded when its reveal
   fires animates as a picture rather than as an empty rectangle, which
   is the whole point.

   ── Why this is affordable ────────────────────────────────────────
   It is worth being honest that this spends bytes the old attribute
   saved. Measured over the full page, every image included:

     /                    desktop  854 KB    mobile  300 KB
     /projects/saturdays  desktop  259 KB    mobile   73 KB
     /projects/netra      desktop  178 KB    mobile   58 KB

   That is the entire cost, and it is smaller than this site's
   JavaScript by some margin. It is not a page's worth of megapixels
   because src/components/Picture.tsx already ships a four-rung srcset
   — the browser fetches the rendition that fits the box, so a phone
   pays for 400px files whatever the master weighs.

   ── fetchPriority ─────────────────────────────────────────────────
   `loading="eager"` alone would have these competing with the one
   image that actually matters for the first paint. `low` tells the
   browser to queue them behind the document, the bundle, the fonts and
   the hero — they are wanted early, not urgently. The cover on a
   project page is marked `high` at its call site for the same reason,
   from the other direction.

   ── The one case still deferred ───────────────────────────────────
   Save-Data, and 2G. A reader who has asked the browser to spend less,
   or who is on a connection where 300 KB is a real wait, keeps the old
   behaviour. Resolved once per page load and cached: this answers
   "should this page fetch its images up front", which is a question
   that has one answer per load. It is deliberately not reactive —
   re-deciding on resize would change an attribute for images that have
   already been requested, which does nothing.
   ───────────────────────────────────────────────────────────────── */

type LoadingProps = Pick<
  ImgHTMLAttributes<HTMLImageElement>,
  'loading' | 'fetchPriority' | 'decoding'
>;

/** The subset of NetworkInformation this cares about; not in lib.dom. */
type Connection = { saveData?: boolean; effectiveType?: string };

let resolved: LoadingProps | null = null;

function deferred(): boolean {
  /* No navigator means a render that is not in a browser. Nothing is
     being painted, so the conservative answer costs nothing. */
  if (typeof navigator === 'undefined') return true;

  const conn = (navigator as Navigator & { connection?: Connection }).connection;
  if (!conn) return false; // Safari and Firefox: no signal, assume it is fine

  if (conn.saveData) return true;
  return conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g';
}

/**
 * Loading attributes for a content image — a photograph, a project
 * cover, a certificate scan. Spread onto the `Picture`:
 *
 *     <Picture src={...} alt={...} sizes={...} {...contentImage()} />
 *
 * Not for the element that will be the Largest Contentful Paint. That
 * one wants `fetchPriority="high"` and says so where it is written.
 */
export function contentImage(): LoadingProps {
  resolved ??= {
    loading: deferred() ? 'lazy' : 'eager',
    fetchPriority: 'low',
    decoding: 'async',
  };
  return resolved;
}
