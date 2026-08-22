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
      fontFamily: {
        sans:    ['PP Neue Montreal Book', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Tr 3 A', 'PP Neue Montreal', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        /* Capability wall only. Read off the old portfolio's own wall,
           which sets it in `Inter, ui-sans-serif, system-ui` at 900 —
           this is that stack, unchanged. Inter is already loaded at
           every weight in index.html. */
        wall:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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
