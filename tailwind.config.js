/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Surfaces ──────────────────────────────────────────────
           Two families only. Light sections alternate bone/bone-sunk,
           dark sections alternate ink/ink-raised. Nothing else. */
        bone: {
          DEFAULT: '#E8E4DA',   // primary light surface
          sunk:    '#DED9CC',   // alternating light surface
          raised:  '#F4F2EC',   // cards on light
        },
        ink: {
          DEFAULT: '#0B0B0C',   // primary dark surface
          raised:  '#141416',   // cards on dark
          sunk:    '#070708',   // wells / insets on dark
        },
        /* ── Accent ────────────────────────────────────────────────
           Micro-signals only: marker dots, hover underlines, focus
           rings, one CTA per screen. Never large text.
           `DEFAULT` is legal on ink only (6.9:1).
           `dim` is the only accent legal on bone (3.4:1, large text). */
        accent: {
          DEFAULT: '#C8FF00',
          dim:     '#5C7A00',
        },
      },
      /* ── Fluid type scale ──────────────────────────────────────
         Every display size is clamp()-driven so nothing overflows at
         360px and nothing looks undersized at 2560px. */
      fontSize: {
        'display-xl': ['clamp(2.75rem, 9vw, 8.5rem)',   { lineHeight: '0.92', letterSpacing: '-0.045em' }],
        'display-lg': ['clamp(2.25rem, 6.5vw, 5.5rem)', { lineHeight: '0.96', letterSpacing: '-0.04em' }],
        'display-md': ['clamp(1.75rem, 4.5vw, 3.5rem)', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        'display-sm': ['clamp(1.375rem, 2.6vw, 2rem)',  { lineHeight: '1.15', letterSpacing: '-0.025em' }],
        'lede':       ['clamp(1rem, 1.5vw, 1.25rem)',   { lineHeight: '1.55', letterSpacing: '-0.011em' }],
        'meta':       ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.14em' }],
        'meta-sm':    ['0.625rem',  { lineHeight: '1.4', letterSpacing: '0.16em' }],
      },
      /* ── Family names are quoted, and it is load-bearing ──────────
         The inner quotes are part of the emitted CSS value, not JS
         syntax. Without them Tailwind writes the family names bare and
         the minifier keeps them bare, which produced:

             .font-display { font-family: Tr 3 A, PP Neue Montreal, … }

         An unquoted font family is a sequence of CSS identifiers, and
         `3` is not a valid identifier — it starts with a digit. So
         `Tr 3 A` is not one family name there, it is three tokens, and
         the declaration is invalid. The W3C CSS validator reported it
         as "'3' is not a font-family value" and was right.

         Chrome parses it leniently and the face still applied, which
         is why it survived: the site looked correct. A stricter parser
         is entitled to drop the family — or the whole declaration —
         and fall through to PP Neue Montreal, silently changing the
         display face on some readers' machines and nobody's here.

         Any family whose name contains a space or a digit needs the
         quotes. The generic keywords at the end of each stack —
         sans-serif, monospace, system-ui, ui-monospace — must NOT be
         quoted: quoting turns a keyword into a family name and it
         stops working. */
      fontFamily: {
        sans:    ['"PP Neue Montreal Book"', '"Inter"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        /* ⚠ `Tr 3 A` is deliberately UNQUOTED, and it is the one entry
           here that is knowingly invalid CSS. Read this before
           "fixing" it — quoting it changes the typography of every
           heading on the site.

           Unquoted, a font family is a sequence of CSS identifiers,
           and `3` cannot be an identifier because it starts with a
           digit. So `Tr 3 A` is not one family name, it is three
           invalid tokens, and every conformant browser drops the entry
           and falls through to `PP Neue Montreal`. The W3C CSS
           validator reports it as "'3' is not a font-family value" and
           is correct.

           The consequence is that this face has **never rendered**,
           on any browser, for the life of the site. Every display
           heading you have ever looked at is the fallback. The face is
           still fetched from the Webflow CDN and then never used.

           Quoting it was tried, and the snapshot diff caught what it
           does: all 48 captures changed, because `Tr 3 A` is a Bold
           700 face and the fallback it replaces is visibly lighter.
           Headings go from light to heavy across the entire site. That
           is a design change, not a bug fix, so it is not being made
           here on a validator's say-so.

           Two ways to resolve it, both one line, both for the owner
           to choose:

             · Wanted  — quote it: '"Tr 3 A"'. The CSS becomes valid
                         and the intended display face finally
                         applies. Re-baseline the snapshots.
             · Not     — delete it from this stack. The CSS becomes
                         valid, nothing changes visually because it
                         was never applying, and the site stops
                         downloading a font it does not use.

           Doing nothing is the only option that keeps an invalid
           declaration, which is why this comment is this long. */
        display: ['Tr 3 A', '"PP Neue Montreal"', '"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', '"SFMono-Regular"', '"Menlo"', 'monospace'],
        /* Capability wall only. Read off the old portfolio's own wall,
           which sets it in `Inter, ui-sans-serif, system-ui` at 900 —
           this is that stack, unchanged. Inter is already loaded at
           every weight in index.html. */
        wall:    ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      /* Opacity stops the codebase actually uses. Tailwind's default
         scale has no 6/8/12, so `border-black/8` silently emitted no
         CSS — every hairline rule on the old site was invisible. */
      opacity: {
        4: '0.04', 6: '0.06', 8: '0.08', 12: '0.12', 15: '0.15',
        35: '0.35', 45: '0.45', 55: '0.55', 65: '0.65', 85: '0.85',
      },
      spacing: {
        18: '4.5rem', 22: '5.5rem', 30: '7.5rem', 38: '9.5rem',
        gutter: 'clamp(1.25rem, 5vw, 4rem)',
      },
      maxWidth: {
        shell: '84rem',
      },
      borderRadius: {
        card: '20px',
        panel: '28px',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        /* The same travel backwards. A separate keyframe rather than
           `animation-direction: reverse`, because `animate-*` sets the
           `animation` *shorthand* — any `[animation-direction:…]` or
           `[animation-duration:…]` utility alongside it is reset by
           that shorthand depending on which lands later in the sheet.
           Speed and direction therefore have to be baked into named
           animations, which is what these are. */
        'marquee-back': {
          '0%':   { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        /* Capability wall. ~7,100px of travel per cycle, so these are
           roughly 45 and 36 pixels a second — a drift, not a ticker. */
        'wall-a': 'marquee 160s linear infinite',
        'wall-b': 'marquee-back 200s linear infinite',
      },
    },
  },
  plugins: [],
}
