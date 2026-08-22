import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

import { IMAGES } from '../lib/image-fallbacks.generated';

/* ─────────────────────────────────────────────────────────────────
   One image, two encodings, four sizes.

   ── The fallback ──────────────────────────────────────────────────
   Every photograph and screenshot on the site is a WebP. WebP has
   shipped in every evergreen browser since Safari 14 (September 2020),
   so this is not about the mainstream — it is about the tail that
   would otherwise get an empty box: Safari 13 and earlier, IE11, old
   Android WebViews.

   The <source> offers the WebP with an explicit type; a browser that
   understands `image/webp` takes it and never looks at the <img>. One
   that does not skips the source it cannot decode and loads the JPEG —
   or PNG, where the image has an alpha channel — from the <img> src.
   Exactly one file is fetched either way. No double download, no
   script involved.

   ── The srcset, which is the part that matters on a phone ─────────
   A decoded image costs width x height x 4 bytes of memory whatever
   the file weighed on the wire. Measured on the home page at 390px
   before this existed: 27 images, 133.5MB of decoded bitmaps, 19 of
   them decoded far larger than the box they were painted into — a
   2048px master rendered into a 780px slot, which is 9.4MB of RAM
   where 1.4MB would have done.

   On a phone with 2-3GB shared between the OS and the browser, that is
   what produces memory pressure, GC pauses, and eventually the tab
   being evicted and reloaded from scratch. It is the single largest
   cause of a page feeling slow on old hardware, and none of it is
   JavaScript — measured across a full-page scroll at 6x CPU
   throttling, this site runs zero long tasks.

   So each image ships a ladder of renditions and the browser picks one
   that fits. `sizes` is what makes that choice correct: without it a
   browser assumes the image spans the viewport and reaches for the
   largest rung, which is the behaviour being fixed. Pass the width the
   image actually occupies. The default is `100vw`, which is safe —
   never too small, only wasteful — so a call site that has not been
   given a real value is no worse off than before.

   ── Why the wrapper is display:contents ───────────────────────────
   <picture> is a real element with a box of its own (`display: inline`
   by default). Dropping one around an existing <img> changes the
   layout tree, and these images sit in layouts that care: some are
   `absolute inset-0` inside a positioned parent, some `h-full w-full`
   inside a flex or grid cell, where an inline wrapper becomes the flex
   item and `h-full` starts resolving against `auto`. Several frames
   would collapse.

   `display: contents` removes the wrapper's box from the layout tree
   while keeping its children, so the <img> lands in exactly the
   position in the box tree it occupied before — same containing block,
   same flex or grid item, same percentage resolution. It costs nothing
   in the accessibility tree either: <picture> carries no semantics of
   its own, and the <img> keeps its role and alt.

   An unrecognised src — an SVG plate, an external URL — gets a plain
   <img>. Falling back to the original behaviour is always correct: a
   missing rendition should never cost a browser the image it can
   already display.

   `alt` is required rather than optional, so passing nothing is not
   something that can happen by accident — but requiring it is not the
   same as getting it right, and for a while almost every call site
   answered `""`. An SEO crawl put a number on it: 39 of the 40 images
   on the home page had an empty alt, including the hero portrait,
   every project cover and every certificate scan. Those are content,
   not decoration, and an empty alt tells a screen reader and an image
   crawler alike that there is nothing there.

   What is left empty now is empty on purpose, and each one sits inside
   something already marked `aria-hidden`: the carousel's mirrored side
   panels (a reflection of the photograph beside them), its peeked
   neighbour slides, and the contact avatars. An image that assistive
   technology is told to ignore should not also carry a description.
   ───────────────────────────────────────────────────────────────── */

/** Everything known about one image, or null if it is not in the set. */
export function imageSet(src: string | undefined) {
  return src ? (IMAGES[src] ?? null) : null;
}

type Extra = {
  src: string;
  alt: string;
  /**
   * The width the image actually occupies, as a CSS `sizes` value —
   * e.g. `(min-width: 1024px) 50vw, 100vw`. Without it the browser
   * assumes the image is full-viewport and picks the largest
   * rendition, which is the whole problem this exists to solve.
   */
  sizes?: string;
};

type PictureProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'alt'> & Extra;

/* Refs are forwarded to the <img>, never to the <picture>. The
   carousel hands one in to read `naturalWidth` off a frame the moment
   it has decoded, and a ref that stopped at the wrapper would hand it
   an element with no intrinsic size to measure. */
export const Picture = React.forwardRef<HTMLImageElement, PictureProps>(
  function Picture({ src, alt, sizes = '100vw', ...rest }, ref) {
    const set = imageSet(src);
    if (!set) return <img ref={ref} src={src} alt={alt} {...rest} />;

    return (
      <picture className="contents">
        <source type="image/webp" srcSet={set.webp} sizes={sizes} />
        <img ref={ref} src={set.fallback} alt={alt} {...rest} />
      </picture>
    );
  }
);

/* The same thing where the image itself is animated — a scroll-linked
   scale on the deck covers, a shared drift on the project hero. The
   motion component has to be the <img>, not the wrapper, or the
   transform would apply to a box that display:contents has removed. */
type MotionPictureProps = Omit<HTMLMotionProps<'img'>, 'alt'> & Extra;

export const MotionPicture = React.forwardRef<HTMLImageElement, MotionPictureProps>(
  function MotionPicture({ src, alt, sizes = '100vw', ...rest }, ref) {
    const set = imageSet(src);
    if (!set) return <motion.img ref={ref} src={src} alt={alt} {...rest} />;

    return (
      <picture className="contents">
        <source type="image/webp" srcSet={set.webp} sizes={sizes} />
        <motion.img
          ref={ref}
          src={set.fallback}
          alt={alt}
          {...rest}
        />
      </picture>
    );
  }
);
