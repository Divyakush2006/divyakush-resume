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
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'G-59EFGHFFHF');
