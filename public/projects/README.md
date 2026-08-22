# Project media

Drop-in folder for per-project video. Everything here is optional — a
case study renders perfectly well without any of it.

There are two slots, and they answer different questions.

---

## 1. Hero film — `heroVideo`

The film that plays **behind the project title**, muted and looping,
in place of the still image. It sits under both hero scrims, so it
wants atmosphere and movement, not detail somebody has to read.

**Already wired for three projects.** Drop the file in and it appears
— there is no code to change:

```
public/projects/governai-studio/hero.mp4
public/projects/governai-research-atlas/hero.mp4
public/projects/content-recommendation-engine/hero.mp4
```

Until the file is there the hero shows the cover image, exactly as it
does today, and nothing errors.

To add a hero film to a **different** project, put `hero.mp4` in that
project's folder and add one line to its entry in
`src/lib/projects.ts`:

```ts
heroVideo: { src: '/projects/netra/hero.mp4' },
```

An optional `poster` overrides the still shown before playback starts;
leave it out and the project's cover image is used.

### What makes a good hero film

- **10–25 seconds, looping cleanly.** It repeats forever, so the last
  frame should sit comfortably next to the first.
- **No audio needed.** It starts muted — browsers block anything else
  — and most visitors never unmute. There are pause and sound controls
  in the bottom-right corner, so audio is fine to include, just don't
  depend on it.
- **Nothing important in the lower-left.** The title, lede and buttons
  sit over that area, and there is a dark gradient across the bottom
  third.
- **Keep it under ~8 MB.** It loads with the page.
- **1920×1080 or wider.** It is cover-cropped to fill the hero, so
  anything tall gets cut on the sides.

---

## 2. Walkthrough — `video`

A full run-through further down the page: real controls, sound on,
played only when someone presses play. Nothing loads until they do
(`preload="none"`), so an unwatched walkthrough costs a visitor
nothing.

Not enabled anywhere yet. To turn it on:

```
public/projects/saturdays/demo.mp4
public/projects/saturdays/poster.webp
```

```ts
video: {
  src: '/projects/saturdays/demo.mp4',
  poster: '/projects/saturdays/poster.webp',
  caption: 'Menu discovery through to checkout, one pass.',
},
```

The section mounts itself. Length is up to you here — this one is
watched deliberately.

---

## Slugs

| Project | Folder |
| --- | --- |
| Saturdays | `saturdays` |
| DineGuru | `dineguru` |
| GovernAI Research Atlas | `governai-research-atlas` ← hero film wired |
| GovernAI Studio | `governai-studio` ← hero film wired |
| Content Recommendation Engine | `content-recommendation-engine` ← hero film wired |
| AI & IoT Rockfall Prediction | `rockfall-prediction` |
| Netra | `netra` |
| AlgoVerse | `algoverse` |
| IoT Smart Home Automation | `smart-home-automation` |
| Adaptive Traffic Light Controller | `adaptive-traffic-controller` |

## Format

**MP4 (H.264 + AAC)** for both slots — it plays everywhere, including
iOS. WebM will silently fail for some Safari visitors, so if you have
one, convert it:

```
ffmpeg -i in.webm -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -c:a aac hero.mp4
```

`-pix_fmt yuv420p` matters: without it Safari and QuickTime refuse to
decode the file even though Chrome plays it fine.

## Reduced motion

Visitors who ask their system for reduced motion never get the hero
film — they see the still. That is deliberate; don't remove it.
