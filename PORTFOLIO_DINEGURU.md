# DineGuru — Multi-Tenant Restaurant Management & POS Platform

**A restaurant operating system: point-of-sale and billing, inventory, recipe costing,
procurement, tiered analytics, staff and rider management — plus a live control plane
over the restaurant's presence on the Saturdays delivery platform.**

Built as an async FastAPI modular monolith with a strict multi-tenant isolation model,
self-hosted authentication, and 25 hand-written Alembic migrations.

---

## 1. At a glance

| | |
|---|---|
| **What it is** | The software a restaurant actually runs on: take orders at the table, fire tickets to the kitchen, bill with GST, track stock, cost recipes to the gram, purchase from vendors, read analytics, manage staff and delivery riders. |
| **Tenancy** | Multi-tenant with the **restaurant** as the boundary; one owner can hold and switch between several restaurants. |
| **Backend** | **FastAPI** + **SQLAlchemy 2.0 (async)** + **PostgreSQL** + **Alembic**, ~13,100 lines of Python across 12 domain packages |
| **Frontend** | **React 18 + TypeScript + Vite**, ~22,200 lines of TS/TSX |
| **Auth** | **Self-hosted** — bcrypt password hashing + stateless JWT access tokens + opaque, hashed, rotating refresh tokens. No external identity provider. |
| **Access model** | Three roles (`owner` / `staff` / `rider`) over a `memberships` join table; every role gated at the API, not the UI |
| **API** | ~90 endpoints under `/api/v1/*`, plus a separate HMAC-authenticated internal provisioning surface |
| **Migrations** | **25** sequential Alembic revisions, single linear head |
| **Tests** | **299** backend tests (service-layer unit suites + real-Postgres integration suites) |
| **Deployment** | Render (backend) against a Neon PostgreSQL instance; migrations run automatically on deploy via both a Pre-Deploy command and a Docker entrypoint |

---

## 2. Product scope — what the app actually does

### 2.1 Point of sale & billing

- **Table-based or straight-billing** — configurable per restaurant (`requires_table`). With tables, staff pick a table first and the POS enforces **at most one open order per table** (partial unique index + a pre-check for a clean 409). Without tables, any number of concurrent walk-in bills may be open.
- **Draft → KOT → immutable** — items are added as *drafts* and are billable immediately; firing a **KOT** (Kitchen Order Ticket) assigns them to a ticket and makes them immutable. Drafts can be freely edited or deleted; fired items can only be soft-*cancelled*, with a reason.
- **Server-computed money, always.** Subtotal, discount, GST and total are recomputed from scratch on every mutation. The frontend never computes a total.
- **Discounts and extra charges** — flat or percentage discount (clamped so the taxable value can never go negative) and a single ad-hoc labelled extra charge (delivery/service fee). Both restricted to open orders.
- **Checkout** — CASH or UPI, with a split-payment schema in place. Checkout is **rejected server-side** if any active item is still an unfired draft, so a customer can never be billed for a dish the kitchen was never told to make.
- **Bill & KOT printing** — a client-side print pipeline (`useBillPrint`) plus a **Bill Designer** in Settings with a live preview built from the real `Order` type.

### 2.2 Pricing engine

```
line_total      = unit_price_snapshot × quantity                       [ROUND_HALF_UP, 2dp]
subtotal        = Σ line_total over ACTIVE items only
discount_amount = flat amount, or subtotal × pct/100   — clamped to ≤ subtotal
taxable_value   = subtotal − discount_amount
gst_amount      = taxable_value × gst_percentage_snapshot / 100
total           = taxable_value + gst_amount + extra_charge_amount
```

GST is computed **after** the discount (correct for Indian tax treatment); the extra charge is added **after** GST because it isn't itself a taxable line item in this model. The GST rate is snapshotted onto the order at creation, so changing the restaurant's rate never retroactively rewrites historical bills.

### 2.3 Inventory & stock

- Ingredients with category, unit, current stock, low-stock threshold, and a two-value price window (`last_price` / `prev_price`).
- **Race-free stock movement** — `POST /adjust-stock` issues a single `UPDATE … SET current_stock = current_stock + :delta` computed server-side under the row's write lock. A delta that would go negative is rejected as a typed `422`, not a raw 500.
- **Atomic batch adjustment** — the weekly stock-log screen posts every row as **one transaction**: all ingredient IDs are pre-validated up front, then one `UPDATE` per row inside a single uncommitted transaction, committed once. Any failure rolls back the *entire* batch. (This replaced a per-row HTTP loop where a mid-way failure left earlier rows committed and a retry double-counted stock.)
- **Warn-and-allow deletion** — `GET /ingredients/{id}/deletion-impact` returns the blast radius (every referencing recipe by name, plus the purchase-order count) so the confirm dialog shows real consequences. Deletion itself always succeeds as a soft delete; downstream recipe reads flag the line `ingredient_deleted` and keep costing off the frozen last-known price rather than 404-ing.
- **Append-only price history** — every one of the three price-write paths (manual update, batch adjust, vendor offer sync) also inserts an `ingredient_price_history` row in the same transaction, tagged with its source. This backs price-volatility analytics.

### 2.4 Recipe & costing

Recipes with portions, selling price, an active flag, ingredient lines and ordered prep steps (cooking method or custom label, minutes, intensity, position).

- **Unit conversion** — a shared `core/units.py` converts between compatible metric units (g/kg/mg, ml/l) and is used by both Recipes and Ingredients so the two can't drift.
- **Snapshot + live cost, side by side** — each line snapshots `cost_per_unit_snapshot` from the ingredient's price at add time (so costs don't silently drift), while `GET /recipes/{id}/cost` computes a **live** cost from current prices and shows both, with a divergence banner. `POST /cost/refresh` re-snapshots on demand.
- **Read-path resilience** — a unit change that makes an existing recipe line unconvertible logs a warning and falls back to the raw quantity rather than 400-ing the entire recipe list; and the *write* side now blocks such a unit change outright.
- **Recipe ↔ menu link** — a menu item can reference a recipe, but the recipe's selling price **deliberately never auto-writes** the menu price (that field is billing-critical). `POST /menu/{id}/sync-price-from-recipe` copies it on request, exposed as a one-click button.

### 2.5 Recipe-linked stock deduction

Firing a KOT deducts each fired item's recipe-ingredient quantities from stock **in the same transaction as the KOT**: quantities are unit-converted, multiplied by order quantity, and summed per ingredient across the whole batch (so two dishes sharing an ingredient deduct correctly). Ingredient rows are locked with `SELECT … FOR UPDATE`, so concurrent KOTs can't over-deduct.

Deduction is **clamped at zero, never blocking the KOT** — the kitchen already has the physical ticket, so a stock shortfall must not stop service. Clamped deductions log distinctly from full ones, so a chronically-clamped ingredient still reads as a clear low-stock signal.

### 2.6 Procurement

Vendors (contact, location, tags, notes), **ingredient–vendor offers** (unit cost, quality score, reliability score, `is_current`), and **purchase orders** with a forward-only `draft → sent → received` lifecycle.

- **One current supplier per ingredient**, enforced by a partial unique index; marking an offer current clears competitors and syncs the ingredient's price in the same transaction (the system's single deliberate cross-module write).
- **Receiving a PO credits stock** — every line's quantity is added to its ingredient in the same transaction as the status flip, unit-converted where compatible, falling back to the raw quantity with a logged warning rather than blocking the whole receipt over one line's unit mismatch.
- PO items can only be added/edited/removed while the PO is `draft`.

### 2.7 Analytics

A dedicated `/analytics/*` area with six deep-linkable tabs — **Menu Performance, Sales & Revenue, Inventory Insights, Staff, Reports, Portfolio** — sitting behind a feature-flag scaffold (`analyticsFeatures.ts` + `AnalyticsFeatureGate`) that maps every widget to a **Pro** or **Max** tier through one config function.

**Overview** stays deliberately lean: four KPI tiles, low-stock and reorder alerts, and a 14-day revenue trend.

| Endpoint | What it computes |
|---|---|
| `/dashboard/overview` | Revenue, order count, AOV, status breakdown, 30-day top sellers, low stock |
| `/dashboard/revenue-trend` | Day-bucketed revenue + paid order count |
| `/dashboard/category-breakdown` | Revenue + quantity per menu category |
| `/dashboard/payment-method-breakdown` | CASH vs UPI split |
| `/dashboard/cancellations` | Cancelled items + top cancel reasons |
| `/dashboard/staff-performance` | Revenue + orders per staff member |
| `/dashboard/menu-item-margin` | Per-item revenue vs live recipe cost, sorted worst-margin-first |
| `/dashboard/reorder-alerts` | Days-until-stockout, reconstructed from recipe-linked sales |
| `/dashboard/peak-hours` | Day-of-week × hour-of-day revenue grid |
| `/dashboard/table-turnover` | Avg `paid_at − created_at` + avg ticket value, day-bucketed |
| `/dashboard/slow-moving-items` | Lowest-selling available items (LEFT JOIN so zero-sale items appear) |
| `/dashboard/discount-impact` | Discounts + extra charges against subtotal |
| `/dashboard/staff-performance-trend` | Day-bucketed staff trend |
| `/dashboard/ingredient-price-volatility` | `stddev_samp`-based coefficient of variation over 90 days |
| `/dashboard/portfolio/overview` | Cross-restaurant combined totals + per-restaurant comparison |

Plus a client-composed **Menu Engineering Matrix** (Stars / Plowhorses / Puzzles / Dogs), **period-over-period comparison**, a **peak-hours heatmap**, and a printable **Daily Closing Report**.

All analytics are **live-aggregated at request time** — no rollup tables, no staleness. A shared `DateRangeParams` dependency gives every endpoint the same `?start_date=&end_date=` / `?days=N` shape; the two heuristic endpoints (reorder alerts, price volatility) deliberately use fixed lookback windows instead, because a near-zero range would produce divide-by-tiny blowups.

### 2.8 Staff, riders & team management

- **Shared STAFF login per restaurant**, owner-created, with a bcrypt-hashed owner-set password. One login screen, no self-registration — `memberships` resolves a login to exactly one restaurant and role. Revoking a staff member drops the membership, sets `is_active=False`, and revokes every outstanding refresh token; the user row is *kept*, because `Order.created_by_user_id` is `ON DELETE RESTRICT` and billing history must survive.
- **RIDER role** — owner-created delivery riders using the same auth machinery, routed at the app root into a **mobile-first `RiderApp`** that entirely bypasses the POS, restaurant switcher and approval flow.
- Riders see only their own assigned deliveries — scoped by `rider_id` with **no tamperable input at all** (no restaurant id, no order id) — projecting just the rider-relevant fields from the cached order payload: customer name, address, phone, special instructions, item lines, and a COD-vs-prepaid badge.
- **Handover OTP** — the rider enters the customer's 6-digit code at the door; correct completes the delivery, wrong is counted with lockout after 5 attempts. This surfaces the platform's *existing* OTP rather than introducing a second one.
- **Doorstep collection** — a "Collect via UPI/PhonePe" button opens a **platform** PhonePe QR (rendered client-side via `qrcode.react`) and polls until "Payment received". Funds land with the platform, not the restaurant, so commission and holds apply.

### 2.9 The Saturdays control plane

A dedicated `SaturdaysManagement` page lets a restaurant run its delivery-platform presence without leaving the POS: go online/offline, set prep time / minimum order / packing charge, edit weekly hours, toggle menu availability and price, publish the POS menu authoritatively, toggle auto-accept, and work the **live incoming-order inbox** — accept with an ETA, reject, advance status, manage delivery time, and assign a rider.

### 2.10 Platform admin console

A separate `/admin` area (super-admin allowlist, enforced server-side only) with a real approval workflow: pending queue, all-restaurants roster, approve/reject. Every new restaurant starts `pending_approval` and is genuinely unusable until approved — the tenant dependency `403`s on any non-active restaurant, so one status change is the entire gate.

---

## 3. Technology stack — complete

### 3.1 Backend

| Layer | Technology |
|---|---|
| Web framework | **FastAPI ≥ 0.111** (application-factory pattern) |
| ASGI server | **uvicorn[standard] ≥ 0.29** |
| ORM | **SQLAlchemy 2.0** — fully async, typed `Mapped[]` declarative models |
| DB driver | **asyncpg ≥ 0.29** |
| Database | **PostgreSQL** (Neon in production, Dockerised Postgres locally) |
| Migrations | **Alembic ≥ 1.13** — 25 sequential revisions, single linear head |
| Validation | **Pydantic v2** + **pydantic-settings** (`@lru_cache` singleton `Settings`) |
| Auth | **bcrypt ≥ 4.1** (with a SHA-256 pre-hash to dodge the 72-byte cap) + **PyJWT ≥ 2.8** |
| HTTP client | **httpx** — async, for the server-to-server Saturdays calls |
| Crypto | **cryptography** — Fernet encryption of the stored Saturdays API key at rest |
| Logging | **structlog ≥ 24.1**, per-environment configuration |
| Quality | pytest + pytest-asyncio + pytest-cov, **ruff** (E/F/I/UP/B/SIM), **mypy strict** with the SQLAlchemy and Pydantic plugins |
| Python | ≥ 3.11 |

### 3.2 Frontend

| Layer | Technology |
|---|---|
| Framework | **React 18.3.1** + **TypeScript** |
| Build | **Vite 6.3.5** + `@vitejs/plugin-react` |
| Styling | **Tailwind CSS 4.1.12** (`@tailwindcss/vite`), `tw-animate-css`, a token/theme CSS layer |
| Components | **Radix UI** primitives composed shadcn/ui-style into a 40-component local `components/ui` library (dialog, drawer, sheet, sidebar, command, calendar, chart, data table, form, carousel, resizable panels, …) |
| Additional UI | **MUI 7.3.5** + icons, Emotion, `vaul`, `cmdk`, `sonner`, `input-otp`, `embla-carousel`, `react-slick`, `react-responsive-masonry`, `canvas-confetti`, **lucide-react** (vector icons — an explicit convention, never emoji) |
| Animation | **motion 12.23** |
| Routing | **react-router 7.13** (`createBrowserRouter`, nested layouts, index redirects) |
| Charts | **Recharts 2.15** |
| Forms | **react-hook-form 7.55** |
| Drag & drop | `react-dnd` + HTML5 backend |
| QR | **qrcode.react** — the rider's doorstep payment QR |
| Theming | `next-themes` |
| Dates | `date-fns`, `react-day-picker` |

**Frontend architecture:** a single `fetchApi` in `lib/api.ts` is the **only** `fetch()` in the entire application. Every request in the app therefore passes through one place — which is what makes header injection (`X-Restaurant-Id`), the transparent `401 → refresh → retry` flow (with a single in-flight refresh), and the typed `ApiError` (carrying `.status` and `.code`) universally reliable rather than per-page discipline.

---

## 4. Architecture

### 4.1 Style and layout

A **modular monolith**: one FastAPI ASGI application, one PostgreSQL database, twelve self-contained domain packages sharing a session factory. Every package follows the same shape — `models.py`, `schemas.py`, `service.py`, `router.py` — with cross-domain access only through service-layer calls, never direct model imports in routers.

```
backend/app/
├── main.py         application factory: middleware, exception handlers, router registration
├── config.py       pydantic-settings singleton
├── database.py     AsyncEngine (pool_size=10, max_overflow=20, pool_pre_ping), sessionmaker, Base
├── dependencies.py get_db, get_current_user, get_active_restaurant_id, get_owned_restaurant_ids
├── exceptions.py   AppError hierarchy + handler registration
├── core/           auth · security · crypto · logging · mixins · enums · units · daterange · pagination
├── identity/       User, RefreshToken, PasswordResetToken; /auth/*
├── restaurants/    Restaurant, Membership; settings, staff and rider management
├── menu/           MenuItem CRUD, availability, recipe link, price sync
├── ingredients/    Ingredient, IngredientPriceHistory; stock + price engine
├── orders/         Order, OrderItem, Kot + order_service / pricing_service
├── recipes/        Recipe, RecipeIngredient, RecipeStep; costing engine
├── procurement/    Vendor, IngredientVendorOffer, PurchaseOrder, PurchaseOrderItem
├── dashboard/      read-only aggregation + a separate portfolio router
├── saturdays/      SaturdaysConnection, SaturdaysOrder; client, service, order ingest,
│                   owner router + HMAC internal router
├── rider/          rider-scoped deliveries, OTP verification, doorstep collection
├── admin/          super-admin approval queue
└── scripts/        set_password, backfill_memberships
```

### 4.2 Request lifecycle

```
Client  ──Authorization: Bearer <access JWT>──▶  FastAPI router (/api/v1)
  → CORSMiddleware
  → get_db()               new AsyncSession per request
  → get_current_user()     decode JWT by signature + expiry alone (no session store),
                           load User, reject is_active=False
  → get_active_restaurant_id()   resolve tenant scope from `memberships` — never from the token
  → optional require_owner / require_owner_dep / require_rider_dep
  → Service layer (all business logic; commits here)
  → SQLAlchemy async → asyncpg → PostgreSQL
  → ORM object → Pydantic .model_validate() → JSON
```

Router registration order matters and is explicit, because SQLAlchemy must resolve forward-referenced relationships (`"Vendor"`, `"PurchaseOrder"`) declared on `Restaurant` before the recipes package loads.

### 4.3 Authentication (self-hosted, built from primitives)

- **Access token** — stateless HS256 JWT, ~30 min TTL, verified by **signature alone**: no per-request session-store or network lookup, so the API scales horizontally.
- **Refresh token** — opaque secret, stored **SHA-256-hashed** in `refresh_tokens`, **single-use and rotated on every refresh**, revocable at logout, staff deactivation, and reuse detection.
- **Passwords** — bcrypt with a SHA-256 pre-hash. Plaintext is write-only: hashed immediately, never persisted, never returned, never logged.
- **Authorization is never trusted from the token.** Even with a live JWT, the user is re-loaded, `is_active` is re-checked, and tenant scope is re-resolved from the database on every single request.
- **No self-signup exists.** `POST /auth/register` was removed outright. An account exists only because Saturdays provisioned it.
- **Password reset** — token-based, single-use, 60-min TTL, invalidates prior tokens and revokes all sessions on use. Triggered by a platform admin, redeemed by the owner; the admin never sees a plaintext password.

The auth primitives (`core/auth.py`) depend only on config — no models, no dependencies — so there are no circular imports.

### 4.4 Multi-tenancy — the load-bearing invariant

The tenancy model is the most carefully-defended part of the system.

- **`memberships`** — a `(user_id, restaurant_id, role)` join table is the real source of authorization. One person can hold `owner` memberships on several restaurants; one restaurant can have `staff` and `rider` memberships.
- **`get_active_restaurant_id`** reads the `X-Restaurant-Id` header, validates that the caller actually holds a membership on it *and* that the restaurant is `active`, and `403`s otherwise — falling back to the primary restaurant when no header is sent. **`restaurant_id` is never accepted as a request parameter or body field, anywhere.**
- **`get_owned_restaurant_ids`** (portfolio analytics) resolves *every* restaurant where the caller holds an `owner`-role, `active`-status membership — again derived entirely server-side, never client-supplied.
- **Every query filters on `restaurant_id`** — including internal helpers that "should" be safe. All ~70 router call sites were migrated off the legacy `user.restaurant_id` pointer, and a **grep-gate test** (`test_active_restaurant.py`) fails the suite if any call site regresses.
- Because the frontend has exactly one `fetch()`, the header is injected in one place and no page can bypass it.

### 4.5 Authorization matrix

| Level | Mechanism |
|---|---|
| Authentication | JWT signature check + user reload + `is_active` gate |
| Tenant scope (single) | `get_active_restaurant_id` from memberships |
| Tenant scope (portfolio) | `get_owned_restaurant_ids` from owner-role memberships |
| Per-endpoint role gate | `require_owner(user)` inside specific mutations |
| Whole-router role gate | `require_owner_dep` on **Recipes, Procurement, Dashboard and Portfolio** — every endpoint, including reads |
| Rider gate | `require_rider_dep` on the rider workspace |

**What STAFF can reach:** POS/billing (unrestricted), the menu-availability toggle, menu and ingredient reads, active orders and bills. **What they can't:** recipes and costing, procurement and vendors, all dashboards and financials, ingredient writes, menu writes, restaurant settings, team management, add-restaurant.

### 4.6 Error handling

Every domain error subclasses `AppError` and maps to a uniform envelope:

```json
{ "error": { "code": "NOT_FOUND", "message": "Menu item 42 not found.", "detail": null } }
```

`NotFoundError`→404, `ConflictError`→409, `ValidationError`→422, `AuthenticationError`→401, `ForbiddenError`→403, plus a global `IntegrityError → 409` backstop so a lost constraint race surfaces as a clean conflict rather than a raw 500. Errors at `>= 500` are logged with a traceback; the rest aren't.

---

## 5. Data model

### 5.1 Core tables

| Table | Notes |
|---|---|
| `restaurants` | name, `gst_percentage`, GST + FSSAI numbers, `portal_online`, `requires_table`, `status` (`pending_approval`/`active`/`rejected`), `application_meta` JSON |
| `users` | name, unique lower-cased email (the login id), nullable `password_hash`, `is_active`, phone, role, `can_add_restaurants` paywall flag |
| `memberships` | `(user_id, restaurant_id)` unique + role — the authorization source of truth |
| `refresh_tokens` | hashed token, unique index, rotation + revocation |
| `password_reset_tokens` | single-use, TTL'd |
| `menu_items` | name, category, price, `available`, optional `recipe_id` (`ON DELETE SET NULL`) |
| `ingredients` | category, unit, `current_stock`, `low_stock_threshold`, `last_price`, `prev_price` |
| `ingredient_price_history` | append-only price snapshots tagged by source (`manual_update` / `batch_adjust` / `offer_sync`) |
| `orders` | table id, creator, status, full money breakdown, discount type/value/amount, `gst_percentage_snapshot`, extra charge + label, payment method, `paid_at` |
| `kots` | kitchen tickets — the immutability boundary for order items |
| `order_items` | `kot_id` (null = draft), `item_name_snapshot`, `unit_price_snapshot`, quantity, line total, status, cancel reason |
| `recipes` / `recipe_ingredients` / `recipe_steps` | portions, selling price, per-line `input_unit` + `cost_per_unit_snapshot`, ordered steps |
| `vendors` / `ingredient_vendor_offers` / `purchase_orders` / `purchase_order_items` | procurement chain, `is_current` supplier flag |
| `saturdays_connections` | one per restaurant: base URL, **Fernet-encrypted** API key, linked public id, webhook token + secret, menu sync/import timestamps |
| `saturdays_orders` | local cache of pushed delivery orders + `rider_id` (`ON DELETE SET NULL`) + `assigned_at` |

### 5.2 Design patterns enforced across the schema

- **Snapshot pattern** — anything billed (`item_name_snapshot`, `unit_price_snapshot`, `gst_percentage_snapshot`, `cost_per_unit_snapshot`) is copied at write time and never re-derived, so later price changes or renames can't retroactively corrupt history.
- **Soft delete + partial unique indexes** — every soft-deletable, name-unique table (`ingredients`, `menu_items`, `recipes`, `vendors`) carries a partial unique index `(restaurant_id, name) WHERE deleted_at IS NULL`, not a blanket constraint, so a name can be reused after deletion without a 409/500.
- **Referential integrity that means something** — `order_items.menu_item_id`, `recipe_ingredients.ingredient_id`, `purchase_order_items.ingredient_id` and `orders.created_by_user_id` are all `ON DELETE RESTRICT`; order/recipe children cascade.
- **Notable indexes** — `(restaurant_id, available)` for the POS grid; `(restaurant_id, table_id) WHERE status='open' AND table_id IS NOT NULL` for the one-open-order-per-table rule; `(ingredient_id) WHERE is_current = true` for one current supplier per ingredient; `(ingredient_id, recorded_at)` for the volatility query.

### 5.3 Migration history (25 revisions)

`0001` initial schema · `0002` menu · `0003` ingredients · `0004` orders · `0005` recipes · `0006` procurement · `0007` KOT + item cancellation *(also dropped five obsolete order columns outright)* · `0008` optional tables + stock integrity · `0009`–`0010` soft-delete uniqueness for recipes and vendors · `0011` missing menu index · `0012` `orders.updated_at` · `0013` discount + extra charge · `0014` multi-restaurant memberships · `0015` application meta · `0016` ingredient price history · `0017` split payment · `0018` Saturdays connection · `0019` Saturdays realtime · `0020` menu synced-at · `0021` order channel + external ref · `0022` self-hosted auth *(added `password_hash`/`is_active`, made email unique, dropped `firebase_uid`, created `refresh_tokens`)* · `0023` password-reset tokens · `0024` rider role + assignment · `0025` menu imported-at.

A notable catch during review: `alembic/env.py` was missing two model imports, so seven tables were invisible to autogenerate — the next `--autogenerate` would very likely have emitted `DROP TABLE` for all of them. Fixed, and verified with real before/after autogenerate diffs against a live database.

---

## 6. The Saturdays integration

DineGuru is the **control plane**; Saturdays is the consumer platform and the system of record for customer orders.

- **Outbound (DineGuru → Saturdays):** `client.py` (httpx) calls the API-key-authenticated `/api/dineguru/v1/*` surface for restaurant control, hours, menu availability/price, authoritative menu publish, order accept/reject/status, delivery-time management, rider doorstep collection, and OTP verification.
- **Inbound (Saturdays → DineGuru):** two HMAC-signed server-to-server surfaces mounted separately from the JWT-authenticated app — a **provisioning** endpoint that atomically creates restaurant + owner + membership + connection (idempotent, keyed on Saturdays' `public_id`, resyncing in place rather than duplicating), and a **real-time order webhook** routed by an opaque per-connection token and verified by HMAC signature.
- **The API key never reaches a browser.** It lives Fernet-encrypted on DineGuru's server and is never selected into any response schema — which also means no CORS changes are needed on Saturdays.
- **Local cache** — pushed orders are stored in `saturdays_orders` so the DineGuru order screen is instant and survives a missed poll; the rider view projects only rider-relevant fields out of that cached payload.
- The manual connect/disconnect endpoints still exist as a **support/recovery fallback** but are deliberately unreachable from the UI, which shows a read-only "Connected ✓ / Not linked yet" status.

---

## 7. Engineering decisions worth calling out

- **The backend is the source of truth for money, without exception.** Every total is recomputed server-side on every mutation; the frontend never computes or fabricates one.
- **Guards live where they can't be skipped.** The unfired-draft checkout block, the payment gate, the tenancy filter and the role checks are all in the service/dependency layer — the frontend guard is a convenience, the backend guard is the rule.
- **Degrade, don't raise, on read paths.** Unit-conversion failures, deleted-but-referenced ingredients, and un-costable recipes all degrade a single row (with a flag and a log line) rather than failing an entire list endpoint.
- **Clamp where blocking would be worse.** KOT stock deduction clamps at zero instead of rejecting — a deliberate divergence from `adjust_stock`'s reject-on-negative behaviour, because a kitchen ticket must never be blocked by a bookkeeping shortfall. The divergence is documented and logged distinctly.
- **Idempotency taken seriously.** Concurrent first-signup is handled with an explicit `IntegrityError` catch that re-fetches the winner's row and returns it, so both callers get an identical success — rather than one getting a 409 from an endpoint that promises idempotency.
- **Features get cut when they don't survive scrutiny.** Three planned "Max tier" analytics were dropped *before* being built, with the reasoning recorded: waste-by-recipe was actually a mislabelled stockout signal; scheduled reports required two pieces of infrastructure (a job scheduler and outbound email) that don't exist and would have been a feature in name only; "forecasting" reorder was an unscoped menu of options rather than a specification.
- **Documentation is a deliverable.** A 1,384-line `Architecture.md` engineering reference (module-by-module API tables, schemas, business logic, flows, dependency matrix, risk register, testing notes and an honest production-readiness assessment) is kept in sync in the same pass as the code, alongside a working-notes file with a dated changelog and an explicit open-items register.

---

## 8. Testing & verification

**299 backend tests**, split between service-layer unit suites with a mocked `AsyncSession` and integration suites against a **real PostgreSQL** instance:

`test_order_service` · `test_pricing_service` · `test_ingredient_service` · `test_recipe_service` · `test_procurement_service` · `test_dashboard_service` · `test_menu_service` · `test_restaurant_service` · `test_identity_service` · `test_rider` · `test_staff_access_control` · `test_daterange` · **`test_active_restaurant`** (the grep-gate that enforces the tenancy invariant) · integration: `test_saturdays_provision`, `test_saturdays_ingest`, `test_password_reset`.

Every new SQL query added during the analytics work was additionally **smoke-tested directly against real Postgres data** — `extract(dow/hour)`, the `paid_at − created_at` epoch calculation, the double-outer-join for slow-moving items and `stddev_samp` — because mocked tests structurally cannot catch invalid dialect-specific SQL.

**21 documented business invariants** are tracked explicitly (e.g. *"`discount_amount` never exceeds `subtotal` regardless of input"*, *"at most one OPEN order per table; tableless orders exempt"*, *"two concurrent stock adjustments both apply"*, *"checkout is rejected if any active item is an unfired draft"*).

**Known gaps, stated plainly:** no frontend test framework; no CI pipeline; `npm run build` is esbuild-only so there is no cross-file type-checking; migration `downgrade()` paths exist but have never been exercised.

---

## 9. Operations & deployment

- **Production:** Render serving a **Neon** PostgreSQL database. Migrations run automatically on deploy through **two layers** — a Render Pre-Deploy `alembic upgrade head` (aborts the deploy on failure) and an idempotent `entrypoint.sh` that runs the same command on every container start, so the safety net survives even on an instance tier without Pre-Deploy. `.gitattributes` forces LF so the entrypoint shebang survives a Windows checkout.
- **Local dev:** Docker Compose Postgres on port 5431 + uvicorn with reload; the compose `api` service is deliberately kept stopped because it bakes code in at build time.
- **Config:** `.env` via pydantic-settings — `DATABASE_URL`, `SECRET_KEY`, access/refresh TTLs, `CORS_ORIGINS`, `LOG_LEVEL`, `SUPER_ADMIN_EMAILS`, the Saturdays provisioning shared secret and base URLs. Docs endpoints are exposed conditionally on environment.
- **Observability:** structlog with per-environment formatting; every mutation emits a structured event (`order_opened`, `ingredient_stock_adjusted`, `kot_stock_deducted`, `kot_stock_deduction_clamped`, …).
- **Production-readiness is assessed honestly** in `Architecture.md` §22 as Done/Partial/Missing across observability, security, reliability, scalability, testing, deployment and compliance — a gap list rather than a checklist to feel good about.

---

## 10. Scale of the work

| Metric | Value |
|---|---|
| Backend Python | **~13,100 lines** |
| Frontend TypeScript/TSX | **~22,200 lines** |
| Domain packages | **12** (+ shared `core`) |
| Alembic migrations | **25**, single linear head |
| Backend tests | **299** |
| API endpoints | ~90 across identity, restaurant, menu, ingredients, orders, recipes, procurement, dashboard, Saturdays, rider and admin |
| Roles | 3 (`owner` / `staff` / `rider`) + platform super-admin |
| Analytics endpoints | **15** (incl. a separately-routed portfolio aggregator) |
| UI screens | POS/Billing, Inventory, Menu Availability, Recipes, Procurement, Bills, Overview, Settings, Saturdays, 6 Analytics tabs, RiderApp, 7 admin pages |
| Reusable UI components | 40-component Radix/shadcn library + 15 domain components |

---

*Built end-to-end — domain modelling, async backend, database design and migrations, authentication and multi-tenancy, the POS and analytics frontend, the rider application, and the cross-product integration.*
