# Certificate artwork

Twelve real documents, one per entry in `src/lib/certifications.ts`,
named `<slug>.webp`. They are not the raw scans: every one has been put
through

```
node scripts/normalise-certificates.mjs
```

which is what makes the wall look like a wall rather than a pile.

## Why the files are normalised

The scans arrive as whatever the issuer and the scanner produced —
measured across this set, ratios from 0.75 to 1.55, and far more
damaging, wildly different amounts of white baked in around the
document. A LinkedIn certificate is a small card floating in a page of
margin; an Unstop one bleeds to the edge; the NEC one is full-bleed
artwork with no margin at all.

The grid renders all of them into the same 1.414 frame, so those two
differences compound: no two documents come out the same size and none
of them line up. The frames were always identical — the documents
inside them were not.

The script fixes it at the file, so the markup can stay simple:

1. **Trim the surrounding white**, so what is left is the document.
2. **Fit that into a fixed 1414 × 1000 canvas** with one margin — 4.5%
   of the frame height, the same on every certificate — centred.
3. **Write it back at the frame's exact ratio**, so `object-contain`
   has nothing to letterbox and nothing to crop.

Re-running is safe: an already-trimmed, already-padded file trims to
the same bounds and pads to the same box. But each run is another webp
encode, so don't run it in a loop.

## Dropping in a new certificate

1. Save the scan here as `<slug>.webp`, matching the `slug` in
   `src/lib/certifications.ts`. Any reasonable size will do — the
   script rescales — but give it at least ~1400px on the long edge so
   the lightbox has something to show.
2. Add the slug to `SLUGS` in `scripts/normalise-certificates.mjs` and
   run it.
3. Fill in `title`, `issuer`, `date`, `credentialId`, `summary`,
   `skills` and `track` in `src/lib/certifications.ts`, transcribed
   from the document rather than remembered. `credentialId` is
   optional — several of these print no number, and the lightbox omits
   the row rather than showing a blank one.

## Adding or removing an entry

Everything derives from the array: the filter chips, their counts, the
lightbox counter and the section's own "N credentials across M tracks".
Nothing else needs editing.

An entry with no matching file renders an empty white frame — no
crash, but no document either.
