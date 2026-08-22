import { asset } from '../lib/asset';
import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { CONTACT_FORM, PROFILE } from '../lib/content';
import { EASE_OUT, viewportOnce } from '../lib/motion';
import _avatar from '../assets/hero-no-bg.webp';

import { Picture } from './Picture';

/* Vite resolved these imports to URL strings; Next resolves them to
   StaticImageData objects. `asset()` is the single boundary where that
   difference is settled — see src/lib/asset.ts for why it is a function
   and not a bundler setting. Everything below this block is a string,
   exactly as it was before the port. */
const avatar = asset(_avatar);

/* ─────────────────────────────────────────────────────────────────
   Contact.

   The address, the copy button, the mailto buttons and the résumé
   download are gone. The form is the only route in, by request — so
   the form has to be good enough to carry the whole section.

   Two halves:

     · Left is the statement, plus a short exchange of chat bubbles
       that is not decoration. It tracks the form: idle before you
       start, it answers when you begin typing, it acknowledges the
       send, and it says so when a send fails. The section reads as a
       conversation opening rather than a page you fill in.
     · Right is the form itself, posted to FormSubmit over AJAX so a
       submission never leaves the page.

   Validation is done here rather than left to the browser: native
   bubbles cannot be styled, vanish on scroll, and only ever report one
   field at a time. Every message is wired to its input with
   `aria-describedby` and `aria-invalid`, and focus moves to the first
   field that failed.

   A honeypot (`_honey`) catches the bots that fill every field they
   find. It is hidden with position, not `display:none` — plenty of
   scrapers skip fields that are display-none, which defeats the point.
   ───────────────────────────────────────────────────────────────── */

const INTENTS = [
  'A full-time role',
  'A contract engagement',
  'Collaboration on something',
  'Something else',
] as const;

type Phase = 'idle' | 'engaged' | 'sending' | 'sent' | 'error';

interface Fields {
  name: string;
  email: string;
  phone: string;
  company: string;
  intent: string;
  message: string;
}

const EMPTY: Fields = {
  name: '',
  email: '',
  phone: '',
  company: '',
  intent: INTENTS[0],
  message: '',
};

/** The fields that must be filled. Drives the marker, the `required`
    attribute and the legend from one list, so a field cannot look
    optional and validate as mandatory. */
const REQUIRED = ['name', 'email', 'message'] as const;
const isRequired = (k: keyof Fields) => (REQUIRED as readonly string[]).includes(k);

/* Deliberately loose. A regex that tries to be RFC-correct rejects
   real addresses; this only catches the obvious typo and lets the
   confirmation email do the actual verifying. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Same principle, more so, because the field is optional: this has to
   catch a number that could not be dialled, not prove that one can.

   Length is counted in digits rather than characters — "+91 98765
   43210" and "+919876543210" are the same number and both have to
   pass. E.164 caps an international number at 15 digits, and no
   national number runs shorter than about 7. The character class
   allows the separators people actually type; anything outside it is a
   typo, not a formatting preference. */
const PHONE_RE = /^\+?[\d\s().-]+$/;
const digitCount = (v: string) => (v.match(/\d/g) || []).length;

function validate(f: Fields) {
  const errors: Partial<Record<keyof Fields, string>> = {};
  if (!f.name.trim()) errors.name = 'Please tell me who you are.';
  if (!f.email.trim()) errors.email = 'I need an address to reply to.';
  else if (!EMAIL_RE.test(f.email.trim())) errors.email = 'That address looks incomplete.';

  /* Blank is a pass — the whole point of the field being optional.
     Only a number that has been typed and is wrong gets stopped. */
  const phone = f.phone.trim();
  if (phone) {
    const digits = digitCount(phone);
    if (!PHONE_RE.test(phone) || digits < 7 || digits > 15)
      errors.phone = 'That number looks off — or leave it blank.';
  }

  if (f.message.trim().length < 12) errors.message = 'A sentence or two, so I can reply usefully.';
  return errors;
}

/* ── Chat ────────────────────────────────────────────────────────── */

/* What each phase *adds* to the thread, not what the thread should
   contain. The exchange accumulates the way a real one does — the
   opening line is still there when the reply lands — instead of the
   panel swapping its whole contents on every state change.

   `sending` adds nothing on purpose: it only raises the typing bubble,
   which is exactly what the other end of a chat looks like while it is
   composing.

   The section's statement is the second thing typed, not a heading
   sitting above all this. It used to be set as a static display line
   with the conversation happening underneath it, which meant the
   sentence had already been read before the chat got round to saying
   it. Delivered as a message it lands instead of announcing. */
interface Line {
  /** Stable across renders and phases; the thread dedupes on it. */
  id: string;
  text: string;
  /** The one line that carries display weight. */
  statement?: boolean;
}

const ADDS: Record<Phase, Line[]> = {
  idle: [
    { id: 'ask', text: 'Have something in mind?' },
    { id: 'statement', text: 'Let’s build something that matters.', statement: true },
  ],
  engaged: [{ id: 'engaged', text: 'Tell me what you’re building.' }],
  sending: [],
  sent: [
    { id: 'got', text: 'Got it — thank you.' },
    { id: 'reply', text: 'I’ll read it properly and come back to you.' },
  ],
  error: [{ id: 'failed', text: 'That didn’t go through. Mind trying once more?' }],
};

/** The full statement, kept in one place so the heading below and the
    bubble above can never drift apart. */
const STATEMENT = ADDS.idle[1].text;

/** How long the dots run before the message they belong to lands. */
const TYPE_MS = 1150;
/** The statement is longer and lands harder; it earns a beat more. */
const TYPE_STATEMENT_MS = 1750;
/** Beat between a message landing and the next one starting to type. */
const GAP_MS = 460;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Bubble column layout — shared by the live thread and its sizer, so
    the reserved height cannot drift from the real one. */
const STACK = 'flex min-w-0 flex-col items-start gap-3';

/* The statement bubble is the section's headline in chat form: display
   weight, a tighter measure, and a hairline of accent on the leading
   edge so it reads as the one that matters without leaving the
   conversation.

   `min(100%, 13ch)` rather than a bare `ch` cap — the ch unit scales
   with the display size but the padding does not, so at 1024 a
   ch-only cap put the bubble wider than the column it sits in. The
   100% term is the hard stop. */
const bubbleClass = (statement?: boolean) =>
  statement
    ? 'w-fit max-w-[min(100%,13ch)] rounded-[28px] rounded-tl-md border-l-2 border-accent bg-ink-raised px-6 py-5 font-display text-display-md font-bold leading-[1.02] tracking-[-0.02em] text-bone-raised sm:px-7 sm:py-6'
    : 'max-w-[34ch] rounded-[20px] rounded-tl-md bg-ink-raised px-5 py-3 text-sm leading-relaxed text-bone-raised';

function Dots({ reduced }: { reduced: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-accent"
          animate={reduced ? { opacity: 0.6 } : { y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
          transition={
            reduced
              ? undefined
              : { duration: 0.95, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }
          }
        />
      ))}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   The thread.

   Messages do not appear and then sprout a typing indicator beneath
   them — that reads as "here is the text, and also someone is typing".
   A chat client does the reverse: dots first, then the dots are
   *replaced* by the message they were composing. That is the whole
   effect, and it is why `typing` and the message it precedes are never
   on screen at the same time.

   Nothing starts until the block is actually in view. Without that the
   entire exchange plays out while the visitor is still six sections up
   and they arrive to a finished conversation with no typing at all.

   The whole thread is `aria-hidden`. That is deliberate, not an
   oversight: the statement it delivers is also rendered as a real,
   always-present `<h2>` beside it, so the section keeps a stable
   heading for the document outline and for a crawler that never runs
   the timers — and announcing both would read the same sentence
   twice. Form status is carried by the success panel and the error
   `role="alert"`, which is where a screen reader should hear it.
   ───────────────────────────────────────────────────────────────── */
function Conversation({ phase, reduced }: { phase: Phase; reduced: boolean }) {
  const [thread, setThread] = useState<Line[]>([]);
  const [typing, setTyping] = useState(false);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    let cancelled = false;

    if (phase === 'sending') {
      setTyping(true);
      return () => {
        cancelled = true;
        setTyping(false);
      };
    }

    (async () => {
      for (const line of ADDS[phase]) {
        if (cancelled) return;
        setTyping(true);
        await wait(reduced ? 0 : line.statement ? TYPE_STATEMENT_MS : TYPE_MS);
        if (cancelled) return;
        /* Dots down and message up in the same commit, so the bubble
           swaps in place rather than the row collapsing and reflowing. */
        setTyping(false);
        setThread((t) => (t.some((l) => l.id === line.id) ? t : [...t, line]));
        await wait(reduced ? 0 : GAP_MS);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, inView, reduced]);

  return (
    <div ref={rootRef} aria-hidden="true" className="flex gap-4 sm:gap-5">
      <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-ink-raised sm:h-12 sm:w-12">
        <Picture
          sizes="48px"
          src={avatar}
          alt=""
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-top"
        />
      </span>

      {/* Sizer and thread share one grid cell.

          The opening exchange types itself in with nobody touching
          anything, and each bubble that lands makes the column taller.
          Below `lg` this section is a single stack, so that growth
          pushed the form, the footer and everything under them down the
          page while the visitor was reading — layout shift arriving
          entirely on a timer. The measured cost was 55px, which was
          enough to move a control out from under a pointer.

          An invisible copy of the settled two-bubble state holds the
          height from first paint, so the automatic play shifts nothing.
          Growth past that only happens in response to the visitor's own
          typing or send, where movement is expected. */}
      <div className="grid min-w-0 flex-1">
        <div className={`${STACK} invisible col-start-1 row-start-1`}>
          {ADDS.idle.map((line) => (
            <p key={line.id} className={bubbleClass(line.statement)}>
              {line.text}
            </p>
          ))}
        </div>

        <div className={`${STACK} col-start-1 row-start-1`}>
          <AnimatePresence initial={false}>
            {thread.map((line) => (
              <motion.p
                key={line.id}
                layout
                data-bubble={line.statement ? 'statement' : 'line'}
                initial={{ opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 320, damping: 26, mass: 0.7 }
                }
                className={bubbleClass(line.statement)}
              >
                {line.text}
              </motion.p>
            ))}

            {typing && (
              <motion.span
                key="typing"
                layout
                data-typing="true"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.14 } }}
                transition={reduced ? { duration: 0 } : { duration: 0.26, ease: EASE_OUT }}
                className="rounded-full rounded-tl-md bg-ink-raised px-4 py-3"
              >
                <Dots reduced={reduced} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ── Field shells ────────────────────────────────────────────────── */

const FIELD =
  'w-full rounded-2xl border bg-ink-sunk px-4 py-3.5 text-sm text-bone-raised placeholder:text-bone-raised/35 transition-colors duration-200 focus:outline-none';

function shell(bad: boolean) {
  return `${FIELD} ${bad ? 'border-red-400/70' : 'border-white/12 hover:border-white/25 focus:border-accent'}`;
}

/* Measured, not picked. On `ink-raised` at this size:
     bone-raised/35 → 3.01:1   fails 4.5:1
     bone-raised/45 → 4.17:1   fails
     bone-raised/55 → 5.63:1   passes
     bone-raised/65 → 7.41:1   passes
   The field name takes /65 and the "— optional" tail /55, so the two
   still read as name-then-modifier while both clear the floor. The
   tail was /35 before, which is where this was caught. */
const LABEL = 'mb-2 block font-mono text-meta-sm uppercase text-bone-raised/65';

/* ── Which fields are compulsory ──────────────────────────────────
   Both markers, deliberately. Marking only the required ones leaves a
   reader working out that the unmarked fields are therefore optional;
   marking only the optional ones is the convention when most fields
   are required, which is true here but only three-to-two. Saying both
   costs one glyph and removes the inference entirely.

   The asterisk is `aria-hidden` and carries no meaning on its own —
   `required` on the input is what a screen reader announces, and the
   legend below the form spells the convention out for everyone else.
   A field marked here and not listed in REQUIRED is impossible: both
   read from the same array. */
function FieldLabel({
  htmlFor,
  field,
  children,
}: {
  htmlFor: string;
  field: keyof Fields;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={LABEL}>
      {children}
      {isRequired(field) ? (
        <span aria-hidden="true" className="ml-1 text-accent">
          *
        </span>
      ) : (
        <span className="text-bone-raised/55"> — optional</span>
      )}
    </label>
  );
}

/* ── Section ─────────────────────────────────────────────────────── */

export function ContactTakeover() {
  const reduced = useReducedMotion() ?? false;
  const uid = useId();

  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [phase, setPhase] = useState<Phase>('idle');
  /* Bumped by "Send another". Remounting the thread is the reset — the
     alternative is teaching it to distinguish a genuine return to idle
     from the one it starts in, for no gain. */
  const [round, setRound] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (phase === 'idle' || phase === 'error') setPhase('engaged');
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    /* Honeypot. A human never sees this field, so anything in it is a
       bot — answer as though it succeeded and send nothing. */
    const honey = (formRef.current?.elements.namedItem('_honey') as HTMLInputElement | null)?.value;
    if (honey) {
      setPhase('sent');
      return;
    }

    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setPhase('sending');
    try {
      const res = await fetch(CONTACT_FORM.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: fields.name,
          email: fields.email,
          /* An em dash rather than an omitted key: `_template: 'table'`
             renders whatever it is given, and a row that is simply
             missing reads as a delivery fault rather than as a field
             the sender chose to leave blank. */
          phone: fields.phone || '—',
          company: fields.company || '—',
          enquiry: fields.intent,
          message: fields.message,
          _subject: CONTACT_FORM.subject,
          _template: 'table',
          _captcha: 'false',
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setPhase('sent');
      setFields(EMPTY);
    } catch {
      setPhase('error');
    }
  };

  const sending = phase === 'sending';

  return (
    <section
      id="contact"
      className="relative z-10 bg-ink py-22 text-bone-raised sm:py-30"
      style={{ scrollMarginTop: 'var(--nav-h)' }}
    >
      <div className="mx-auto w-full max-w-shell px-gutter">
        <div className="flex items-start justify-between gap-6 border-t border-white/12 pt-6">
          <p className="eyebrow text-bone-raised/55">Contact</p>
          <p className="text-right font-mono text-meta-sm uppercase text-bone-raised/45">
            Available for work
            <br />
            {PROFILE.location}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-20">
          {/* ── Statement ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7, ease: EASE_OUT }}
          >
            {/* The heading is here, and only here. It is not rendered
                visually because the conversation delivers the same
                sentence — but it exists in the markup unconditionally,
                so the outline is stable, a crawler that never runs the
                timers still finds it, and the sentence is announced
                once rather than twice. */}
            <h2 className="sr-only">{STATEMENT}</h2>

            <Conversation key={round} phase={phase} reduced={reduced} />

            <p className="mt-12 max-w-xl border-t border-white/12 pt-8 text-lede text-bone-raised/65">
              Open to full-time, contract, and collaborative work across full stack and AI/ML
              systems engineering. I reply to everything.
            </p>
          </motion.div>

          {/* ── Form ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT }}
            className="rounded-panel border border-white/12 bg-ink-raised p-6 sm:p-9"
          >
            <AnimatePresence mode="wait" initial={false}>
              {phase === 'sent' ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.4, ease: EASE_OUT }}
                  className="flex min-h-[420px] flex-col items-start justify-center"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-accent/40 text-accent">
                    <Check className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 font-display text-display-sm font-bold">Message sent.</h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-bone-raised/65">
                    It is in my inbox. Expect a reply within a day or so — sooner if it is
                    something time-bound.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPhase('idle');
                      setRound((n) => n + 1);
                    }}
                    className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-mono text-meta-sm font-bold uppercase text-bone-raised transition-colors duration-200 hover:border-accent hover:text-accent"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Send another
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  ref={formRef}
                  onSubmit={onSubmit}
                  noValidate
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.3 }}
                  className="flex flex-col gap-5"
                >
                  {/* Honeypot: off-screen, not display:none. */}
                  <input
                    type="text"
                    name="_honey"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute left-[-9999px] h-px w-px opacity-0"
                  />

                  {/* Row one is what a reply needs: who, and where to
                      send it. Row two is what makes the reply better
                      but never blocks it. Grouping them that way means
                      the two markers fall into two clean columns
                      instead of alternating down the form. */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor={`${uid}-name`} field="name">
                        Name
                      </FieldLabel>
                      <input
                        id={`${uid}-name`}
                        name="name"
                        required
                        value={fields.name}
                        onChange={set('name')}
                        autoComplete="name"
                        placeholder="Your name"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? `${uid}-name-err` : undefined}
                        className={shell(!!errors.name)}
                      />
                      {errors.name && (
                        <p id={`${uid}-name-err`} className="mt-2 text-xs text-red-300">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <FieldLabel htmlFor={`${uid}-email`} field="email">
                        Email
                      </FieldLabel>
                      <input
                        id={`${uid}-email`}
                        name="email"
                        type="email"
                        required
                        value={fields.email}
                        onChange={set('email')}
                        autoComplete="email"
                        placeholder="you@company.com"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? `${uid}-email-err` : undefined}
                        className={shell(!!errors.email)}
                      />
                      {errors.email && (
                        <p id={`${uid}-email-err`} className="mt-2 text-xs text-red-300">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor={`${uid}-phone`} field="phone">
                        Phone
                      </FieldLabel>
                      {/* `type="tel"` and `inputMode="tel"` between them
                          raise the dialling keypad on a phone and stop
                          desktop browsers from treating a leading "+"
                          or a space as invalid — which `type="number"`
                          would, along with silently eating leading
                          zeroes. */}
                      <input
                        id={`${uid}-phone`}
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        value={fields.phone}
                        onChange={set('phone')}
                        autoComplete="tel"
                        placeholder="+91 98765 43210"
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? `${uid}-phone-err` : undefined}
                        className={shell(!!errors.phone)}
                      />
                      {errors.phone && (
                        <p id={`${uid}-phone-err`} className="mt-2 text-xs text-red-300">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <FieldLabel htmlFor={`${uid}-company`} field="company">
                        Company
                      </FieldLabel>
                      <input
                        id={`${uid}-company`}
                        name="company"
                        value={fields.company}
                        onChange={set('company')}
                        autoComplete="organization"
                        placeholder="Where you're writing from"
                        className={shell(false)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`${uid}-intent`} className={LABEL}>
                      This is about
                    </label>
                    {/* `appearance-none` strips the native arrow so the
                        control can share the text fields' shell — which
                        left it looking exactly like an input you could
                        type into, with no sign it opened a list at all.
                        The chevron is what that stripped away, drawn
                        back on.

                        `pointer-events-none` matters: an icon painted
                        over the control would otherwise swallow clicks
                        on the one part of a dropdown people aim at.
                        `pr-12` keeps the longest option clear of it
                        rather than running underneath. */}
                    <div className="relative">
                      <select
                        id={`${uid}-intent`}
                        name="intent"
                        value={fields.intent}
                        onChange={set('intent')}
                        className={`${shell(false)} appearance-none pr-12`}
                      >
                        {INTENTS.map((option) => (
                          <option key={option} value={option} className="bg-ink-raised">
                            {option}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        aria-hidden="true"
                        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bone-raised/55"
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor={`${uid}-message`} field="message">
                      Message
                    </FieldLabel>
                    <textarea
                      id={`${uid}-message`}
                      name="message"
                      required
                      rows={5}
                      value={fields.message}
                      onChange={set('message')}
                      placeholder="What are you working on, and where do I fit?"
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? `${uid}-message-err` : undefined}
                      className={`${shell(!!errors.message)} resize-y`}
                    />
                    {errors.message && (
                      <p id={`${uid}-message-err`} className="mt-2 text-xs text-red-300">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Spells out the convention rather than leaving the
                      asterisk to be inferred. Placed after the fields,
                      where a reader who has just met one goes looking
                      for it. */}
                  <p className="font-mono text-[10px] leading-relaxed tracking-[0.14em] text-bone-raised/55">
                    <span aria-hidden="true" className="text-accent">
                      *
                    </span>{' '}
                    REQUIRED. I REPLY BY EMAIL — A NUMBER ONLY HELPS IF YOU WOULD RATHER I CALL.
                  </p>

                  {phase === 'error' && (
                    <p role="alert" className="text-xs leading-relaxed text-red-300">
                      The message didn't send. Check your connection and try again — or reach me
                      through LinkedIn below.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-4 font-mono text-meta-sm font-bold uppercase text-ink transition-colors duration-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Sending
                      </>
                    ) : (
                      <>
                        Send message
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* An "Elsewhere" rail closed this section, listing LinkedIn and
            GitHub — the same two links the footer lists about 200px
            further down, which is close enough that both are on screen
            together. Two identical offers of the same two accounts, one
            under the other, is what made the end of the page read as
            padding rather than as an ending.

            The footer's version stayed: it names the account under each
            link, and an index of everywhere else belongs in the outro
            rather than trailing the form. The failure message here still
            says "reach me through LinkedIn below" and still resolves —
            below is now the footer. */}
      </div>
    </section>
  );
}
