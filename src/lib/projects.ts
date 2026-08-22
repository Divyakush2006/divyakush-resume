/* ── Interface captures ───────────────────────────────────────────
   Saturdays, DineGuru, GovernAI Studio and the Research Atlas each
   carry a cover and a set of interface shots from src/assets. See the
   Media note below for what they are and what they are not. */
import { asset } from './asset';
import _saturdaysCover from '../assets/saturdays_cover.webp';
import _saturdaysLanding from '../assets/saturdays_landing.webp';
import _saturdaysSignin from '../assets/saturdays_signin.webp';
import _saturdaysTracking from '../assets/saturdays_tracking.webp';
import _dineguruCover from '../assets/dineguru_cover.webp';
import _dineguruInventory from '../assets/dineguru_inventory.webp';
import _dineguruIntegration from '../assets/dineguru_integration.webp';
import _dineguruSplash from '../assets/dineguru_splash.webp';
import _dineguruKitchen from '../assets/dineguru_kitchen.webp';
import _studioCover from '../assets/studio_cover.webp';
import _studioResult from '../assets/studio_result.webp';
import _studioLab from '../assets/studio_lab.webp';
import _studioWelcome from '../assets/studio_welcome.webp';
import _atlasCover from '../assets/atlas_cover.webp';
import _atlasLanding from '../assets/atlas_landing.webp';
import _atlasPapers from '../assets/atlas_papers.webp';
import _atlasRepositories from '../assets/atlas_repositories.webp';
import _atlasGraph from '../assets/atlas_graph.webp';

import _recommenderCover from '../assets/recommender_cover.webp';
import _recommenderLanding from '../assets/recommender_landing.webp';
import _recommenderMovies from '../assets/recommender_movies.webp';
import _recommenderHistory from '../assets/recommender_history.webp';
import _recommenderTitle from '../assets/recommender_title.webp';
import _recommenderMusic from '../assets/recommender_music.webp';
import _recommenderSongs from '../assets/recommender_songs.webp';
import _rockfallCover from '../assets/rockfall_cover.webp';
import _rockfallBrand from '../assets/rockfall_brand.webp';
import _rockfallDashboard from '../assets/rockfall_dashboard.webp';
import _rockfallSensors from '../assets/rockfall_sensors.webp';
import _rockfallDetail from '../assets/rockfall_detail.webp';
import _rockfallReadings from '../assets/rockfall_readings.webp';
import _rockfallAlert from '../assets/rockfall_alert.webp';
import _rockfallEvents from '../assets/rockfall_events.webp';
import _algoverseCover from '../assets/algoverse_cover.webp';
import _algoverseHero from '../assets/algoverse_hero.webp';
import _algoverseDashboard from '../assets/algoverse_dashboard.webp';
import _algoverseSorting from '../assets/algoverse_sorting.webp';
import _algoverseArena from '../assets/algoverse_arena.webp';
import _algoverseComplexity from '../assets/algoverse_complexity.webp';
import _algoverseDeck from '../assets/algoverse_deck.webp';
import _algoverseTreeinit from '../assets/algoverse_treeinit.webp';
import _algoverseTrees from '../assets/algoverse_trees.webp';
import _netraCover from '../assets/netra_cover.webp';
import _netraUnit from '../assets/netra_unit.webp';
import _netraBuild from '../assets/netra_build.webp';
import _trafficCover from '../assets/traffic_cover.webp';
import _trafficBoard from '../assets/traffic_board.webp';
import _trafficBench from '../assets/traffic_bench.webp';
import _trafficRtl from '../assets/traffic_rtl.webp';

import _homeCover from '../assets/home_cover.webp';
import _homeLeds from '../assets/home_leds.webp';
import _homeRig from '../assets/home_rig.webp';
import _homeBench from '../assets/home_bench.webp';
import _homeShortlist from '../assets/home_shortlist.webp';
import _stockTraffic from '../assets/stock_traffic.webp';
import _gDineguru from '../assets/g_dineguru.webp';
import _gRockfall from '../assets/g_rockfall.webp';
import _gNetra from '../assets/g_netra.webp';




/* Vite resolved these imports to URL strings; Next resolves them to
   StaticImageData objects. `asset()` is the single boundary where that
   difference is settled — see src/lib/asset.ts for why it is a function
   and not a bundler setting. Everything below this block is a string,
   exactly as it was before the port. */
const saturdaysCover = asset(_saturdaysCover);
const saturdaysLanding = asset(_saturdaysLanding);
const saturdaysSignin = asset(_saturdaysSignin);
const saturdaysTracking = asset(_saturdaysTracking);
const dineguruCover = asset(_dineguruCover);
const dineguruInventory = asset(_dineguruInventory);
const dineguruIntegration = asset(_dineguruIntegration);
const dineguruSplash = asset(_dineguruSplash);
const dineguruKitchen = asset(_dineguruKitchen);
const studioCover = asset(_studioCover);
const studioResult = asset(_studioResult);
const studioLab = asset(_studioLab);
const studioWelcome = asset(_studioWelcome);
const atlasCover = asset(_atlasCover);
const atlasLanding = asset(_atlasLanding);
const atlasPapers = asset(_atlasPapers);
const atlasRepositories = asset(_atlasRepositories);
const atlasGraph = asset(_atlasGraph);
const recommenderCover = asset(_recommenderCover);
const recommenderLanding = asset(_recommenderLanding);
const recommenderMovies = asset(_recommenderMovies);
const recommenderHistory = asset(_recommenderHistory);
const recommenderTitle = asset(_recommenderTitle);
const recommenderMusic = asset(_recommenderMusic);
const recommenderSongs = asset(_recommenderSongs);
const rockfallCover = asset(_rockfallCover);
const rockfallBrand = asset(_rockfallBrand);
const rockfallDashboard = asset(_rockfallDashboard);
const rockfallSensors = asset(_rockfallSensors);
const rockfallDetail = asset(_rockfallDetail);
const rockfallReadings = asset(_rockfallReadings);
const rockfallAlert = asset(_rockfallAlert);
const rockfallEvents = asset(_rockfallEvents);
const algoverseCover = asset(_algoverseCover);
const algoverseHero = asset(_algoverseHero);
const algoverseDashboard = asset(_algoverseDashboard);
const algoverseSorting = asset(_algoverseSorting);
const algoverseArena = asset(_algoverseArena);
const algoverseComplexity = asset(_algoverseComplexity);
const algoverseDeck = asset(_algoverseDeck);
const algoverseTreeinit = asset(_algoverseTreeinit);
const algoverseTrees = asset(_algoverseTrees);
const netraCover = asset(_netraCover);
const netraUnit = asset(_netraUnit);
const netraBuild = asset(_netraBuild);
const trafficCover = asset(_trafficCover);
const trafficBoard = asset(_trafficBoard);
const trafficBench = asset(_trafficBench);
const trafficRtl = asset(_trafficRtl);
const homeCover = asset(_homeCover);
const homeLeds = asset(_homeLeds);
const homeRig = asset(_homeRig);
const homeBench = asset(_homeBench);
const homeShortlist = asset(_homeShortlist);
const stockTraffic = asset(_stockTraffic);
const gDineguru = asset(_gDineguru);
const gRockfall = asset(_gRockfall);
const gNetra = asset(_gNetra);

/* ─────────────────────────────────────────────────────────────────
   Every project, once.

   Both the deck on the home page and the project pages at
   /projects/<slug> read from this file, so a title, a stack or a link
   can never disagree between the two.

   ── Provenance rule ───────────────────────────────────────────────
   Every factual claim here is traceable to something already
   published on divyakush.com — the descriptions, stacks, statuses and
   metrics were taken from there and expanded, not invented.

   Saturdays and DineGuru are the exception, and a better one: both are
   written from PORTFOLIO_SATURDAYS.md and PORTFOLIO_DINEGURU.md at the
   repository root, which are first-hand engineering write-ups of those
   two systems. Every number in those two entries — sixteen apps, 52
   migrations, 14 suites, twelve packages, 25 revisions, 299 tests — is
   quoted from those files, so the check is a diff, not a memory.

   Two claims were carried on this file for months and are wrong
   against that source. They are recorded here so they cannot come
   back by being re-remembered:

     · Saturdays did NOT ship two payment rails. PhonePe is the only
       gateway, deliberately. The Stripe/Razorpay module exists in the
       codebase and is deliberately unused — the page had promoted a
       dormant module to a live integration in seven separate fields.
     · DineGuru has TWELVE domain packages, not nine. The old number
       appeared in the summary, the lede, the headline proof, the
       facts strip, a build block and a result tile.

   Neither document's closing line — both end on a scope-of-work
   statement — is used here. See the note below on team shape.

   ── No claims about team shape ────────────────────────────────────
   There is deliberately no `role` field, and nothing here states or
   implies who else was or was not involved. It was removed once and
   should not come back: nine of the ten values were a job title
   restating that this is a portfolio, and the other one made a claim
   about how the work was staffed that these entries cannot support.
   Say what the thing is and what it produced.

   Where a section describes the shape of a problem rather
   than the shape of the code (`problem`), it is framing the domain,
   which is checkable; where it describes construction (`build`,
   `architecture`), it only restates components that are named in the
   published stack.

   Anything more specific than that — internal module names, schema
   decisions, real latency or throughput numbers, team size — is
   deliberately absent. Add it if you want the pages to go deeper;
   don't let anyone else write it for you.

   ── Media ─────────────────────────────────────────────────────────
   `gallery` holds what exists today: the product mockups where there
   are any, plus a contextual photograph where one earns its place.
   Real screenshots belong here — add them to `src/assets` and push the
   contextual shot down the list.

   Saturdays, DineGuru, GovernAI Studio and the Research Atlas carry a
   full set each — every frame in that project's `final/` folder, the
   cover opening the gallery and the rest following it. These are
   renders: a real interface composited into a generated setting. The
   captions therefore describe the screen and never the room, which is
   the same rule the `hackathonWin` note further down this file was
   written for. A generated picture may illustrate what the software
   does; it may not stand as documentation that a particular scene
   happened.

   ── The bar a contextual photograph has to clear ──────────────────
   It has to be about *this* subject. Four were cut for failing that,
   and they are worth naming so the type does not come back:

     · `g_studio` — three anonymous people around a meeting table. It
       illustrated nothing about AI governance and would have sat
       equally well on any page on the internet.
     · `g_saturdays` — diners at a table holding a phone. Worse than
       generic: the app on that phone is visibly not Saturdays, so the
       frame implied a product shot it could not deliver.
     · `g_recommender` — a rack of blue patch cables.
     · `g_algoverse` — syntax-highlighted code, unreadable and unrelated.

   Four more went on 21 Aug 2026, by explicit decision:

     · `g_atlas` — a card catalogue being searched.
     · `stock_rockfall` — a mossy rock face.
     · `stock_netra` — a security camera on a blank wall.
     · `g_smarthome` — retail smart-home devices on a seamless.

   These four cleared the "about *this* subject" bar and were still
   wrong, which is the sharper lesson. Each pictures the PROBLEM — the
   manual index, the unstable slope, the camera that only watches, the
   appliances at the end of the voice path — and none pictures the
   work. Sitting last in a gallery of real screenshots, an anonymous
   stock frame is the weakest image a reader sees, and it is the note
   the section ends on.

   So the bar is two bars now, and the second is the hard one: it has
   to be about this subject, AND it has to show something the
   screenshots cannot. `g_rockfall` (benched slopes and haul roads),
   `g_netra` (the board the inference runs on) and `g_dineguru` (a
   kitchen brigade at the pass) clear both — each is the physical world
   the software is attached to, which no screenshot contains. A picture
   of the problem is not that. Do not re-add these four.

   `stock_recommender` — an abstract node-and-cube render — went the
   same way once real screenshots of the recommender existed. That is
   the general rule: a placeholder holds a slot until the thing itself
   can fill it, and then it goes.

   ── Real captures ─────────────────────────────────────────────────
   The Content Recommendation Engine, the rockfall system and Netra
   carry actual screenshots rather than renders, so their captions can
   name what the interface is doing without any of the hedging the
   composited frames need. They come in at roughly 2.17:1 — browser
   captures on a 16:9 display, minus the chrome — which is wider than
   the 16:10 the gallery crops to, so a thin strip goes off the top and
   bottom. That is the right axis to lose: these are dashboards, and
   the rows in the middle are the content.

   Two source shapes are in play, and they behave differently:

     · 16:9 at 2048 wide, downscaled from ~2500. These are the good
       ones. The hero is roughly 16:9 on a desktop, so they arrive
       almost uncropped, and they hold up on a retina display.
     · 1024x1024 squares. The layout wants neither axis: the hero keeps
       only the middle 53% vertically on a desktop and the middle 54%
       horizontally on a phone, and the gallery crops to 16:10. They
       work because the subject is centred in each, not because the
       shape fits. Anything near an edge is lost.

   ── What can and cannot be a cover ────────────────────────────────
   A cover is full-bleed behind the page's own h1, so anything with a
   headline on the screen produces two headlines in one frame. This has
   now been hit three times and reverted three times: the Atlas landing
   ("Strategic oversight for the AI frontier"), the recommender landing
   ("Discover Your Next Favorite Movie") and the rockfall dashboard,
   whose Risk Assessment Map and Active Alerts panels read straight
   through the title.

   All three are good gallery images and bad covers. What works behind
   a title is a frame with texture and no sentences: a wall of film
   posters, a rock face, a rig on a dark desk. Check a new cover
   rendered at 1440 before keeping it — the crop is what decides it,
   not how the source looks in a folder.

   The rockfall dashboard is back as that project's cover by explicit
   decision, against the guidance above. It is the strongest single
   frame the project has, and leading with the operations view rather
   than with a photograph of a rock face says what was actually built.
   The trade is real and known: "Risk Assessment Map" and "Active
   Alerts" do read through the title. If it ever needs softening, the
   lever is the hero scrim in ProjectPage, not another cover swap.

   ── Why the browser captures are letterboxed, and why covers are not ──
   The real screenshots come in at about 2.17:1 and the gallery frame is
   16:10. Left to `object-cover` that removed roughly 13% from each
   side, which clipped the sidebar and cut section headings mid-word —
   "Assessment Map", "nt Events", "t History". They are therefore padded
   to exactly 16:10 at conversion, in #0B0B0C, the gallery's own ground,
   so the mat is invisible and the whole capture survives.

   A cover cannot use the padded file. The hero is full-bleed and goes
   portrait on a phone, where `object-cover` keeps the full height and
   crops the width — which would have shown 96px of flat ink top and
   bottom, a quarter of the frame. `recommender_cover` is therefore the
   same frame, unpadded, and only ever used as a cover.

   Prefer 16:9 at 2048 or wider for anything new. Two GovernAI Studio
   frames (`studio_lab`, `studio_welcome`) are only ~860px wide and are
   upscaled by the browser in the gallery — they are the softest images
   on the site and are worth recapturing.

   Two independent video slots, because they answer different
   questions:

   `heroVideo` is the film that plays *behind the title*, muted and
   looping, in place of the still. It is a backdrop — it sits under
   both hero scrims, so it wants atmosphere and movement rather than
   detail somebody has to read. Declared below for GovernAI Studio,
   GovernAI Research Atlas and the Content Recommendation Engine.

   `video` is a full walkthrough further down the page: sound on,
   controls, played on demand. Absent everywhere for now.

   Both are declared against files under `public/projects/<slug>/`,
   and both are safe to declare before the file exists — the hero
   falls back to the cover image and the walkthrough section simply
   does not mount. Drop the file in and it appears; there is no code
   change to make. See public/projects/README.md.
   ───────────────────────────────────────────────────────────────── */

export interface ProjectLink {
  label: string;
  href: string;
  kind: 'live' | 'source' | 'writeup';
}

export interface GalleryItem {
  src: string;
  caption: string;
  /** `product` is the thing itself; `context` is the world it runs in. */
  kind: 'product' | 'context';
}

export interface Project {
  /** URL segment: /projects/<slug>. Also the React key. */
  slug: string;
  title: string;
  category: string;
  year: string;
  status: string;
  /** One line, used on the deck frame. */
  summary: string;
  /** Opening paragraph of the detail page. */
  lede: string;
  stack: string[];
  proof: { value: string; label: string };
  cover: string;
  links: ProjectLink[];
  /** At-a-glance strip under the page title. */
  facts: { label: string; value: string }[];
  /** What the project had to solve. */
  problem: string;
  /** How it is made. */
  build: { title: string; body: string }[];
  architecture: { layer: string; detail: string }[];
  features: { title: string; body: string }[];
  stackDetail: { group: string; items: string[] }[];
  results: { value: string; label: string }[];
  gallery: GalleryItem[];
  /**
   * Film played muted and looping behind the hero title, replacing the
   * still. `poster` is optional and falls back to `cover`.
   */
  heroVideo?: { src: string; poster?: string };
  /** Full walkthrough further down the page: sound on, controls, on demand. */
  video?: { src: string; poster: string; caption: string };
}

export const PROJECTS: Project[] = [
  /* ── 1 ─────────────────────────────────────────────────────────── */
  {
    slug: 'saturdays',
    title: 'Saturdays',
    category: 'Consumer food delivery',
    year: '2026 — present',
    status: 'Live in production',
    summary:
      'A consumer food-delivery platform — customer app, restaurant API, rider layer and operator console on one Django backend.',
    lede: 'A food-delivery platform serving four user classes from one codebase — customers, restaurant owners, delivery partners and platform admins. A React and TypeScript front end over a Django 5 / DRF backend of sixteen domain apps, with live PhonePe payments, an explicit order state machine, WebSocket tracking, and a server-to-server integration with the DineGuru restaurant POS.',
    stack: ['React', 'TypeScript', 'Django', 'PostgreSQL', 'Celery', 'PhonePe'],
    proof: { value: 'Live', label: 'In production, taking real payments' },
    cover: saturdaysCover,
    links: [
      { label: 'saturdays.co.in', href: 'https://saturdays.co.in', kind: 'live' },
    ],
    facts: [
      { label: 'Status', value: 'Live in production' },
      { label: 'Domain apps', value: 'Sixteen' },
      { label: 'Payments', value: 'PhonePe V2' },
    ],
    problem:
      'Ordering food is a funnel with one honest measure of success: an order that is paid for. Every step between opening a menu and a confirmed payment is a place to lose someone — a slow catalogue, a cart that forgets itself, a checkout that fails silently on a bad connection. Four user classes then have to share that one record: the customer tracking it, the restaurant preparing it, the rider carrying it, and the platform accounting for it. The hard part is not any one of those screens. It is that all four read and write the same order, from different clients, at the same time — and only one of them can be trusted with the money.',
    build: [
      {
        title: 'Server-side truth for anything that matters',
        body: 'Prices, taxes, the dine-in charge waiver, payment amounts, rider-assignment signals and delivery-time limits are all enforced in the domain layer rather than the interface. The rule is uniform: if getting it wrong costs money or misleads a customer, the server decides and the client is told. An interface can only ever hide an option; it cannot stop a request.',
      },
      {
        title: 'One state machine, one payment gate',
        body: 'Every order moves through an explicit adjacency map — placed, confirmed, preparing, ready, picked up, out for delivery, delivered — and an illegal move raises a typed conflict carrying the attempted transition rather than silently doing nothing. A prepaid order cannot enter the fulfilment pipeline until its payment is settled, and because that check lives at the single transition point it holds for every actor alike: the partner portal, the POS integration and the payment webhook.',
      },
      {
        title: 'Money discipline in the payment path',
        body: 'Amounts are never accepted from the client — the create-payment endpoint takes an order id and computes the figure from the order’s own immutable total. The webhook logs the raw body before parsing it, verifies authentication, independently re-reads the gateway’s status API outside any transaction, then locks the row and re-checks under the lock; an amount mismatch flags for manual review instead of quietly succeeding. No database lock is ever held across a network call, and a refund commits its pending state before the call goes out.',
      },
      {
        title: 'A transactional outbox, not fire-and-forget',
        body: 'Cross-boundary events are written to an outbox table inside the same transaction as the state change that caused them, then drained by a scheduled worker with attempt counts, backoff and dead-lettering. That is what makes “the order was confirmed” and “the restaurant was told” either both true or both false, instead of a notification that fires just before a rollback.',
      },
      {
        title: 'The POS integration is an API-key boundary',
        body: 'DineGuru drives day-to-day restaurant operation over a separate versioned surface authenticated by an API key and scoped entirely to that key’s restaurant. Identity fields are read-only across it, so a restaurant cannot rename itself or clear a platform suspension; and the key lives encrypted on DineGuru’s server and never reaches a browser, which is also why no cross-origin surface had to be opened here.',
      },
      {
        title: 'A kill switch that cannot lock you out',
        body: 'Platform maintenance is a single config flag read by middleware mounted ahead of every view, returning a structured 503 with a Retry-After. The exempt paths are deliberately narrow — the admin control API, health checks, schema docs — so the switch that turns maintenance off is never behind the maintenance it turned on.',
      },
    ],
    architecture: [
      { layer: 'Client', detail: 'React 18 + TypeScript SPA on Vite; TanStack Query for server state, Zustand for client state' },
      { layer: 'Contracts', detail: 'Thirteen Zod schemas mirroring the backend, validated at the boundary' },
      { layer: 'API', detail: 'Django 5 + DRF, 16 domain apps, versioned at /api/v1 with a generated OpenAPI schema' },
      { layer: 'Domain', detail: 'Per-app service modules; one canonical implementation per decision, shared by every caller' },
      { layer: 'Data', detail: 'PostgreSQL; public UUIDs distinct from primary keys, so ids are never enumerable' },
      { layer: 'Realtime', detail: 'Django Channels and Daphne over a Redis channel layer for order and rider tracking' },
      { layer: 'Async', detail: 'Celery and Beat — webhook relay, payment reconciliation, notification dispatch' },
      { layer: 'Payments', detail: 'PhonePe Standard Checkout V2: hosted page, server-to-server webhook, reconciliation sweep' },
      { layer: 'Partner', detail: 'An API-key surface for the POS, plus an HMAC-signed webhook relay outward' },
      { layer: 'Delivery', detail: 'Front end on Vercel; backend Dockerised behind Gunicorn and Daphne, Sentry-instrumented' },
    ],
    features: [
      { title: 'Live order tracking', body: 'A real state machine, an ETA, and a rider icon that appears only when the server reports an assignment — never a time-based guess.' },
      { title: 'Handover OTP', body: 'A hashed six-digit code verified at the door, with lockout after repeated wrong entries. One OTP system shared with the POS, not two.' },
      { title: 'Doorstep collection', body: 'A cash order can be collected on a platform payment QR, reusing the entire prepaid money path through a new entry point.' },
      { title: 'Offers and surge', body: 'A coupon rule engine with per-user and total caps, restaurant scoping, date windows, referral codes and surge windows.' },
      { title: 'Support with context', body: 'Tickets routed server-side to ops, finance or rider queues, with the payment reference auto-attached so finance never has to look it up.' },
      { title: 'Operator console', body: 'One read ledger over every order across all restaurants, two kinds of restaurant hold with different blast radius, and the platform switch.' },
    ],
    stackDetail: [
      { group: 'Front end', items: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Radix UI', 'MUI'] },
      { group: 'State & forms', items: ['TanStack Query', 'Zustand', 'react-hook-form', 'Zod'] },
      { group: 'API', items: ['Django 5', 'Django REST Framework', 'SimpleJWT', 'drf-spectacular'] },
      { group: 'Data & cache', items: ['PostgreSQL', 'Redis'] },
      { group: 'Async & realtime', items: ['Celery', 'Celery Beat', 'Django Channels', 'Daphne'] },
      { group: 'Payments & ops', items: ['PhonePe V2', 'Sentry', 'structlog', 'WhiteNoise'] },
    ],
    results: [
      { value: 'Live', label: 'Serving real traffic in production' },
      { value: '16', label: 'Domain apps across 52 migrations' },
      { value: '14', label: 'Pytest suites over payments, state and integration' },
    ],
    gallery: [
      { src: saturdaysCover, caption: 'Ordering starts here — one search across every kitchen on the platform.', kind: 'product' },
      { src: saturdaysLanding, caption: 'The same entry point up close, before anything has been searched.', kind: 'product' },
      { src: saturdaysSignin, caption: 'Sign-in — one account across all four classes of user.', kind: 'product' },
      { src: saturdaysTracking, caption: 'The tracking layer, over the customer surface it reports into.', kind: 'product' },
    ],
  },

  /* ── 2 ─────────────────────────────────────────────────────────── */
  {
    slug: 'dineguru',
    title: 'DineGuru',
    category: 'Multi-tenant SaaS',
    year: '2026 — present',
    status: 'Live in production',
    summary:
      'A restaurant operating system — POS and GST billing, inventory, recipe costing, procurement and tiered analytics on one multi-tenant core.',
    lede: 'The software a restaurant actually runs on: take orders at the table, fire tickets to the kitchen, bill with GST, track stock, cost recipes to the gram, purchase from vendors, read the analytics, and run its presence on the delivery platform without leaving the till. An async FastAPI modular monolith over PostgreSQL — twelve domain packages, twenty-five migrations, self-hosted authentication, and a tenancy model where the restaurant is the boundary.',
    stack: ['FastAPI', 'SQLAlchemy 2.0', 'PostgreSQL', 'Alembic', 'React', 'TypeScript'],
    proof: { value: 'Twelve', label: 'Domain packages behind one multi-tenant core' },
    cover: dineguruCover,
    links: [{ label: 'dineguru.in', href: 'https://dineguru.in', kind: 'live' }],
    facts: [
      { label: 'Status', value: 'Live in production' },
      { label: 'Shape', value: 'Modular monolith' },
      { label: 'Backend tests', value: '299' },
    ],
    problem:
      'A restaurant is not one system, it is a dozen that all reference the same few nouns — an ingredient is a stock level, a line on a recipe, a cost input and a purchase order at the same time. Split those into separate services too early and every question becomes a distributed join; leave them undivided and the codebase becomes one indivisible knot. And because several restaurants share the installation, every one of those queries has to be scoped to a tenant without ever trusting the caller to say which tenant it is.',
    build: [
      {
        title: 'A modular monolith, not microservices',
        body: 'Twelve domain packages sit inside one deployment against one database, each with the same internal shape — models, schemas, service, router — and cross-domain access only ever through the service layer, never a model import in a router. The boundaries are real, but recipe costing can still read ingredient prices without a network hop or an eventual-consistency story to explain to anybody.',
      },
      {
        title: 'Tenancy that cannot be passed in',
        body: 'A memberships table is the authorization source of truth, and the active restaurant is resolved from it on every request. The identifier is never accepted as a query parameter or a body field anywhere in the application, and a test greps the call sites to fail the suite if that ever regresses. A tenant boundary the caller gets to name is not a boundary, it is a convention.',
      },
      {
        title: 'Money is recomputed, never received',
        body: 'Subtotal, discount, GST and total are rebuilt from the line items on every mutation; the front end never computes a figure. GST is applied after the discount, which is the correct order for Indian tax treatment, and the rate is snapshotted onto the order at creation so changing a restaurant’s rate can never retroactively rewrite a historical bill.',
      },
      {
        title: 'The draft-to-ticket immutability boundary',
        body: 'Items are added as drafts — billable immediately, freely editable. Firing a kitchen ticket assigns them and makes them immutable; from then on they can only be cancelled, with a reason. Checkout is rejected server-side if any active item is still an unfired draft, so a customer can never be billed for a dish the kitchen was never told to make.',
      },
      {
        title: 'Stock that moves without racing',
        body: 'A stock adjustment is a single arithmetic update under the row’s write lock rather than a read-modify-write, and a negative result is a typed validation error rather than a 500. The weekly stock log posts as one transaction that rolls back entirely on any failure — replacing a per-row loop where a mid-way error left earlier rows committed and a retry double-counted. Ticket-driven deduction locks its ingredient rows and clamps at zero, because a bookkeeping shortfall must never block a kitchen that already holds the physical ticket.',
      },
      {
        title: 'Authentication built from primitives',
        body: 'No external identity provider: bcrypt password hashing with a pre-hash to clear the algorithm’s length cap, stateless short-lived access tokens verified by signature alone, and opaque refresh tokens stored hashed, rotated single-use, and revoked on logout, deactivation or reuse. Authorization is never trusted from the token — the user is re-loaded and the tenant scope re-resolved on every single request. There is no self-signup at all.',
      },
    ],
    architecture: [
      { layer: 'Client', detail: 'React 18 + TypeScript on Vite; a single fetch wrapper is the only network call site in the app' },
      { layer: 'API', detail: 'FastAPI application factory, 12 domain packages, ~90 endpoints under /api/v1' },
      { layer: 'Domain', detail: 'models / schemas / service / router per package; business logic and commits live in the service' },
      { layer: 'Data', detail: 'PostgreSQL through async SQLAlchemy 2.0 and asyncpg; 25 Alembic revisions on a single linear head' },
      { layer: 'Tenancy', detail: 'Resolved per request from memberships; the restaurant id is never client-supplied' },
      { layer: 'Auth', detail: 'bcrypt hashes, stateless access tokens, rotating hashed single-use refresh tokens' },
      { layer: 'Integration', detail: 'An httpx client to the delivery platform’s API-key surface; HMAC-signed inbound provisioning and order webhook' },
      { layer: 'Delivery', detail: 'Render against a managed PostgreSQL instance; migrations applied on deploy from two independent layers' },
    ],
    features: [
      { title: 'POS and billing', body: 'Table-based or straight billing, kitchen tickets, discounts and extra charges, cash or UPI checkout, and a bill designer with a live preview.' },
      { title: 'Inventory', body: 'Race-free stock movement, atomic batch adjustment, append-only price history, and a deletion-impact call that shows the real blast radius before you confirm.' },
      { title: 'Recipe costing', body: 'Snapshot and live cost shown side by side with a divergence banner, over a unit-conversion layer shared with ingredients so the two cannot drift.' },
      { title: 'Procurement', body: 'Vendors, ingredient offers with exactly one current supplier per ingredient, and purchase orders that credit stock on receipt.' },
      { title: 'Analytics', body: 'Fifteen endpoints aggregated live at request time — no rollup tables, no staleness — behind a tier gate that maps every widget through one config function.' },
      { title: 'Rider workspace', body: 'A mobile-first surface scoped to the rider’s own deliveries with no tamperable input, carrying handover OTP verification and doorstep QR collection.' },
    ],
    stackDetail: [
      { group: 'API', items: ['FastAPI', 'Python 3.11', 'Pydantic v2', 'uvicorn'] },
      { group: 'Data', items: ['PostgreSQL', 'SQLAlchemy 2.0 async', 'asyncpg', 'Alembic'] },
      { group: 'Auth & crypto', items: ['bcrypt', 'PyJWT', 'Fernet'] },
      { group: 'Client', items: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS'] },
      { group: 'UI', items: ['Radix UI', 'MUI', 'Recharts', 'lucide-react'] },
      { group: 'Quality', items: ['pytest', 'ruff', 'mypy strict', 'structlog'] },
    ],
    results: [
      { value: '299', label: 'Backend tests across service and integration suites' },
      { value: '12', label: 'Domain packages in one deployment' },
      { value: 'Server-side', label: 'Tenancy resolved from memberships, never from input' },
    ],
    gallery: [
      /* Ordered as a service day rather than as a feature list: open the
         till, read the stock, work the delivery channel, then the pass,
         then the room it all happens in. */
      { src: dineguruCover, caption: 'The till itself — two screens and a card reader on one counter.', kind: 'product' },
      { src: dineguruSplash, caption: 'Opening the till at the start of service.', kind: 'product' },
      { src: dineguruInventory, caption: 'Inventory — stock value, live items and price spikes across the catalogue.', kind: 'product' },
      { src: dineguruIntegration, caption: 'The Saturdays channel: store status, prep time and delivery pricing in one panel.', kind: 'product' },
      { src: dineguruKitchen, caption: 'Incoming orders on the expediting screen, where the tickets are worked.', kind: 'product' },
      { src: gDineguru, caption: 'The kitchen the twelve domains ultimately describe.', kind: 'context' },
    ],
  },

  /* ── 3 ─────────────────────────────────────────────────────────── */
  {
    slug: 'governai-research-atlas',
    title: 'GovernAI Research Atlas',
    category: 'Semantic search',
    year: '2026',
    status: 'Open source',
    summary:
      'Open-source platform unifying research papers, repositories and governance resources behind a single semantic vector index.',
    lede: 'An open-source AI research platform built on behalf of GovernAI, unifying papers, repositories and governance resources into one semantic search experience. Semantic retrieval runs on ChromaDB vector search with Sentence-Transformer embeddings across OpenAlex and GitHub, ranked by a custom relevance score.',
    stack: ['ChromaDB', 'Sentence-Transformers', 'FastAPI', 'React'],
    proof: { value: 'Vector', label: 'One index across papers and repositories' },
    cover: atlasCover,
    links: [
      {
        label: 'Source on GitHub',
        href: 'https://github.com/divyakush2006/GAI-Research-Atlas',
        kind: 'source',
      },
    ],
    facts: [
      { label: 'For', value: 'GovernAI' },
      { label: 'Status', value: 'Open source' },
      { label: 'Sources', value: 'OpenAlex · GitHub' },
    ],
    problem:
      'AI-governance research is split across incompatible shelves: papers live in academic indexes, implementations live in code hosts, and policy resources live somewhere else again. Keyword search across them fails twice over — the same idea is named differently in a paper and in a repository, and a keyword match cannot tell a central result from a passing mention. What is needed is retrieval by meaning, over everything, with a ranking that knows the difference.',
    build: [
      {
        title: 'One embedding space over several sources',
        body: 'Papers from OpenAlex and repositories from GitHub are embedded with Sentence-Transformers into a single vector space. That is what makes the search cross-source rather than federated: a query is compared against everything at once, so a paper and the code implementing it can surface together.',
      },
      {
        title: 'ChromaDB as the retrieval layer',
        body: 'ChromaDB stores and searches the embeddings. Nearest-neighbour retrieval over one index means the system answers by proximity of meaning, so a query phrased in policy language can still reach a result written in engineering language.',
      },
      {
        title: 'A custom relevance score on top',
        body: 'Raw vector similarity is necessary but not sufficient — it will happily return something that mentions the topic once. A custom relevance score re-ranks the retrieved set so that centrality to the query, not just proximity, decides the order.',
      },
      {
        title: 'FastAPI between the index and the interface',
        body: 'A FastAPI service fronts the index and a React client consumes it, which keeps embedding and ranking on the server where they can change without shipping a new front end.',
      },
    ],
    architecture: [
      { layer: 'Client', detail: 'React + TypeScript search interface' },
      { layer: 'API', detail: 'FastAPI service exposing query, retrieval and ranking' },
      { layer: 'Ranking', detail: 'Custom relevance score re-ranking the retrieved set' },
      { layer: 'Retrieval', detail: 'ChromaDB vector search over Sentence-Transformer embeddings' },
      { layer: 'Ingest', detail: 'OpenAlex papers and GitHub repositories into one index' },
    ],
    features: [
      { title: 'Cross-source search', body: 'Papers, repositories and governance resources in one result set.' },
      { title: 'Semantic retrieval', body: 'Matching on meaning rather than shared keywords.' },
      { title: 'Custom ranking', body: 'A relevance score deciding order after retrieval.' },
      { title: 'Open source', body: 'Published in full, built on behalf of GovernAI.' },
    ],
    stackDetail: [
      { group: 'Retrieval', items: ['ChromaDB', 'Sentence-Transformers'] },
      { group: 'API', items: ['Python', 'FastAPI'] },
      { group: 'Client', items: ['React', 'TypeScript'] },
      { group: 'Sources', items: ['OpenAlex', 'GitHub'] },
    ],
    results: [
      { value: 'One', label: 'Index across papers and repositories' },
      { value: 'Open source', label: 'Published in full, built for GovernAI' },
      { value: 'Custom', label: 'Relevance score over vector retrieval' },
    ],
    heroVideo: { src: '/projects/governai-research-atlas/hero.mp4' },
    gallery: [
      { src: atlasCover, caption: 'An atlas being built — retrieval and semantic ranking, as five explicit steps.', kind: 'product' },
      { src: atlasLanding, caption: 'The entry point: state an objective, and the atlas is built around it.', kind: 'product' },
      { src: atlasPapers, caption: 'Papers ranked by semantic relevance and citation impact, not by date.', kind: 'product' },
      { src: atlasRepositories, caption: 'The repository side of the index, ranked against the topic rather than by stars.', kind: 'product' },
      { src: atlasGraph, caption: 'The knowledge graph: papers, repositories, datasets and models around one topic.', kind: 'product' },
    ],
  },

  /* ── 4 ─────────────────────────────────────────────────────────── */
  {
    slug: 'governai-studio',
    title: 'GovernAI Studio',
    category: 'AI governance simulator',
    year: '2026',
    status: 'Training simulator',
    summary:
      'Interactive training simulator for governance and compliance scenarios, backed by a RAG and LLM inference path.',
    lede: 'An AI-governance training simulator delivering a persona-driven interface for governance and compliance scenarios. I owned the end-to-end frontend and extended core simulator logic in the backend’s Django, Celery and hybrid RAG + LLM inference pipeline.',
    stack: ['React', 'TypeScript', 'Django', 'Celery', 'RAG'],
    proof: { value: 'RAG', label: 'Persona-driven scenario engine' },
    cover: studioCover,
    links: [
      {
        label: 'Source on GitHub',
        href: 'https://github.com/divyakush2006/GAI-sim-frontend',
        kind: 'source',
      },
    ],
    facts: [
      { label: 'Also', value: 'Simulator logic' },
      { label: 'Inference', value: 'Hybrid RAG + LLM' },
      { label: 'Async', value: 'Celery workers' },
    ],
    problem:
      'Governance and compliance are learned by judgement, not by recall, which makes them hard to teach from a document. A simulator has to hold a scenario, respond in the voice of a specific stakeholder, and stay anchored to the actual policy rather than improvising plausible-sounding rules — while the inference doing that work takes long enough that it cannot block the interface.',
    build: [
      {
        title: 'Persona-driven interface',
        body: 'The front end is organised around personas rather than around forms: the learner is talking to a stakeholder in a scenario, so the interface has to sustain a conversation and hold state across turns instead of collecting a submission.',
      },
      {
        title: 'Retrieval before generation',
        body: 'A hybrid RAG and LLM path means the model answers against retrieved source material rather than from its weights alone. In a compliance trainer that is the difference between a tool and a liability — the responses have to trace back to the governance documents that were actually loaded.',
      },
      {
        title: 'Celery for work that outlives a request',
        body: 'Inference and retrieval run as Celery tasks off the Django application, so the request cycle is not held open behind a model call and the interface can show progress rather than a spinner on a blocked connection.',
      },
      {
        title: 'Extending the simulator, not just skinning it',
        body: 'Beyond owning the front end I extended the core simulator logic in the backend, which is what kept the interface and the scenario engine from drifting into two different models of what a scenario is.',
      },
    ],
    architecture: [
      { layer: 'Client', detail: 'React + TypeScript, persona-driven scenario interface' },
      { layer: 'Application', detail: 'Django serving the simulator and its scenario logic' },
      { layer: 'Workers', detail: 'Celery running retrieval and inference off the request cycle' },
      { layer: 'Inference', detail: 'Hybrid RAG + LLM path grounded in loaded source material' },
    ],
    features: [
      { title: 'Scenario simulation', body: 'Governance and compliance situations played out in conversation.' },
      { title: 'Persona interface', body: 'Responses in the voice of a specific stakeholder.' },
      { title: 'Grounded responses', body: 'Retrieval-augmented generation over real policy material.' },
      { title: 'Asynchronous inference', body: 'Celery workers so long calls never block the UI.' },
    ],
    stackDetail: [
      { group: 'Client', items: ['React', 'TypeScript'] },
      { group: 'Backend', items: ['Django', 'Celery', 'Python'] },
      { group: 'Inference', items: ['RAG', 'LLM inference'] },
    ],
    results: [
      { value: 'RAG', label: 'Grounded rather than free-generated answers' },
      { value: 'E2E', label: 'Interface built end to end' },
      { value: 'Async', label: 'Inference moved off the request cycle' },
    ],
    heroVideo: { src: '/projects/governai-studio/hero.mp4' },
    gallery: [
      { src: studioCover, caption: 'The simulator entry point — what the training covers, before a scenario is picked.', kind: 'product' },
      { src: studioWelcome, caption: 'Enrolment: the credential logged before the first simulation runs.', kind: 'product' },
      { src: studioLab, caption: 'The scenario list — each one a dilemma, unlocked in order.', kind: 'product' },
      { src: studioResult, caption: 'Training complete — concepts mastered, partial and still to revisit.', kind: 'product' },
    ],
  },

  /* ── 5 ─────────────────────────────────────────────────────────── */
  {
    slug: 'content-recommendation-engine',
    title: 'Content Recommendation Engine',
    category: 'Deep learning — IIT Ropar capstone',
    year: '2025',
    status: 'IIT Ropar capstone',
    summary:
      'Transformer-based sequential recommender with automated data pipelines, built as the IIT Ropar capstone project.',
    lede: 'A transformer-based SASRec deep learning model trained on a 25M-parameter dataset, deployed as a full-stack system with automated data ingestion pipelines. Built as the IIT Ropar capstone project.',
    stack: ['TensorFlow', 'SASRec', 'Python', 'Node.js', 'Docker'],
    proof: { value: '98.47%', label: 'AUC-ROC on the evaluation split' },
    cover: recommenderCover,
    links: [
      {
        label: 'Source on GitHub',
        href: 'https://github.com/divyakush2006/Guilded-Guild',
        kind: 'source',
      },
    ],
    facts: [
      { label: 'Model', value: 'SASRec transformer' },
      { label: 'Result', value: '98.47% AUC-ROC' },
      { label: 'Context', value: 'IIT Ropar capstone' },
    ],
    problem:
      'What someone wants next depends on the order of what they did before — a recommender that treats a user as an unordered bag of preferences throws that away. Sequence models keep it, but they only pay off if the data reaching them is clean and continuous, which makes the ingestion pipeline as much of the problem as the architecture.',
    build: [
      {
        title: 'A sequential model, deliberately',
        body: 'SASRec is a self-attentive sequential recommender: it uses attention over a user’s interaction history so that recent and contextually relevant actions carry more weight than old ones. That choice is what makes the model answer "what next" rather than "what similar".',
      },
      {
        title: 'Trained on TensorFlow at 25M parameters',
        body: 'The model is implemented and trained in TensorFlow against a 25M-parameter dataset, and evaluated on a held-out split — the 98.47% AUC-ROC figure is that evaluation, not training performance.',
      },
      {
        title: 'Automated ingestion rather than a fixed dump',
        body: 'Automated data pipelines feed the model instead of a one-off export. A sequential recommender degrades as soon as its view of recent history goes stale, so continuous ingestion is a correctness requirement, not an operational nicety.',
      },
      {
        title: 'Containerised and served, not left in a notebook',
        body: 'Docker packages the training and serving path and a Node.js service exposes it to a React client, which is the difference between a model that scored well and a system someone can call.',
      },
    ],
    architecture: [
      { layer: 'Client', detail: 'React front end consuming recommendations' },
      { layer: 'Service', detail: 'Node.js API serving the model' },
      { layer: 'Model', detail: 'SASRec self-attentive sequential recommender in TensorFlow' },
      { layer: 'Data', detail: 'Automated ingestion pipelines feeding training and inference' },
      { layer: 'Packaging', detail: 'Docker across the training and serving path' },
    ],
    features: [
      { title: 'Sequence-aware recommendations', body: 'Attention over interaction history rather than static similarity.' },
      { title: 'Automated ingestion', body: 'Pipelines keeping the model’s view of history current.' },
      { title: 'Evaluated, not just trained', body: '98.47% AUC-ROC measured on a held-out split.' },
      { title: 'Deployable', body: 'Containerised and served behind an API.' },
    ],
    stackDetail: [
      { group: 'Model', items: ['TensorFlow', 'SASRec', 'Python'] },
      { group: 'Service', items: ['Node.js', 'React'] },
      { group: 'Platform', items: ['Docker'] },
    ],
    results: [
      { value: '98.47%', label: 'AUC-ROC on the evaluation split' },
      { value: '25M', label: 'Parameter training dataset' },
      { value: 'E2E', label: 'Model through to served API' },
    ],
    heroVideo: { src: '/projects/content-recommendation-engine/hero.mp4' },
    gallery: [
      { src: recommenderLanding, caption: 'The ask: what you are watching now, and what you have watched before.', kind: 'product' },
      { src: recommenderMovies, caption: 'What the model returns from the title you are on.', kind: 'product' },
      { src: recommenderHistory, caption: 'The second pass — recommendations drawn from the whole history, not the last item.', kind: 'product' },
      { src: recommenderTitle, caption: 'A title opened: rating, synopsis and the trailer, without leaving the row.', kind: 'product' },
      { src: recommenderMusic, caption: 'The same sequential model pointed at music instead of film.', kind: 'product' },
      { src: recommenderSongs, caption: 'Song recommendations returned against a listening history.', kind: 'product' },
    ],
  },

  /* ── 6 ─────────────────────────────────────────────────────────── */
  {
    slug: 'rockfall-prediction',
    title: 'AI & IoT Rockfall Prediction',
    category: 'Machine learning & IoT',
    year: '2025',
    status: 'Shortlisted, SIH 2025',
    summary:
      'Multi-sensor fusion pipeline for real-time geological hazard detection, running inference at the edge on live monitoring data.',
    lede: 'A multi-sensor data fusion pipeline with a real-time hazard detection model achieving 98% AUC-ROC, shortlisted for Smart India Hackathon 2025.',
    stack: ['Python', 'Machine learning', 'IoT', 'Edge computing'],
    proof: { value: '98%', label: 'AUC-ROC — shortlisted at SIH 2025' },
    cover: rockfallCover,
    links: [
      {
        label: 'Source on GitHub',
        href: 'https://github.com/Divyakush2006/AI-ROCKFALL-DETECTION-AND-PREVENTION',
        kind: 'source',
      },
      {
        label: 'Write-up on LinkedIn',
        href: 'https://www.linkedin.com/posts/divyakush-punjabi_smartindiahackathon-sih2025-ai-ugcPost-7434008786127998976-1W2z/',
        kind: 'writeup',
      },
    ],
    facts: [
      { label: 'Result', value: '98% AUC-ROC' },
      { label: 'Recognition', value: 'SIH 2025 shortlist' },
      { label: 'Inference', value: 'At the edge' },
    ],
    problem:
      'Rockfall gives warning, but not in any one signal — the useful evidence is spread across several sensors that individually look like noise and only mean something together. And a prediction that arrives after a round trip to a data centre is not a prediction; slopes under monitoring are exactly the places without dependable connectivity, so the decision has to be made where the sensors are.',
    build: [
      {
        title: 'Fusion before classification',
        body: 'Several sensor streams are fused into a single view of slope state before anything classifies it. That ordering is the point of the system: individual channels are too noisy to trigger on, and the correlations between them are what actually carry the signal.',
      },
      {
        title: 'A model tuned for the cost of being wrong',
        body: 'Hazard detection is a heavily imbalanced problem where a miss and a false alarm cost wildly different amounts. AUC-ROC is reported because it measures separability across every threshold rather than accuracy at one convenient cut-off; the model reaches 98%.',
      },
      {
        title: 'Inference at the edge',
        body: 'The model runs on edge hardware next to the sensors rather than in a cloud service, so detection survives the connectivity that monitoring sites actually have and the alert path has no network in its critical section.',
      },
      {
        title: 'Real-time, meaning continuous',
        body: 'The pipeline consumes live monitoring data continuously rather than scoring batches, which is what makes the output a warning rather than a report.',
      },
    ],
    architecture: [
      { layer: 'Sensing', detail: 'Multiple IoT sensor streams from the monitored slope' },
      { layer: 'Fusion', detail: 'Multi-sensor fusion into a single slope-state representation' },
      { layer: 'Model', detail: 'Real-time hazard classifier, 98% AUC-ROC' },
      { layer: 'Runtime', detail: 'Edge inference next to the sensors, no round trip' },
    ],
    features: [
      { title: 'Multi-sensor fusion', body: 'Correlating channels that mean nothing alone.' },
      { title: 'Real-time detection', body: 'Continuous scoring of live monitoring data.' },
      { title: 'Edge deployment', body: 'Inference where connectivity cannot be assumed.' },
      { title: 'Measured separability', body: '98% AUC-ROC rather than a single-threshold accuracy.' },
    ],
    stackDetail: [
      { group: 'Model', items: ['Python', 'Machine learning'] },
      { group: 'Hardware', items: ['IoT sensors', 'Edge computing'] },
    ],
    results: [
      { value: '98%', label: 'AUC-ROC on hazard detection' },
      { value: 'SIH', label: '2025 shortlist' },
      { value: 'Edge', label: 'Inference with no network in the critical path' },
    ],
    gallery: [
      /* Every frame in the project folder, ordered the way the system is
         actually used: what it is called, the view it opens on, the
         readings under that, the one control a person still holds, and
         the record it leaves behind. */
      { src: rockfallBrand, caption: 'Aroham — the name the monitoring system ships under.', kind: 'product' },
      { src: rockfallDashboard, caption: 'The operations view: safety score, sensors online, and the zones carrying risk.', kind: 'product' },
      { src: rockfallSensors, caption: 'Live sensor data — displacement, strain, pore pressure and rainfall, side by side.', kind: 'product' },
      { src: rockfallDetail, caption: 'One sensor expanded, against its own safe and critical bounds.', kind: 'product' },
      { src: rockfallReadings, caption: 'Pore pressure and rainfall, the two that move slowest and matter most after rain.', kind: 'product' },
      { src: rockfallAlert, caption: 'Manual override: the evacuation call a person still has to be able to make.', kind: 'product' },
      { src: rockfallEvents, caption: 'Event history — every threshold crossing, and how it was resolved.', kind: 'product' },
      { src: gRockfall, caption: 'Benched slopes and haul roads — the setting the sensors cover.', kind: 'context' },
    ],
  },

  /* ── 7 ─────────────────────────────────────────────────────────── */
  {
    slug: 'netra',
    title: 'Netra',
    category: 'Edge AI — computer vision',
    year: '2025',
    status: 'Edge AI & computer vision',
    summary:
      'Autonomous person-tracking surveillance on constrained hardware, with real-time detection and an anomaly-scoring dashboard.',
    lede: 'Autonomous person-tracking surveillance on constrained hardware: an ESP32-CAM streams into a YOLOv8 detection pipeline driving pan-tilt servos over MQTT, with anomaly scoring and patrol heat-maps surfaced through a FastAPI and React console.',
    stack: ['YOLOv8', 'ESP32-CAM', 'MQTT', 'FastAPI', 'React'],
    proof: { value: 'On-device', label: 'YOLOv8 inference on an ESP32-CAM' },
    cover: netraCover,
    links: [
      { label: 'Source on GitHub', href: 'https://github.com/divyakush2006/Netra', kind: 'source' },
    ],
    facts: [
      { label: 'Hardware', value: 'ESP32-CAM' },
      { label: 'Detection', value: 'YOLOv8' },
      { label: 'Transport', value: 'MQTT' },
    ],
    problem:
      'Surveillance that only records is evidence after the fact. Making it act — follow a person, notice something unusual — normally means a camera with a computer behind it. Doing it on an ESP32-CAM means the whole loop, detection through to servo movement, has to close on hardware with a fraction of the memory and no GPU, over a transport that tolerates an unreliable link.',
    build: [
      {
        title: 'A closed perception-to-motion loop',
        body: 'The ESP32-CAM streams into a YOLOv8 detection pipeline whose output drives pan-tilt servos. Detection is not the end of the system, it is the input to a control loop — the camera physically follows what it finds, which is what makes the tracking autonomous rather than an overlay on a recording.',
      },
      {
        title: 'MQTT because the link is not reliable',
        body: 'Commands and telemetry move over MQTT, a publish-subscribe transport built for constrained devices and intermittent networks. On this hardware that matters more than throughput: the loop has to degrade rather than stall when the link does.',
      },
      {
        title: 'Anomaly scoring on top of detection',
        body: 'Raw detections say a person is present. Anomaly scoring is the layer that decides whether that is worth attention, which is what turns a stream of positives into something an operator can act on.',
      },
      {
        title: 'Patrol heat-maps as the operator view',
        body: 'A FastAPI and React console renders where the camera has actually been looking as a heat-map, so coverage gaps become visible instead of implicit.',
      },
    ],
    architecture: [
      { layer: 'Capture', detail: 'ESP32-CAM streaming from constrained hardware' },
      { layer: 'Detection', detail: 'YOLOv8 person detection pipeline' },
      { layer: 'Control', detail: 'Pan-tilt servos driven from detection output' },
      { layer: 'Transport', detail: 'MQTT for commands and telemetry' },
      { layer: 'Console', detail: 'FastAPI + React with anomaly scoring and patrol heat-maps' },
    ],
    features: [
      { title: 'Autonomous tracking', body: 'Servos following detections without an operator.' },
      { title: 'On-device pipeline', body: 'Running against ESP32-CAM constraints, not a workstation.' },
      { title: 'Anomaly scoring', body: 'Separating what is present from what is worth attention.' },
      { title: 'Patrol heat-maps', body: 'Coverage made visible in the console.' },
    ],
    stackDetail: [
      { group: 'Vision', items: ['YOLOv8', 'Python'] },
      { group: 'Hardware', items: ['ESP32-CAM', 'Pan-tilt servos'] },
      { group: 'Transport', items: ['MQTT'] },
      { group: 'Console', items: ['FastAPI', 'React'] },
    ],
    results: [
      { value: 'On-device', label: 'Detection on constrained hardware' },
      { value: 'Closed', label: 'Loop from detection to servo movement' },
      { value: 'Live', label: 'Anomaly scoring and coverage heat-maps' },
    ],
    gallery: [
      { src: netraUnit, caption: 'The unit itself — ESP32-CAM on a pan-tilt base, streaming over wireless.', kind: 'product' },
      { src: netraBuild, caption: 'The build as it actually stands: camera, servos and a printed housing on the bench.', kind: 'product' },
      { src: gNetra, caption: 'The constraint that shaped it — inference on a board this size.', kind: 'context' },
    ],
  },

  /* ── 8 ─────────────────────────────────────────────────────────── */
  {
    slug: 'algoverse',
    title: 'AlgoVerse',
    category: 'Interactive learning',
    year: '2025',
    status: 'Interactive learning platform',
    summary:
      'Sorting, graph and tree operations rendered as animated 3D scenes, built to make data structures legible while they run.',
    lede: 'An interactive algorithm and data-structure visualisation platform, rendering sorting, graph and tree operations as animated 3D scenes to make execution and complexity legible step by step.',
    stack: ['React 19', 'TypeScript', 'Vite 6', 'Three.js', 'Tailwind CSS'],
    proof: { value: '3D', label: 'Algorithms rendered as live scenes' },
    cover: algoverseCover,
    links: [
      { label: 'Source on GitHub', href: 'https://github.com/divyakush2006/AlgoVerse', kind: 'source' },
    ],
    facts: [
      { label: 'Renderer', value: 'Three.js' },
      { label: 'Covers', value: 'Sorting · graphs · trees' },
      { label: 'Build', value: 'Vite 6' },
    ],
    problem:
      'Complexity is taught as notation and understood as motion. A student can recite that quicksort is O(n log n) long before they can see why the partition step is what buys it. Static diagrams show the state before and after; what is missing is the middle, and the middle is where the intuition is.',
    build: [
      {
        title: 'The algorithm drives the scene',
        body: 'Sorting, graph and tree operations are rendered as animated 3D scenes in Three.js, stepped by the algorithm itself rather than replayed from a recording. The visualisation is a view of real execution state, so what you watch is what the code actually did.',
      },
      {
        title: 'Three dimensions for the structures that need them',
        body: 'Trees and graphs stop being legible in two dimensions as soon as they have any depth — edges cross and the shape is lost. Rendering in 3D keeps the structure readable while it changes.',
      },
      {
        title: 'Step-by-step rather than play-through',
        body: 'Execution is exposed a step at a time so that complexity can be reasoned about at the point it is incurred, which is what makes the platform a teaching tool instead of an animation.',
      },
      {
        title: 'A modern build for a heavy client',
        body: 'React 19 with TypeScript on Vite 6, styled with Tailwind. A visualiser is an unusually client-heavy application, so build speed and type safety across the algorithm state carry more weight here than in a content site.',
      },
    ],
    architecture: [
      { layer: 'Application', detail: 'React 19 + TypeScript, built with Vite 6' },
      { layer: 'Rendering', detail: 'Three.js scenes driven by algorithm execution state' },
      { layer: 'Algorithms', detail: 'Sorting, graph and tree operations, stepped explicitly' },
      { layer: 'Styling', detail: 'Tailwind CSS' },
    ],
    features: [
      { title: 'Sorting visualisation', body: 'Comparisons and swaps as they happen.' },
      { title: 'Graph and tree operations', body: 'Traversals rendered with structure intact.' },
      { title: 'Step-by-step execution', body: 'Pause at the point complexity is incurred.' },
      { title: '3D scenes', body: 'Depth used to keep structures legible.' },
    ],
    stackDetail: [
      { group: 'Application', items: ['React 19', 'TypeScript', 'Vite 6'] },
      { group: 'Rendering', items: ['Three.js'] },
      { group: 'Styling', items: ['Tailwind CSS'] },
    ],
    results: [
      { value: '3D', label: 'Live scenes rather than static diagrams' },
      { value: 'Stepped', label: 'Execution exposed one operation at a time' },
      { value: '3', label: 'Families: sorting, graphs, trees' },
    ],
    gallery: [
      /* The whole tour, in the order the sidebar lists it. */
      { src: algoverseHero, caption: 'The platform as it opens, before a lab is entered.', kind: 'product' },
      { src: algoverseDashboard, caption: 'Dashboard — the two ways in: run a sort, or open a structure.', kind: 'product' },
      { src: algoverseSorting, caption: 'Sorting Lab: the array as bars, stepped one comparison at a time.', kind: 'product' },
      { src: algoverseArena, caption: 'Comparison Arena — two algorithms on the same input, side by side.', kind: 'product' },
      { src: algoverseComplexity, caption: 'Complexity Lab: measured growth curves rather than a table of notations.', kind: 'product' },
      { src: algoverseDeck, caption: 'Algorithm Deck — pseudocode, properties and bounds for each primitive.', kind: 'product' },
      { src: algoverseTreeinit, caption: 'Choosing a tree to build: BST, AVL, min-heap or max-heap.', kind: 'product' },
      { src: algoverseTrees, caption: 'A tree under traversal, with node operations against it.', kind: 'product' },
    ],
  },

  /* ── 9 ─────────────────────────────────────────────────────────── */
  {
    slug: 'smart-home-automation',
    title: 'IoT Smart Home Automation',
    category: 'Voice interface & NLP',
    year: '2024',
    status: 'Top 12 of 250+ teams',
    summary:
      'Voice-activated home controller that interprets natural-language commands and drives devices directly, no fixed grammar.',
    lede: 'A voice-activated smart home control system integrating the Google Gemini API for natural-language command parsing, driving Arduino-controlled devices directly. Ranked in the top 12 of more than 250 teams at GDSC DevJams 2024.',
    stack: ['Python', 'Arduino', 'Gemini API', 'Spotify API'],
    proof: { value: 'Top 12', label: 'Of 250+ teams — GDSC DevJams 2024' },
    cover: homeCover,
    /* Labelled for what it is. This post records the placing and the
       team; it carries no technical detail, so "Write-up on LinkedIn"
       would oversell it — and the entry that used to sit here was worse
       still, a write-up label pointing at the profile page. */
    links: [
      {
        label: 'The result, on LinkedIn',
        href: 'https://www.linkedin.com/posts/divyakush-punjabi_teamwork-innovation-leadership-activity-7266087499242885121-Sk2I',
        kind: 'writeup',
      },
    ],
    facts: [
      { label: 'Parsing', value: 'Gemini API' },
      { label: 'Devices', value: 'Arduino' },
      { label: 'Result', value: 'Top 12 / 250+' },
    ],
    problem:
      'Voice control in the home usually means learning the system’s phrasing rather than the system learning yours — a fixed grammar of trigger words that fails the moment someone says the same thing a different way. Removing the grammar means something has to interpret intent from open language, and then turn that intent into a signal a microcontroller can act on.',
    build: [
      {
        title: 'An LLM instead of a command grammar',
        body: 'The Gemini API parses natural-language commands, so the system resolves intent rather than matching phrases. That removes the memorised vocabulary that makes most home automation feel brittle — a request works because it means something, not because it was worded correctly.',
      },
      {
        title: 'Straight through to the hardware',
        body: 'Parsed intent drives Arduino-controlled devices directly. Keeping the path from language to actuation short is what stops the round trip feeling like a query rather than a control action.',
      },
      {
        title: 'Media as a first-class target',
        body: 'The Spotify API is wired in alongside the physical devices so that playback is one of the things a command can address, rather than a separate app the same voice request cannot reach.',
      },
      {
        title: 'Built under hackathon constraints',
        body: 'The whole system was built and demonstrated at GDSC DevJams 2024 and placed in the top 12 of more than 250 teams — the scope was set by what could be made to work end to end in the time available.',
      },
    ],
    architecture: [
      { layer: 'Input', detail: 'Voice captured and passed as open natural language' },
      { layer: 'Parsing', detail: 'Google Gemini API resolving intent without a fixed grammar' },
      { layer: 'Orchestration', detail: 'Python mapping intent onto device and media actions' },
      { layer: 'Devices', detail: 'Arduino-controlled hardware; Spotify API for playback' },
    ],
    features: [
      { title: 'Open-language commands', body: 'No trigger vocabulary to memorise.' },
      { title: 'Direct device control', body: 'Intent through to Arduino actuation.' },
      { title: 'Media control', body: 'Spotify addressable by the same voice path.' },
      { title: 'Competition-proven', body: 'Demonstrated end to end under hackathon conditions.' },
    ],
    stackDetail: [
      { group: 'Language', items: ['Google Gemini API', 'Python'] },
      { group: 'Hardware', items: ['Arduino'] },
      { group: 'Integrations', items: ['Spotify API'] },
    ],
    results: [
      { value: 'Top 12', label: 'Of 250+ teams, GDSC DevJams 2024' },
      { value: 'Zero', label: 'Fixed command vocabulary to memorise' },
      { value: 'E2E', label: 'Voice through to hardware actuation' },
    ],
    gallery: [
      /* Was `hackathonWin` captioned "the build demonstrated on the
         day" — an AI-generated image whose stage signage reads
         "GLOBAL TECH INNOVATE HACKATHON" in garbled type. A generated
         picture presented as documentation of a real event is the one
         thing on a portfolio that cannot be defended, so it is gone
         and the caption no longer claims to show the day itself. */
      /* `compDevjams` — a stock circuit-board macro captioned "the class
         of hardware the voice path terminates in" — is gone. It was a
         placeholder for exactly these photographs, and placeholders go
         once the thing itself can fill the slot. */
      { src: homeLeds, caption: 'The output end: LEDs on the breadboard, lit from the Arduino.', kind: 'product' },
      { src: homeRig, caption: 'The build on the table — board and breadboard wired to the host running the parser.', kind: 'product' },
      { src: homeBench, caption: 'The same rig closer in, mid-session.', kind: 'product' },
      { src: homeShortlist, caption: "DevJams '24 — the shortlist read out for the final pitches.", kind: 'context' },
    ],
  },

  /* ── 10 ────────────────────────────────────────────────────────── */
  {
    slug: 'adaptive-traffic-controller',
    title: 'Adaptive Traffic Light Controller',
    category: 'Digital systems — Verilog',
    year: '2024',
    status: 'Digital systems / hardware',
    summary:
      'Real-time traffic controller that adjusts signal timing to measured vehicle throughput, written in Verilog and synthesised to FPGA.',
    lede: 'A real-time adaptive traffic management system implemented on FPGA in Verilog, optimising vehicle throughput by adjusting signal timing dynamically rather than running a fixed cycle.',
    stack: ['Verilog', 'FPGA', 'RTL design'],
    proof: { value: 'RTL', label: 'Synthesised to hardware' },
    cover: trafficCover,
    links: [
      {
        label: 'Write-up on LinkedIn',
        href: 'https://www.linkedin.com/posts/divyakush-punjabi_fpga-verilog-digitalsystems-ugcPost-7395119370793988096-Zy26/',
        kind: 'writeup',
      },
    ],
    facts: [
      { label: 'Language', value: 'Verilog' },
      { label: 'Target', value: 'FPGA' },
      { label: 'Level', value: 'RTL' },
    ],
    problem:
      'A fixed-cycle traffic light is optimal for exactly one traffic pattern and wrong the rest of the day — it holds an empty approach on green while a queue builds on the other. Adapting means measuring demand and changing timing while the junction is running, and doing it with hard timing guarantees, which is a poor fit for software on a general-purpose processor and a natural one for hardware.',
    build: [
      {
        title: 'A state machine in hardware, not software',
        body: 'The controller is written in Verilog at register-transfer level and synthesised to an FPGA. Signal control is a hard-real-time problem where a missed deadline is a safety property, not a dropped frame — expressing it as synchronous logic gives timing that is guaranteed by the clock rather than by a scheduler.',
      },
      {
        title: 'Timing driven by measured throughput',
        body: 'Phase durations respond to measured vehicle throughput instead of a preset cycle, so green time follows demand. That is the entire difference between this and a conventional fixed-plan controller.',
      },
      {
        title: 'Parallel by construction',
        body: 'On an FPGA the approaches are evaluated concurrently rather than in a loop, so adding another one costs area rather than latency — the response time of the junction does not degrade as it grows.',
      },
      {
        title: 'RTL through to synthesis',
        body: 'The design was carried from RTL description through to synthesis on the target device, which is where a hardware design stops being a simulation and starts having a real critical path.',
      },
    ],
    architecture: [
      { layer: 'Sensing', detail: 'Per-approach vehicle throughput measurement' },
      { layer: 'Control', detail: 'Synchronous finite state machine over signal phases' },
      { layer: 'Adaptation', detail: 'Phase duration computed from measured demand' },
      { layer: 'Target', detail: 'Verilog RTL synthesised to FPGA' },
    ],
    features: [
      { title: 'Adaptive phase timing', body: 'Green time following measured demand.' },
      { title: 'Hard real-time', body: 'Timing guaranteed by synchronous logic.' },
      { title: 'Concurrent approaches', body: 'Evaluated in parallel, not in sequence.' },
      { title: 'Synthesised design', body: 'Carried from RTL through to the device.' },
    ],
    stackDetail: [
      { group: 'Design', items: ['Verilog', 'RTL design'] },
      { group: 'Target', items: ['FPGA', 'Digital systems'] },
    ],
    results: [
      { value: 'RTL', label: 'Described and synthesised to hardware' },
      { value: 'Adaptive', label: 'Timing rather than a fixed cycle' },
      { value: 'Parallel', label: 'Approaches evaluated concurrently' },
    ],
    gallery: [
      /* `gFpga` — a stock Arduino beside a laptop — was carried here as
         "the target: an FPGA development board". It is not one. Now that
         photographs of the actual DE2-115 exist, the placeholder that
         named the wrong class of hardware goes. */
      { src: trafficBoard, caption: 'The DE2-115 running the design, its state on the LEDs and the display.', kind: 'product' },
      { src: trafficBench, caption: 'The bench it was brought up on — board, host and the switches driving input.', kind: 'product' },
      { src: trafficRtl, caption: 'The RTL itself: the counter, the emergency path and the light assignments.', kind: 'product' },
      { src: stockTraffic, caption: 'The junction the controller is timing.', kind: 'context' },
    ],
  },
];

/** Case-study lookup, used by the /projects/:slug route. */
export function getProject(slug: string | undefined): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

/** Neighbours for the "next project" pager. Wraps, so it never dead-ends. */
export function neighbours(slug: string) {
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  if (i === -1) return { prev: undefined, next: undefined };
  return {
    prev: PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length],
    next: PROJECTS[(i + 1) % PROJECTS.length],
  };
}
