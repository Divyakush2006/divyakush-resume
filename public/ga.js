/* Google Analytics 4 — the bootstrap half of the standard gtag snippet.
 *
 * Google ships this as an inline <script> next to the loader. It is the
 * same code; it lives in a file for one reason, which is the Content-
 * Security-Policy in public/_headers.
 *
 * That policy carries `script-src 'self' https://www.googletagmanager.com`
 * and no 'unsafe-inline'. Pasting the snippet into the document would
 * force one of three things: 'unsafe-inline', which re-opens the single
 * largest hole a CSP closes and would apply to every script on the site,
 * not just this one; a sha256 hash in the header, which has to be
 * recomputed by hand the moment a character of the snippet changes; or a
 * nonce, which needs a server to generate one per response and this site
 * is static files on a CDN.
 *
 * A same-origin file needs none of them. `'self'` already covers it, the
 * bytes can change freely, and the header never has to know.
 *
 * Load order does not matter. The loader at googletagmanager.com is
 * async, and the snippet is built so either half can arrive first: this
 * file creates the queue and pushes into it, and the tag drains the queue
 * whenever it finishes loading.
 */
/* ── Google Signals is off, and it is off here rather than in CSP ──
 *
 * With Signals on, GA4 fires a remarketing pixel at
 * /ads/ga-audiences on the visitor's *country* Google domain —
 * www.google.co.in from India, www.google.de from Germany. The
 * Content-Security-Policy in public/_headers blocked it and logged a
 * violation on every page view.
 *
 * That could not be fixed in the policy. CSP has no wildcard for a
 * top-level domain, so permitting the pixel means listing roughly 190
 * ccTLDs in a header that ships on every request — to allow a tracker.
 *
 * So it is switched off at the source instead, which is the honest
 * place for it: the request is never made, the policy does not have to
 * be widened, and `npm run audit:csp` goes back to proving the site
 * runs clean under its own policy rather than carrying a permanent
 * known exception.
 *
 * What this costs: demographics and interests reporting, and Google
 * Ads remarketing audiences. This site runs no ads and its analytics
 * question is "did anyone read this page", so none of that was being
 * used. Page views, events, sessions, sources and every standard GA4
 * report are unaffected — Signals is an overlay on measurement, not
 * measurement itself.
 *
 * Turn it back on by deleting this call, and re-read the img-src note
 * in public/_headers before you do.
 */
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'G-59EFGHFFHF', { allow_google_signals: false });
