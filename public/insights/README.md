# Insight slides

Two kinds of file live here.

**Photographs** — `<slug>.webp`, twelve of them, cropped from the
originals in `images/` by `scripts/crop-insight-photos.mjs`. That
script is the record of how each one is framed and why; change a crop
there and re-run it rather than editing a file by hand.

**Placeholder plates** — `<slug>.svg`, generated:

```
node scripts/generate-insight-plates.mjs
```

Each plate carries a "PHOTOGRAPH TO FOLLOW" marker on purpose. The
milestones in this section are real — they come off the resume — but
a stock photo of somebody else's conference captioned "National
Entrepreneurship Challenge, Mumbai" would be claiming to document an
event it does not document. An entry uses its plate until a real
photograph exists. None currently does — every entry has a real
photograph — so no `.svg` is kept on disk; re-run the generator if an
entry ever needs one.

## Dropping a photograph in

1. Put the original in `images/`.
2. Add it to `PHOTOS` in `scripts/crop-insight-photos.mjs` with a crop
   rectangle and a line saying what the crop protects and what it
   removes, then run the script.
3. Set `photo: true` on that entry in `src/lib/insights.ts` and delete
   the now-unused `.svg`.

**On framing.** The card is a fixed box — 0.86 on a phone, 1.46 on a
desktop — and each photograph is fitted into it one of two ways, set
by `fill` on the entry in `src/lib/insights.ts`:

- **contained** (`fill: false`, and every slide on a phone): the whole
  frame, never cropped by the browser, hung from the top. Where it
  falls short, the card fills only the side that is actually short — a
  narrower picture gets a mirrored, defocused band down each side; a
  shorter one leaves a strip at the bottom, which is where the caption
  sits anyway. There is no blurred wash behind the whole card.
- **filled** (`fill: true`, above 768px only): the frame scaled until
  it covers the card, the excess taken off the bottom. No mirrors, no
  letterbox, and something is always cut — so it is set per entry
  against a measured table of what each one would lose, which is in
  the doc comment on `fill`. Six of the twelve qualify; the rest would
  be cut into their own subject and stay contained.

Filling is deliberately not derived from the ratio at runtime. The
question a ratio cannot answer is not how much comes off, it is what:
15% of grass and 15% of somebody's feet are the same number and not
the same decision.

So the crop is the art direction, and it has three rules:

1. **Every face whole.** Never cut a head or a standing figure at the
   knee.

   1b. **Caption a photograph by what is in it.** Nine slides have been
   mis-identified across two passes, every one of them placed by its
   position in `images/` rather than by its content. Open the file
   before writing a word of the entry, and where the picture shows
   something the written record cannot confirm, write what the picture
   shows.
2. **Subject high in the frame.** The caption's scrim washes the
   bottom of the card, so compose with ground, floor or wall down
   there — not people.
3. **Remove dead space, stay at or above ~0.9.** Empty sky and road
   are what make a picture look small in the card. Below 0.9 it
   becomes a strip down the middle of a desktop card.

There is no single target ratio to hit — the card is 0.86 on a phone
and 1.46 on a desktop. The fill exists so the crop never has to lie
about the subject to fit either one.

## Slugs, in carousel order

| # | slug | milestone | photo |
|---|------|-----------|-------|
| 01 | `nec-iit-bombay` | National Entrepreneurship Challenge | yes |
| 02 | `nec-visionary-ventures` | Visionary Ventures, the team | yes |
| 03 | `devjams` | DevJams '24, Vellore | yes |
| 04 | `iit-ropar-major` | An AI major, read in parallel, Rupnagar | yes |
| 05 | `startup-summit` | Bharat's leading startup summit, Surat | yes |
| 06 | `summit-floor` | The calibre of the room, Surat | yes |
| 07 | `first-internship` | The first internship, signed off | yes |
| 08 | `electroutsav` | Adaptive traffic control, in silicon | yes |
| 09 | `submissions-closed` | The day the submissions went in, Vellore | yes |
| 10 | `smart-india-hack` | Smart India Hackathon 2025 | yes |
| 11 | `iit-ropar-convocation` | Convocation day at IIT Ropar, Rupnagar | yes |
| 12 | `iit-ropar-complete` | One with the grandmaster of computer science, Rupnagar | yes |

The slug is a URL — each of these opens at `/insights/<slug>` — so
renaming one changes a public address. Rename only when the entry's
subject has actually changed, which is the reason four of them were
renamed in the audit that re-identified their photographs.

## Adding or removing a slide

Edit `src/lib/insights.ts`. The dot rail, the counter, the wrap-around
and the autoplay are all derived from the array length, so nothing else
needs changing. If you add an entry, add its slug to
`scripts/generate-insight-plates.mjs` and re-run it, or drop the real
photograph in by hand — an entry with no file renders an empty card.

`location` is optional and the chip is omitted when it is absent. Only
fill it in where the place is actually on record.
