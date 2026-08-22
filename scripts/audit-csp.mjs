/* Does the site still work with its own Content-Security-Policy on?
 *
 * The policy lives in public/_headers, and until scripts/serve-dist.mjs
 * learned to apply it, nothing ever tested it: every audit ran against
 * a server that sent no CSP at all. A policy that has never been
 * exercised is a guess, and the failure mode is not subtle — a missing
 * source blocks the bundle and the site renders a blank page.
 *
 * So this loads every route with the real headers attached and fails on
 * any violation, using three independent signals because a CSP failure
 * shows up differently depending on what it blocked:
 *
 *   · `securitypolicyviolation` events, which name the directive and
 *     the blocked URI — the precise signal, when the page gets far
 *     enough to have a listener.
 *   · console messages, which is where Chromium reports a refusal that
 *     happened before any script could listen.
 *   · whether the page actually rendered, because the most complete way
 *     to fail a CSP is for nothing to run at all and no error to be
 *     attributed to anything.
 *
 * Run it against a server started with the export:
 *
 *     node scripts/serve-dist.mjs 5188 out
 *     node scripts/audit-csp.mjs
 */
import { chromium } from 'playwright-core';

const EXE = 'C:/Users/DK/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe';
const BASE = process.argv[2] || 'http://localhost:5188';

/* One of each kind of document, plus a path that has none. Every
   insight and every project renders from the same two components, so
   crawling all twenty-three would be twenty-three times the runtime to
   re-test the same policy. */
const ROUTES = ['/', '/projects/netra', '/insights/devjams', '/no-such-page'];

/* Third-party hosts the policy allows on purpose. A request to any of
   them is not a finding; a request to anything else is. */
const ALLOWED_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.prod.website-files.com',
  'www.googletagmanager.com',
  'google-analytics.com',
  'analytics.google.com',
  'g.doubleclick.net',
  'formsubmit.co',
];

const browser = await chromium.launch({ executablePath: EXE });
let failures = 0;

/* The policy as served — printed once, because the point of this audit
   is that what is tested is what ships. */
const probe = await fetch(BASE + '/');
const csp = probe.headers.get('content-security-policy');
if (!csp) {
  console.log('\nFAIL  no Content-Security-Policy header on /');
  console.log('      is the server running with public/_headers in the served directory?');
  failures++;
} else {
  console.log('\npolicy under test');
  for (const directive of csp.split(';')) {
    if (directive.trim()) console.log('  ' + directive.trim());
  }
}

for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const violations = [];
  const refusals = [];
  const offOrigin = new Set();

  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations.push({
        directive: e.effectiveDirective || e.violatedDirective,
        blocked: String(e.blockedURI).slice(0, 120),
        sample: String(e.sample || '').slice(0, 80),
      });
    });
  });

  page.on('console', (m) => {
    const t = m.text();
    if (/refused to|content security policy/i.test(t)) refusals.push(t.slice(0, 200));
  });

  page.on('request', (r) => {
    try {
      const host = new URL(r.url()).host;
      if (host !== new URL(BASE).host && !ALLOWED_HOSTS.some((h) => host.endsWith(h))) {
        offOrigin.add(host);
      }
    } catch {
      /* data: and blob: URLs have no host and are governed separately. */
    }
  });

  await page.goto(BASE + route, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2500);

  violations.push(...(await page.evaluate(() => window.__cspViolations ?? [])));

  /* Did the application actually render? A blocked bundle leaves the
     body at roughly viewport height with none of the site's landmarks
     in it, and reports nothing anywhere else. */
  const rendered = await page.evaluate(() => ({
    height: document.body.scrollHeight,
    nav: !!document.querySelector('header, nav'),
    footer: !!document.getElementById('site-footer'),
    text: document.body.innerText.trim().length,
  }));

  const dead = rendered.height < 1200 || !rendered.footer || rendered.text < 400;
  const bad = violations.length || refusals.length || dead;
  if (bad) failures++;

  console.log(`\n${bad ? 'FAIL' : 'ok  '}  ${route}`);
  console.log(
    `        rendered ${rendered.height}px, ${rendered.text} chars of text, ` +
      `footer ${rendered.footer ? 'present' : 'MISSING'}`,
  );
  for (const v of violations.slice(0, 5)) {
    console.log(`        violation ${v.directive} blocked ${v.blocked} ${v.sample}`);
  }
  for (const r of refusals.slice(0, 3)) console.log(`        console  ${r}`);
  if (offOrigin.size) {
    console.log(`        note: off-origin hosts requested: ${[...offOrigin].join(', ')}`);
  }

  await ctx.close();
}

await browser.close();
console.log(
  failures
    ? `\n${failures} problem(s): the site does not run clean under its own policy\n`
    : '\nevery route runs clean under the policy it ships with\n',
);
process.exit(failures ? 1 : 0);
