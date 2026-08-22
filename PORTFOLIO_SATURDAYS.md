# Saturdays — Consumer Food-Delivery Platform

**Full-stack, production-shaped food ordering & delivery platform for the Indian market.**
Customer web app + restaurant partner API + delivery-rider layer + platform operator console,
built on a Django/DRF backend with real payments, real-time order tracking, and a
server-to-server integration with a companion restaurant-management product (DineGuru).

---

## 1. At a glance

| | |
|---|---|
| **What it is** | A Swiggy/Zomato-class consumer food-delivery platform — browse restaurants, build a cart, pay online, track the rider live, review, get support. |
| **Who it serves** | Four distinct user classes on one codebase: **customers**, **restaurant owners**, **delivery partners**, **platform admins**. |
| **Frontend** | React 18 + TypeScript + Vite, ~27,900 lines of TS/TSX |
| **Backend** | Django 5 + Django REST Framework, ~14,400 lines of Python across **16 domain apps**, **52 migrations** |
| **Database** | PostgreSQL (SQLite fallback for local dev) |
| **Async / realtime** | Celery + Celery Beat (Redis broker), Django Channels + Daphne (WebSockets), Redis cache & channel layer |
| **Payments** | **PhonePe Standard Checkout V2** — the platform's only live gateway (OAuth, hosted PayPage, S2S webhook, reconciliation cron, refunds, doorstep QR collection) |
| **API surface** | Versioned REST at `/api/v1/*`, a separate API-key partner surface at `/api/dineguru/v1/*`, auto-generated OpenAPI schema + Swagger + ReDoc |
| **Deployment** | Frontend on Vercel (SPA rewrites); backend Dockerised, Gunicorn/Daphne + WhiteNoise, Sentry-instrumented production settings |
| **Tests** | 14 pytest suites covering the integration spec, PhonePe money flows, the order state machine, webhook relay, support tickets, provisioning and handover OTP |

---

## 2. Product scope — what the app actually does

### 2.1 Customer journey (end to end)

1. **Discover** — home feed (hero, categories, popular-near-you, top brands, locality cuisines, weekly challenges, testimonials, promo banners), browse page, full-text search across restaurants *and* individual dishes, geolocation-aware "nearby" ranking.
2. **Choose a mode** — on opening a restaurant the customer picks **delivery** or **dine-in** once (`OrderModeModal`). The choice is carried on the cart and copied onto the order at placement; dine-in waives packing + delivery charges and carries no address — enforced **server-side** in `place_order()`, not just hidden in the UI.
3. **Build a cart** — menu items with variants, add-on groups (min/max select rules), quantity, per-line add-on price snapshots, cutlery flag, special instructions. Cart is server-owned and re-priced on every mutation.
4. **Apply offers** — coupon codes with a rule engine (min order value, per-user caps, total caps, restaurant scoping, date windows), referral codes, surge windows.
5. **Address** — saved addresses with tags (home/work/other), landmark, geo-coordinates, default flag, and an "Order for" recipient override so a customer can order to someone else's details.
6. **Pay** — Cash-on-delivery (with a `cash` vs `upi` sub-method the customer actually picks, so the rider knows what handover to expect) **or** online via PhonePe's hosted checkout.
7. **Track** — live order tracker with a real state machine, an ETA, a rider icon that only appears when a rider is genuinely assigned (server-signalled, never a time-based guess), delivery-time change notices with the restaurant's stated reason, and WebSocket push.
8. **Receive** — handover OTP at the door; the rider verifies the customer's 6-digit code to complete the delivery.
9. **Aftercare** — order history, reprint/detail view, restaurant & delivery-partner reviews, support tickets with contextual order pre-fill, refunds.

### 2.2 Restaurant-facing capabilities

- Owner dashboard, owner order queue, owner restaurant detail, **owner webhook registration** page.
- Full menu authoring: categories (sort order, active flag), items (slug, description, base price, image, veg flag, spice level, calories, prep time, availability, popularity score), variants with price deltas, add-on groups and add-ons, and time-windowed item availability.
- Operational levers: `is_open`, average prep time, minimum order amount, packing charge, weekly opening hours, ad-hoc closures, service-area polygons.
- **Auto-accept toggle** (`auto_accept_orders`, default *off*): when on, orders confirm automatically — COD at placement, online once paid — through a single decision point (`orders/services/accept.py::maybe_auto_accept`) shared by both the placement path and the payment-resolution path. When off, every order waits for a manual accept.
- Most day-to-day operation is driven from the companion **DineGuru** POS over a dedicated API-key surface (see §7).

### 2.3 Delivery-partner layer

`DeliveryPartner` profiles with vehicle type/number, online/offline status, live lat-lng and last ping, lifetime delivery count and rating average. Supporting models: **PartnerKYC** (document type/number/URL, review workflow with reviewer + timestamp), **Shift** (start/end/duration), **Assignment** (one-to-one with an order, status machine, accepted/completed timestamps, distance, earnings), **LocationPing** (lat/lng, speed, accuracy, recorded-at). A dispatch service allocates orders; WebSocket consumers stream partner location to the customer tracker.

### 2.4 Platform operator console

A separate, guarded admin surface (`/admin/login` → `/admin/*`) backed by a real `admin-api`:

- **Platform stats** dashboard (orders total/today, active vs total restaurants, etc.) — replaced hardcoded placeholders with real aggregates.
- **Unified order ledger** (`GET /api/v1/admin-api/ledger/`) — one read view over **every** order, dine-in and delivery, across all restaurants, with items, pricing breakdown, status history, PhonePe payment reference and rider; filterable by restaurant/mode/status/payment/date, searchable and paginated. Built as read-side aggregation over the canonical `Order` model — no forked write path.
- **Platform kill switch** — `PlatformConfig.is_maintenance` plus a `MaintenanceModeMiddleware` mounted before every view, returning a structured `503` with `Retry-After` to all non-exempt paths. Exempt prefixes are deliberately narrow: Django admin, the admin control API itself, health checks, schema/docs, static and media — so an admin can never lock themselves out of the switch that turns it off.
- **Two distinct holds**, different owners and different blast radius:
  - `platform_hold` — set by a platform admin. Hides the restaurant from *every* public entry point (list, search, tag filter, nearby, detail — all through one `Restaurant.objects.visible()` queryset) **and** blocks order creation (`place_order` raises `restaurant_unavailable`). Read-only over the DineGuru API, so a restaurant can't clear its own suspension.
  - `routing_hold` — set DineGuru-side (ops/automated, e.g. an integration outage). Hides from browse, but does **not** block order creation; instead the webhook relay *defers* that restaurant's events (held PENDING, no backoff or dead-letter accrual) so orders queue rather than drop, and flush through the same relay when the hold lifts.
- Restaurant CRUD & detail, hold toggles, DineGuru password-reset trigger, menu-item management, support-ticket inbox, flagged-review moderation.

### 2.5 Supporting surfaces

- **Support system** — ticket categories mapped to the spec set (order not received / wrong item / payment issue / rider issue / refund status / other), each routed server-side to a back-office queue (`ops` / `finance` / `rider_ops`) with per-queue inbox addresses. Payment and refund tickets **auto-attach the PhonePe transaction reference** so finance doesn't have to look it up. Ticket threads with messages, attachments, internal-only notes, canned responses, priority and assignment. Frontend gives contextual order pre-fill (`/support?order=<id>`), FAQ deflection that never buries the escalation path, and an "In review" state.
- **Notifications** — templates keyed by string with locale support, per-user delivery records with status/provider-ref/error, per-user channel preferences, and three channel adapters (FCM push, SES email, Twilio SMS), dispatched via Celery.
- **Legal pages** — Terms, Refund policy, Privacy, under a shared legal layout.
- **Developer credit page** (`/developer`) — pulls the developer's pinned GitHub repositories live via the **GraphQL API server-side** (pins aren't exposed by the REST API); the token never reaches the browser, and the page degrades to REST ordering if the token is blank.
- **API test console** (`src/api-tests/*`) — an in-app harness with one page per backend domain (auth, accounts, cart, menu, orders, payments, promotions, restaurants, reviews, search, support, delivery, notifications, partner API) for exercising endpoints during development.

---

## 3. Technology stack — complete

### 3.1 Frontend

| Layer | Technology |
|---|---|
| Framework | **React 18.3.1** + **TypeScript 6** |
| Build | **Vite 6.3.5**, `@vitejs/plugin-react`, path alias `@ → src` |
| Styling | **Tailwind CSS 4.1.12** (`@tailwindcss/vite`), `tw-animate-css`, PostCSS |
| Component system | **Radix UI primitives** (28 packages: accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, slot, switch, tabs, toggle, toggle-group, tooltip) composed shadcn/ui-style into a local `components/ui` library |
| Additional UI | **MUI 7.3.5** + icons, Emotion, `vaul` (drawers), `cmdk` (command palette), `sonner` (toasts), `input-otp`, `embla-carousel-react`, `react-slick`, `react-responsive-masonry`, `react-resizable-panels`, `canvas-confetti`, `lucide-react` icons |
| Animation | **motion 12.23** (Framer Motion) |
| Routing | **react-router 7.13** with lazy-loaded route modules + Suspense fallbacks |
| Server state | **TanStack React Query 5.101** (centralised `queryClient` + `queryKeys` config) |
| Client state | **Zustand 5** — `authStore`, `cartStore`, `locationStore`, `uiStore` |
| Forms & validation | **react-hook-form 7.55** + **Zod 4** + `@hookform/resolvers`; a dedicated `src/schemas/*` layer with 13 Zod schemas mirroring backend contracts (auth, cart, delivery, menu, notification, order, payment, phonepe, promotion, restaurant, review, search, support) |
| HTTP | **axios** behind a single `lib/apiClient.ts` |
| Realtime | Custom `useWebSocket` / `useOrderSocket` / `useDeliverySocket` hooks over `lib/websocket.ts` |
| Maps | **Leaflet 1.9 + react-leaflet 4.2** |
| Charts | **Recharts 2.15** (admin dashboards) |
| Dates | `date-fns 3.6`, `react-day-picker` |
| Drag & drop | `react-dnd` + HTML5 backend |
| Theming | `next-themes` |
| Misc | `class-variance-authority`, `clsx`, `tailwind-merge` |

**Resilience components:** `ErrorBoundary`, `OfflineBanner` (+ `useOnlineStatus`), `SuspenseFallback`, skeleton loaders, `MaintenanceBanner`, route guards (`RequireAuth`, `RequireRole`).

### 3.2 Backend

| Layer | Technology |
|---|---|
| Framework | **Django 5.0.6** + **Django REST Framework 3.15.1** |
| Auth | **djangorestframework-simplejwt 5.3.1** with rotation + blacklist-after-rotation; custom `accounts.User` model; OTP (phone + email) and Google-auth services alongside email/password |
| API schema | **drf-spectacular 0.27** → `/api/schema/`, Swagger UI at `/api/docs/`, ReDoc at `/api/redoc/` |
| Filtering | `django-filter 24.2` + DRF SearchFilter + OrderingFilter |
| Database | **PostgreSQL** via `psycopg[binary] 3.2` (SQLite default for local dev) |
| Cache | **Redis** via `django-redis 5.4` |
| Realtime | **Django Channels 4.1** + **Daphne** ASGI + `channels-redis` channel layer; per-app `consumers.py` and `routing.py` for orders and delivery |
| Background work | **Celery 5.4** + `django-celery-beat` (DB scheduler) + `django-celery-results` |
| Payments | **PhonePe** (bespoke client, §5) — plus a dormant `apps/payments` module wired for Stripe 10.5 / Razorpay 1.4.2 that is deliberately unused |
| Storage / media | `django-storages[s3]` + `boto3`, `Pillow`, WhiteNoise compressed-manifest static files |
| Phone numbers | `django-phonenumber-field` |
| Config | `django-environ` — split settings (`base` / `dev` / `prod`) |
| Observability | `structlog`, `sentry-sdk` (Django integration, 10% trace sample, PII off) |
| Serving | `gunicorn` (WSGI) / Daphne (ASGI) |
| Quality | `pytest`, `pytest-django`, `pytest-cov`, `factory-boy`, `faker`, `ruff`, `mypy`, `django-stubs`, `pre-commit` |

---

## 4. Architecture

### 4.1 Application layout

Sixteen Django apps, each with a consistent internal shape — `models.py`, `api/serializers.py`, `api/views.py`, `services/*` for domain logic, `urls.py`, `admin.py`, plus `tasks.py`, `consumers.py` and `routing.py` where relevant:

```
apps/
├── common/        cross-cutting primitives (see §4.2)
├── accounts/      User, OTP, Address, Device, UserConsent; google_auth + otp services
├── restaurants/   Restaurant, hours, closures, service areas, ratings rollup,
│                  owner API, platform/admin control API, geo service
├── menu/          Category, MenuItem, Variant, AddOnGroup, AddOn, ItemAvailability
├── cart/          Cart, CartLine, CartLineAddOn, CartPromoApplication; pricing + coupon services
├── orders/        Order, OrderLine, OrderEvent, HandoverOTP, Refund;
│                  place / accept / cancel / delivery / state_machine services; ledger; consumers
├── payments/      PaymentIntent, PaymentAttempt, WalletAccount, WalletLedger, Payout
│                  (Stripe/Razorpay gateway abstraction — present, deliberately unused)
├── phonepe/       PaymentAttempt, WebhookLog, PaymentEvent; client + pay/resolve/refund/
│                  reconcile/collect/notify services; reconciliation management command
├── delivery/      DeliveryPartner, PartnerKYC, Shift, Assignment, LocationPing;
│                  dispatch service; WebSocket consumers
├── reviews/       RestaurantReview, DeliveryReview, ReviewModerationFlag; rollup service, signals
├── promotions/    Coupon, CouponRule, CouponRedemption, ReferralCode, SurgeWindow;
│                  coupon_engine + surge services
├── notifications/ NotificationTemplate, NotificationDelivery, NotificationPreference;
│                  fcm / ses / twilio channels; dispatch service; Celery tasks
├── search/        restaurant + item search endpoints, indexer service
├── support/       Ticket, TicketMessage, CannedResponse; queue routing + email notify
├── partner_api/   RestaurantWebhook, WebhookDelivery; HMAC signing, webhook relay,
│                  relay management command, Celery tasks
└── dineguru/      RestaurantApiKey + the entire DineGuru-facing API surface;
                   provisioning, menu_sync and handover services
```

### 4.2 Cross-cutting infrastructure (`apps/common`)

This is where the engineering discipline of the project concentrates:

- **Model mixins** — `TimeStampedModel` (indexed `created_at`, auto `updated_at`), `UUIDPublicModel` (a public UUID `public_id` distinct from the internal bigint PK, so IDs are never enumerable across the API), `SoftDeleteModel` (+ `SoftDeleteQuerySet`), `GeoPoint` (lat/lng decimal pair).
- **Transactional outbox** (`outbox.py`) — `emit(topic, payload)` writes an `OutboxEvent` **inside the same DB transaction** as the state change; a Celery Beat task drains unsent rows and dispatches them. Status machine `pending → sent → failed → dead`, attempt counter, `next_attempt_at` backoff, composite index on `(status, next_attempt_at)`. This is the correctness backbone of every cross-boundary notification in the system.
- **Idempotency keys** (`idempotency.py`) — a context-managed `idempotent(key, user, scope)` wrapper that replays a captured response for a repeated `Idempotency-Key`, so a retried unsafe operation (e.g. order creation on a flaky mobile connection) can't double-execute.
- **Middleware** — `RequestIDMiddleware` (accepts or mints `X-Request-ID`, echoes it on the response, binds it to the log context) and the maintenance kill switch described in §2.4.
- **Health checks** — `/healthz/` liveness plus a readiness probe that actually exercises the DB (`SELECT 1`) and the cache round-trip and returns `503 degraded` with a per-dependency breakdown.
- **Uniform error envelope** — a custom `drf_exception_handler` with typed domain exceptions (`ConflictError` etc. carrying a machine-readable `code` and `details`).
- **Pagination**, **permissions** (including `IsPlatformAdmin`), **audit** helpers, **`PlatformConfig`** (kill switch + operator message), **`ws_auth`** (WebSocket authentication), and a `seed_data` management command.

### 4.3 Request throttling

Deliberately tiered rather than one global rate, each tier justified by real cost:

| Scope | Rate | Why |
|---|---|---|
| `anon` | 60/min | baseline |
| `user` | 240/min | baseline |
| `otp` | 5/min | SMS/email cost + abuse |
| `admin_login` | 10/min | brute-force protection on the highest-value login surface |
| `support_ticket` | 5/min | each ticket sends a real email against a shared 500/day quota |
| `phonepe_pay` | 10/min | each call hits PhonePe's **live** create-order API |

### 4.4 Production hardening (`settings/prod.py`)

`DEBUG=False`, `SECURE_PROXY_SSL_HEADER`, forced SSL redirect, secure session + CSRF cookies, 30-day HSTS with subdomains and preload, content-type nosniff, same-origin referrer policy, and Sentry with `send_default_pii=False`.

---

## 5. Payments — PhonePe Standard Checkout V2

Built as its own Django app rather than bolted onto the pre-existing (unconfigured) Stripe/Razorpay module, because that module's schema and gateway abstraction don't match PhonePe's V2 flow — and building a second gateway's worth of abstraction hadn't been earned.

### 5.1 Flow

```
PaymentOptionsPage → "Pay Online"
  → order placed first (payment_method=online, stays unconfirmed)
  → POST /api/v1/phonepe/pay/   → creates PaymentAttempt, returns hosted PayPage URL
  → browser redirected to PhonePe
  → PhonePe → POST /api/v1/phonepe/webhook/  (server-to-server)
  → PaymentCallbackPage polls GET /api/v1/phonepe/status/<merchant_order_id>/
  → resolved → order tracking page
Backstop: Celery Beat `phonepe.reconcile_payments` every 120s
```

### 5.2 Schema

- **`PaymentAttempt`** — FK to the existing `orders.Order` (no duplicated orders table), unique `merchant_order_id` and `phonepe_order_id`, `amount_paise` as `BigIntegerField`, `refunded_amount_paise`, `merchant_refund_id`, status, `payment_method` from PhonePe's `paymentDetails[].paymentMode` (UPI_QR / UPI_COLLECT / CARD / NETBANKING…), `is_doorstep` flag, persisted `redirect_url`, cached `gateway_response`, `requires_manual_review` + `review_reason`, `expires_at`.
- **`WebhookLog`** — the raw headers and body logged **before** any parsing or verification, so a malformed or hostile callback is still forensically available.
- **`PaymentEvent`** — every status transition regardless of source (webhook, cron, refund, manual admin) with previous/new status, a reason enum, and the acting admin for manual changes.

### 5.3 Money discipline (the part that matters)

- **Amounts are never accepted from the client.** The create-payment endpoint takes only `order_id`; paise are computed server-side from the order's immutable `grand_total` snapshot.
- **Webhook order of operations:** log → verify Basic Auth → independently call PhonePe's **Order Status API** *outside* any transaction → `SELECT … FOR UPDATE` the row → re-check status under the lock → compare amounts (a mismatch sets `requires_manual_review` and alerts, it never silently succeeds) → commit.
- **No DB lock is ever held across a network call** — the status check, the refund call, and the reconciliation sweep's poll all happen before a transaction is opened.
- **Late-success decision tree** (`services/resolve.py`) — a SUCCESS arriving after EXPIRED checks for a sibling SUCCESS attempt or an already-cancelled order before deciding to accept vs. refund.
- **Refunds** commit `REFUND_PENDING` *before* calling PhonePe, never inside the same transaction as the call; wired into `cancel_order()` so cancelling a paid online order auto-refunds.
- **Reconciliation** runs every 2 minutes with a configurable grace period on top of `expires_at` to absorb PhonePe's settlement lag.

### 5.4 Doorstep collection (COD → platform QR)

A cash-on-delivery order can be collected at the door via a **platform** PhonePe QR: `create_doorstep_collection` opens a `PaymentAttempt` flagged `is_doorstep` and reuses the *entire* existing PhonePe machinery (create-order timeout handling, webhook/status resolution, amount check) through a new entry point, leaving the prepaid money core untouched. Funds land in the **platform's** merchant account, not the restaurant's, so commission and holds still apply. Exposed to DineGuru's rider app at `POST/GET /api/dineguru/v1/orders/{public_id}/collection/`; the QR is the hosted-checkout redirect URL rendered client-side, so it works with any UPI app.

**PhonePe is the only gateway** — a deliberate product decision. No Razorpay, no Cashfree.

---

## 6. Data model

### 6.1 Orders — the spine of the system

`Order` carries: customer, restaurant, optional address, status, payment status, payment method (`online`/`cod`), payment sub-method (`cash`/`upi`), payment intent reference, order mode (`delivery`/`dine_in`), the full money breakdown (`subtotal`, `packing_charge`, `delivery_fee`, `taxes`, `discount`, `grand_total`), coupon code, special instructions, cutlery flag, `eta_minutes`, `committed_delivery_at`, `delivery_update_reason`, a full timestamp set (`placed_at`, `confirmed_at`, `picked_up_at`, `delivered_at`, `cancelled_at`) plus cancel reason, delivery partner, delivery contact phone and `rider_arrived_at`.

Supporting rows: **`OrderLine`** (snapshotted item name, variant name, quantity, unit price, add-ons JSON, line total), **`OrderEvent`** (from-status, to-status, actor, meta JSON — a complete audit trail), **`HandoverOTP`**, **`Refund`**.

### 6.2 Order state machine (`orders/services/state_machine.py`)

```
draft → placed → confirmed → preparing → ready_for_pickup
      → picked_up → out_for_delivery → delivered → refunded
(any pre-delivery state → cancelled)
```

Every transition is validated against an explicit `ALLOWED` adjacency map and raises a typed `ConflictError` with `from`/`to` details on an illegal move. Timestamps are set from a `TIMESTAMP_FIELD` map, an `OrderEvent` is written, and an outbox event is emitted — all in one transaction.

**The payment gate:** a prepaid (`online`) order can never enter the fulfilment pipeline until `payment_status == PAID`. This check lives at the single transition point, so it holds for *every* actor — the partner portal, DineGuru, and the payment webhook alike. COD orders pass the gate because they're collected at handover.

### 6.3 Handover OTP

One-to-one with an order: hashed code, a short-lived plaintext copy visible only to the order's owner, expiry (30 min default), a wrong-entry `attempts` counter with lockout after 5 tries, and `verified_at`. The rider verifies it at the door through DineGuru, which proxies to Saturdays — **one OTP system**, not two.

### 6.4 Pricing (`cart/services/pricing.py`)

```
subtotal      = Σ (unit_price + Σ addon price snapshots) × quantity
packing       = restaurant.packing_charge      (zero for dine-in)
delivery_fee  = DELIVERY_BASE_FEE + DELIVERY_PER_KM_FEE × distance_km   (zero for dine-in)
discount      = applied coupon amount
taxable       = max(subtotal − discount, 0)
taxes         = taxable × 5%
grand_total   = subtotal + packing + delivery_fee + taxes − discount
```

Every figure is computed server-side and quantised to 2dp; emptying a cart resets the restaurant binding and the order mode so the next restaurant re-prompts cleanly.

### 6.5 Other domains

- **Accounts** — `User` (role-based, `full_name`, phone/email verification flags, locale, marketing opt-in), `OTPRequest` (hashed code, purpose, expiry, attempts, consumed-at), `Address`, `Device` (platform, unique push token, app version, last seen), `UserConsent` (kind, version, granted — a real consent ledger).
- **Restaurants** — `Restaurant` (owner, slug, contact, full address + geo, cover/logo, `is_open`, `is_verified`, `auto_accept_orders`, `platform_hold`, `routing_hold`, avg prep time, packing charge, min order, cost-for-two, cuisine tags), `RestaurantHours`, `RestaurantClosure`, `ServiceArea` (polygon JSON), `RatingsRollup`, `CuisineTag`.
- **Menu** — `Category`, `MenuItem` (with an `external_id` that holds the DineGuru menu-item id so re-syncs upsert the same row instead of duplicating), `Variant`, `AddOnGroup`, `AddOn`, `ItemAvailability`.
- **Promotions** — `Coupon` (type, value, max discount, min order, date window, total and per-user caps, optional restaurant scope), `CouponRule` (typed rules with JSON values), `CouponRedemption`, `ReferralCode`, `SurgeWindow` (multiplier + reason).
- **Payments (dormant module)** — `PaymentIntent`, `PaymentAttempt`, `WalletAccount`, `WalletLedger` (double-entry style: entry type, amount, `balance_after`, reference type/id, memo), `Payout` (period, gross/commission/net, gateway payout id). The commission and payout schema exists even though settlement isn't switched on.
- **Partner API** — `RestaurantWebhook` (URL, secret, subscribed event list, active flag), `WebhookDelivery` (per-delivery UUID, topic, status, attempts, `next_attempt_at`, response status, response ms, last error, delivered-at).

---

## 7. The DineGuru integration (`apps/dineguru`)

Saturdays is the **consumer platform and system of record for orders**; DineGuru is the **restaurant's control plane**. They are two separate applications talking server-to-server.

```
DineGuru frontend ──JWT──▶ DineGuru backend ──Api-Key──▶ Saturdays backend
   (owner UI)               (stores + decrypts the         (/api/dineguru/v1/*)
                             Saturdays API key)

Saturdays backend ──HMAC-signed──▶ DineGuru backend
 (restaurant onboarded)             (/internal/saturdays/provision)
```

### 7.1 The API-key surface (`/api/dineguru/v1/*`)

| Method | Path | Purpose |
|---|---|---|
| POST | `auth/verify/` | Validate an API key |
| GET/PATCH | `restaurant/` | Read / toggle `is_open`, prep time, min order, packing charge, `auto_accept_orders`, `routing_hold` |
| GET/PUT | `restaurant/hours/` | Read / replace the weekly schedule |
| GET | `menu/` | List menu with availability + price |
| POST | `menu/sync/` | Authoritative menu publish from DineGuru (upsert by `external_id`) |
| PATCH | `menu/<public_id>/` | Toggle availability / set price |
| GET | `orders/` · `orders/<public_id>/` | Order queue and detail |
| POST | `orders/<public_id>/accept/` · `reject/` · `status/` | Order lifecycle from the POS |
| POST | `orders/<public_id>/delivery/` | Delivery-time management |
| POST/GET | `orders/<public_id>/collection/` | Rider doorstep PhonePe QR + status |
| POST | `orders/<public_id>/verify-otp/` | Rider handover OTP verification |
| POST | `webhook/` | DineGuru registers a receiver for pushed order events |

Identity fields (name, address) are **read-only** over this surface. Every call is scoped to the API key's restaurant — tenant isolation covered by tests. The key never reaches a browser (DineGuru's backend holds it Fernet-encrypted), so **no CORS changes are needed on Saturdays**.

### 7.2 Auto-provisioning

DineGuru has **no self-signup**. When an operator saves a brand-new `Restaurant` in Saturdays' Django admin, `RestaurantAdmin.save_model` calls `provision_dineguru_access()`, which ensures a `RestaurantApiKey` exists, generates a one-time password (never stored on Saturdays), HMAC-signs the payload with a shared secret and POSTs it to DineGuru's internal provisioning endpoint. DineGuru atomically creates the restaurant (active immediately — already vetted here), the owner user with a pre-hashed password, the membership and the encrypted connection, then registers the order webhook back. The Django admin surfaces the generated credentials **once**. A manual "🔗 Provision / resync DineGuru access" action re-runs it idempotently, keyed off `Restaurant.public_id` — updating in place and rotating the password rather than duplicating.

### 7.3 Admin-triggered password reset

Token-based and single-use: the platform admin triggers it from Django admin → HMAC-signed call to DineGuru → a reset token row is minted and returned once → the owner redeems it themselves. 60-minute TTL, single use, invalidates prior tokens, revokes all sessions on use. **The admin never sets or sees a plaintext password.**

### 7.4 Webhook relay

Order events are emitted to the outbox inside the order transaction, then relayed to registered restaurant webhooks with HMAC signatures, attempt counting, exponential backoff, dead-lettering, and per-delivery response telemetry (status code + latency). A `routing_hold` defers a restaurant's deliveries without accruing failures.

---

## 8. Engineering decisions worth calling out

- **Server-side truth for anything that matters.** Prices, taxes, order-mode charge waivers, payment amounts, rider-assignment signals and delivery-time limits are all enforced in the domain layer, not the UI — several of these were specifically moved server-side after review.
- **Delivery-time constraints are measured against the *original* commitment.** `Order.committed_delivery_at` is snapshotted once at accept, so repeated small push-backs can't creep past the 1.5-hour ceiling; and no change is allowed once the food is prepared. Violations return `409` from the API rather than being hidden by the UI.
- **The rider icon problem.** The tracker's scooter used to render on a time-based guess. It now renders only when the server reports `rider_assigned`, derived from the actual delivery-partner/rider contact state. Small feature, but it's the difference between a UI that lies and one that doesn't.
- **Derived views can't drift.** Menu categories with zero orderable items are dropped by annotating and filtering **at query time**, so a category can never appear as a dead end.
- **One canonical write path.** The unified order ledger, the auto-accept decision, and the state machine each have exactly one implementation used by every actor — no forked logic per client.
- **Public IDs are UUIDs.** Every externally-addressable entity exposes a `public_id` distinct from its bigint primary key.
- **The dormant payments module is left dormant on purpose.** Its Stripe/Razorpay abstraction holds a DB transaction open across a refund API call — exactly the anti-pattern the PhonePe build avoids. It was left untouched rather than half-fixed, and the reasoning is documented.

---

## 9. Testing & verification

Pytest suites: `test_integration_spec.py` (27 tests against the integration specification), `test_phonepe.py` (25 — row-locking/idempotency, the amount-mismatch path, the late-success decision tree, commit-then-call refunds, create-order timeout handling, webhook auth and logging), `test_phonepe_collect.py`, `test_orders_state_machine.py`, `test_order_mode.py`, `test_handover_otp.py`, `test_support_tickets.py`, `test_webhook_relay.py`, `test_partner_webhook_registration.py`, `test_dineguru_control.py`, `test_dineguru_menu_sync.py`, `test_dineguru_provisioning.py`, `test_smoke.py`.

**Live-verified end to end (2026-07-15):** a real restaurant created on Saturdays produced a working DineGuru account with zero manual steps — user, restaurant, and encrypted connection all landed correctly, login succeeded with the generated credentials, self-registration confirmed removed (404), and a forged provisioning signature correctly rejected (401).

**Live-smoke-tested** with unconfigured PhonePe credentials: create-payment returns a typed `502 gateway_unconfigured` rather than crashing, the webhook correctly `401`s without Basic Auth, and status correctly `404`s for an unknown attempt.

**Honest gaps:** the PhonePe OAuth token fetch, create-order call and refund path have not been exercised against live merchant credentials (none configured in this environment); the refund endpoint path in particular should be confirmed against current PhonePe merchant docs before going live.

---

## 10. Operations

- **Local:** Django dev server on `:8000`, Vite on `:5173`, Redis for cache/channels/Celery.
- **Frontend deploy:** Vercel — `npm run build`, `dist/` output, SPA rewrites so client routes resolve. The build is gated by a custom `scripts/check-attribution.mjs` step that fails the build if third-party attribution is missing.
- **Backend deploy:** Dockerfile + docker-compose under `backend/deploy/`; Gunicorn/Daphne behind a proxy, WhiteNoise for static, `/healthz/` for load-balancer probes, Sentry for errors.
- **Scheduled work:** Celery Beat — webhook relay every 10s, PhonePe reconciliation every 120s; plus a `relay_webhooks --loop` management command as a scheduler-free fallback.
- **Auto-checkpoint bot:** a session Stop-hook (`scripts/autopush.sh`) that checkpoints and pushes to `origin/master`, with secret-scanning guards and a kill switch.

---

## 11. Scale of the work

| Metric | Value |
|---|---|
| Frontend TypeScript/TSX | **~27,900 lines** |
| Backend Python (apps + project) | **~14,400 lines** |
| Django apps | **16** |
| Database migrations | **52** |
| Zod contract schemas | **13** |
| React route surfaces | 30+ customer/partner/admin routes |
| Domain services | 30+ (`services/*.py` modules across apps) |
| Background jobs | Celery tasks for notifications, delivery, webhook relay, PhonePe reconciliation |
| Test suites | 14 pytest modules |

---

*Built end-to-end — product definition, data modelling, backend, frontend, payments, integration, and operations.*
