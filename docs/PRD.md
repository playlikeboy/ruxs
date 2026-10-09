# RUXS MVP — Product Requirements Document

Oct 9, 2026 · @Shaswat Raj

> This file is the build spec for the whole app. Build the MVP exactly as written, then grow it into the full app (see `RUXS_STARTUP_OVERVIEW.md` for the long-term roadmap). Deviations need an explicit decision recorded here.

## 1. Overview

The RUXS MVP gives a tiffin or water vendor one web app that replaces their WhatsApp chats and paper khata. It covers a daily skip or confirm, a locked kitchen count at the cutoff, a driver run sheet, a ledger both sides can see, and one UPI bill each month.

- **Who pays:** the vendor, on a monthly plan. Their customers and delivery staff use RUXS for free.
- **Launch scope:** tiffin and 20L water only, 10–20 vendors in one dense cluster (HSR Layout, Bengaluru).
- **This build:** a fresh rebuild as one Next.js codebase on one Cloudflare Worker. The earlier prototype (23 tables, 48 routes) is retired. Its business rules carry over; its code does not.
- **North star:** deliveries per month that were completed, verified and paid, with no open dispute.

| Goal | Measure | MVP target |
| --- | --- | --- |
| Vendors run their day on RUXS | Vendors active 4+ days a week | 15 |
| Households stay on autopilot | Subscriptions active for 30 days | 500 |
| The kitchen count is right | Count at cutoff vs. meals delivered | > 95% match |
| Customers answer the poll | Daily poll response rate | > 65% |
| Bills are trusted | Invoices disputed | < 1% |
| Cash arrives fast | Invoices paid within 48 hours | > 70% |

**Not in the MVP:** a discovery marketplace, a native app, a delivery fleet, RUXS holding customer money, flatmate splitting, and any service other than tiffin and water.

## 2. Users and the daily loop

Four roles use RUXS, and only the vendor's people need an account. Households work in WhatsApp and get one private link for their khata and bills.

| Role | Device | Signs in with | Does |
| --- | --- | --- | --- |
| Vendor owner | Android phone, sometimes a laptop | Hexclave (Google or email code) | Sets products and cutoffs, adds customers, watches the count, sends bills, marks payments |
| Staff or driver | Android phone | Hexclave, invited by the owner | Opens today's run sheet, marks deliveries, records cans and dabbas |
| Household | WhatsApp | No account: a private link per customer | Taps Deliver, Skip or Extra; views khata and bills; pauses dates; pays by UPI |
| RUXS admin | Laptop | Hexclave + an admin allowlist | Approves and suspends vendors, fixes data |

### The daily loop (lunch tiffin example)

1. **8:30 AM:** each household with lunch today gets a WhatsApp poll with three buttons: Deliver, Skip, Extra.
2. **8:30–10:00:** taps arrive on the webhook and are saved as changes to the default. No tap means the default runs.
3. **10:00 cutoff:** RUXS writes the day's orders in one step. The vendor's Today screen locks the count, for example "84 meals: 72 regular, 12 Jain".
4. **After 10:00:** a skip is late. The order becomes a late skip and is charged by the vendor's rule (free, 50% or full).
5. **Noon:** the driver opens the run sheet, sorted society → tower → floor (top floor first) → flat. Skipped homes are not on it.
6. **At each door:** one tap marks the order delivered. The can stepper defaults to 1 out, 1 in.
7. **Each delivery** writes one khata entry and one can movement, so both sides see the same numbers.
8. **1st of the month, 10:00 AM:** each household gets one WhatsApp bill with a link and a UPI button. The vendor marks it paid when the money arrives.

### User stories

| ID | Story | Done when |
| --- | --- | --- |
| U1 | As a vendor, I set up my tiffin service in 15 minutes | Products, cutoff and UPI ID saved; the first poll is scheduled; pilot vendors finish in under 15 minutes |
| U2 | As a vendor, I add 80 customers from my notebook | Paste "name, phone, flat" lines or upload a CSV; bad rows are flagged inline; an opt-in message goes to each number |
| U3 | As a household, I skip lunch with one tap | Before cutoff: no charge, confirmation reply within 5 seconds. After cutoff: the reply states the late rule |
| U4 | As a vendor, I know exactly how much to cook | At cutoff the Today screen shows a locked count per product. Late skips change the charge, never the count |
| U5 | As a driver, I deliver without confusion | The run sheet lists only confirmed orders, in floor order; a tap retries on a weak connection until saved |
| U6 | As a driver, I record cans at the door | The stepper defaults to 1 out, 1 in; the customer's can balance updates at once |
| U7 | As a household, I trust my bill | The bill lists every day with its status and amount, and its total equals the khata balance |
| U8 | As a vendor, I get paid fast | Bills go out on the 1st at 10:00; the UPI link opens any UPI app with the amount filled in; marking paid takes one tap |
| U9 | As a household, I pause for a holiday | I pick a date range on my link; those days skip at no charge if set before each day's cutoff |
| U10 | As an admin, I approve vendors | A new vendor stays pending until approved; a suspended vendor's polls stop |

## 3. MVP scope

The MVP has 12 must-haves, and together they cover one full day and one full month for a tiffin or water vendor. Anything that doesn't serve that loop waits.

| Feature | Priority | Notes |
| --- | --- | --- |
| Vendor sign-in and onboarding | Must | Hexclave hosted sign-in; vendor name, area, UPI ID, slug |
| Products with poll time, cutoff and late-skip rule | Must | Variants such as Jain are separate products |
| Customer import | Must | Paste lines or CSV; phone normalised to +91 |
| Subscriptions | Must | Days of the week, default quantity, start date |
| Daily WhatsApp poll with Deliver / Skip / Extra | Must | Approved utility template; button replies |
| Cutoff lock and Today screen | Must | One big number per product; poll response progress |
| Run sheet | Must | Society → tower → floor (top first) → flat |
| Mark delivered and record cans | Must | Stepper defaults to 1 out, 1 in |
| Khata per customer | Must | Append-only ledger in paise |
| Monthly bill with UPI link; vendor marks paid | Must | No payment gateway in the MVP |
| Customer link page | Must | Khata, can balance, bills, pause dates |
| Public SEO pages | Must | Home, pricing, two vendor-type pages, city pages |
| Holiday pause for a date range | Should | From the customer link or by the vendor |
| Cutoff reminder 30 minutes before | Should | Only to households who haven't tapped |
| Platform admin | Should | Approve, suspend, view any vendor |
| Payment gateway and auto-reconcile | Later | Razorpay or Cashfree; UPI AutoPay |
| Hindi and Kannada message copy | Later | Templates per language |
| Household accounts and flatmate splitting | Later | Built early last time; held back now |
| Milk, newspaper and other services | Later | Same model, new product kinds |

## 4. Tech stack

RUXS is one Next.js 16 app, built with Bun and deployed as one Cloudflare Worker through the OpenNext adapter. It uses Neon Postgres behind Hyperdrive, Drizzle for queries and Hexclave for sign-in.

| Layer | Choice | Version on 9 Oct 2026 | Why this |
| --- | --- | --- | --- |
| Package manager, scripts | Bun | 1.3 | Fast installs and `bun test`. The app itself runs on workerd, not Bun |
| Scaffolding | create-cloudflare (C3) | 2.73 | `--framework=next --variant=opennext` sets up wrangler, OpenNext config and deploy scripts |
| Framework | Next.js App Router | 16.4 | Server Components, Server Actions, and built-in metadata, sitemap and OG image APIs for SEO |
| Cloudflare adapter | `@opennextjs/cloudflare` | 1.20 | Runs the real Next.js build on Workers. Supports Next ≥ 16.3.8, `after()`, `'use cache'`, ISR, Turbopack and image optimisation |
| Hosting | Cloudflare Workers + wrangler | 4.149 | Indian points of presence, cron triggers, custom domain ruxs.in |
| Database | Neon Postgres | — | Transactions and unique constraints for money; branches for previews and tests |
| DB connection | Cloudflare Hyperdrive + `pg` | — | Pooled connections from Workers. This is what both OpenNext and Neon recommend on Cloudflare |
| ORM, migrations | `drizzle-orm` + `drizzle-kit` | 0.45 / 0.31 | Typed SQL with no engine binary; plain SQL migrations kept in git |
| Auth | Hexclave (`@hexclave/next`) | 1.0.125 | Stack Auth under its new name: hosted sign-in pages, Google and email codes, a server and client SDK |
| Validation | Zod | 4.6 | One schema each for forms, actions, env and webhooks |
| UI | Tailwind CSS 4 + shadcn/ui | 4.3 / 4.21 | Design tokens in CSS; components copied into the repo so you own them |
| Messaging | WhatsApp Cloud API (Meta, direct) | — | Polls, replies and bills with no middleman markup |
| Tests | `bun test` + Playwright | — | Fast unit tests for the rules; end-to-end tests on the Workers preview |

**Why OpenNext and not vinext.** C3 now asks which adapter to use and defaults to vinext, Cloudflare's Vite rewrite of Next.js. The old prototype used vinext. RUXS picks OpenNext because it runs the actual Next.js build, so the SEO APIs, `next/image`, `after()` and `@hexclave/next` behave exactly as their docs say. The cost is slower builds than Vite. Revisit vinext once it supports everything this app uses.

**One limit to design around.** OpenNext does not yet support Node.js middleware, and Next 16's `proxy.ts` runs on Node.js. So RUXS ships with no proxy file, and every auth check lives in server code (section 9).

## 5. Architecture

Everything runs in one Worker from one codebase. Phones, Meta and the cron each have their own entry point, and all three funnel into the same rules and the same database.

There are three ways in, and all of them pass through `src/features`, so access checks and rules exist in exactly one place.

1. **A page or action:** browser → Worker → page or Server Action → access check in `features` → Drizzle → Hyperdrive → Neon.
2. **A poll tap:** Meta → `/api/webhooks/whatsapp` → verify signature → save the event (duplicates dropped) → write the day change → reply with `after()`.
3. **Every minute:** cron → `custom-worker.ts` → `/api/cron/tick` → send due polls, lock due cutoffs, send reminders, and on the 1st send bills. Every step is safe to repeat, so a missed or doubled tick does no harm.

**Scale.** At the Phase 3 target of 25,000 subscriptions, even if everyone taps within 30 minutes, that's about 14 writes a second, which a small Postgres handles easily. The first limit will be WhatsApp sending speed, not servers. When one tick has to send thousands of messages, sending moves onto Cloudflare Queues and nothing else changes.

## 6. Folder structure

The code is split into three layers. `app/` only routes, `features/` does the work for one business area, and `core/` holds the pure rules that decide money and counts. Each layer imports only from the layers below it.

```text
ruxs/
├─ src/
│  ├─ app/                          # ROUTING ONLY: thin pages that call features
│  │  ├─ (marketing)/               # public, static, indexed
│  │  │  ├─ layout.tsx              # header + footer, no auth, no client providers
│  │  │  ├─ page.tsx                # /
│  │  │  ├─ pricing/page.tsx
│  │  │  ├─ for/[type]/page.tsx     # /for/tiffin-services, /for/water-suppliers
│  │  │  ├─ in/[city]/page.tsx      # only cities we serve (generateStaticParams)
│  │  │  └─ (legal)/privacy, terms
│  │  ├─ (app)/                     # signed-in, dynamic, noindex
│  │  │  ├─ layout.tsx              # HexclaveProvider + requireUser()
│  │  │  ├─ onboarding/page.tsx
│  │  │  └─ app/[vendor]/           # /app/sharma-tiffin/...
│  │  │     ├─ layout.tsx           # requireVendorAccess(vendor) + bottom nav
│  │  │     ├─ today/  run/  customers/  products/  bills/  settings/
│  │  │     └─ loading.tsx  error.tsx
│  │  ├─ (customer)/c/[token]/      # household link pages, noindex
│  │  ├─ admin/                     # RUXS staff only
│  │  ├─ api/
│  │  │  ├─ webhooks/whatsapp/route.ts
│  │  │  └─ cron/tick/route.ts
│  │  ├─ layout.tsx                 # <html lang="en-IN">, fonts, metadataBase
│  │  ├─ globals.css                # Tailwind 4 @theme tokens
│  │  ├─ sitemap.ts  robots.ts  manifest.ts
│  │  ├─ opengraph-image.tsx  icon.tsx
│  │  └─ not-found.tsx  global-error.tsx
│  ├─ features/                     # ONE FOLDER PER BUSINESS AREA
│  │  ├─ vendors/  customers/  products/  subscriptions/
│  │  ├─ day-changes/  orders/  ledger/  assets/  billing/
│  │  └─ whatsapp/
│  │     ├─ queries.ts              # reads: "server-only", React cache()
│  │     ├─ actions.ts              # writes: "use server", zod, auth check
│  │     ├─ schemas.ts              # zod input schemas, shared with forms
│  │     └─ components/             # UI used only by this feature
│  ├─ core/                         # PURE RULES: no I/O, no imports from db or next
│  │  ├─ money.ts  cutoff.ts  ledger.ts  billing.ts  run-sheet.ts  upi.ts
│  │  └─ *.test.ts                  # bun test, the launch gates live here
│  ├─ db/
│  │  ├─ schema/                    # one file per table group
│  │  ├─ index.ts                   # getDb(): per-request client via Hyperdrive
│  │  ├─ migrations/                # generated by drizzle-kit, committed
│  │  └─ seed.ts                    # demo vendor in HSR Layout
│  ├─ lib/
│  │  ├─ auth/                      # hexclave.ts, session.ts (requireUser, requireVendorAccess)
│  │  ├─ env.ts                     # zod-checked env, fails fast
│  │  ├─ seo.ts                     # buildMetadata(), JSON-LD helpers
│  │  └─ utils.ts                   # cn(), dates in Asia/Kolkata
│  ├─ components/
│  │  ├─ ui/                        # shadcn primitives (Button, Sheet, Input...)
│  │  ├─ app-shell/                 # bottom nav, page header
│  │  └─ marketing/                 # hero, feature grid, FAQ
│  └─ config/
│     └─ site.ts                    # name, URL, cities, vendor types, plans
├─ custom-worker.ts                 # adds the cron handler to OpenNext's worker
├─ public/                          # static files, _headers
├─ e2e/                             # Playwright tests
├─ .agents/skills/  skills-lock.json  # installed agent skills (section 14)
├─ AGENTS.md  CLAUDE.md  DESIGN.md
├─ wrangler.jsonc  open-next.config.ts  next.config.ts
├─ drizzle.config.ts  components.json  cloudflare-env.d.ts
├─ .dev.vars  .env.example          # .dev.vars is gitignored
└─ .github/workflows/ci.yml
```

| Folder or file | What it is for | Rule |
| --- | --- | --- |
| `app/(marketing)` | Public pages Google indexes | No auth calls and no request APIs, so every page builds static |
| `app/(app)` | The vendor workspace | The tenant is in the URL (`/app/[vendor]`), so links are shareable and every page knows its vendor |
| `app/(customer)/c/[token]` | Household link pages | No account; the token is the access. Always `noindex` |
| `app/api` | Only what the outside world calls | Webhooks and the cron tick. Every in-app write is a Server Action |
| Route groups `( )` | Separate layouts without changing URLs | Marketing pages never load the auth provider or app JavaScript |
| `features/*/queries.ts` | All reads for one area | Starts with `import "server-only"` and takes `vendorId` from the session, never from the client |
| `features/*/actions.ts` | All writes for one area | Parses input with zod, checks access, writes, then revalidates |
| `core/` | Rules for money, cutoffs, bills and run order | Pure functions with full test coverage. Changing a rule never means touching a page |
| `db/` | Schema, client and migrations | The only place that imports `drizzle-orm` |
| `lib/` | Cross-cutting helpers | Small; nothing feature-specific |
| `components/ui` | shadcn primitives | Change style through tokens, not one-off classes |
| `config/site.ts` | Single source for site facts | Used by metadata, the sitemap and marketing copy |
| `custom-worker.ts` | The Worker entry point | Re-exports OpenNext's fetch handler and adds `scheduled` |
| `DESIGN.md` | Tokens and UI rules in words | Agents and humans read it before touching styles |

## 7. Data model

Twelve tables cover the MVP, down from 23 in the prototype. Every row except a user's own identity carries `vendor_id`, money is stored in integer paise, and the ledger only ever grows.

| Table | One row is | Key columns | Rule that matters |
| --- | --- | --- | --- |
| `vendors` | A tiffin kitchen or water depot | `slug`, `name`, `phone`, `upi_vpa`, `city`, `area`, `plan`, `status` (pending, active, suspended) | `slug` is unique and appears in the URL |
| `vendor_members` | A person's access to a vendor | `vendor_id`, `user_id` (Hexclave id), `role` (owner, staff, driver) | Primary key is (`vendor_id`, `user_id`). This table is what grants access |
| `customers` | A household of one vendor | `name`, `phone` (E.164), `society`, `tower`, `floor`, `flat`, `opted_in_at`, `link_token_hash` | Unique (`vendor_id`, `phone`). Only a hash of the link token is stored |
| `products` | Something sold on a schedule | `kind` (tiffin, water), `name`, `shift`, `price_paise`, `deposit_paise`, `asset_name`, `poll_at`, `cutoff_at`, `late_rule` (free, half, full, locked) | Times are local `time` values in Asia/Kolkata |
| `subscriptions` | A customer's standing order | `customer_id`, `product_id`, `qty`, `days` (weekday set), `starts_on`, `ends_on` | The default that runs when nobody taps |
| `day_changes` | A change for one date | `subscription_id`, `service_date`, `kind` (skip, extra, qty), `qty`, `source`, `received_at`, `is_late` | Unique (`subscription_id`, `service_date`); the latest change wins |
| `orders` | One delivery for one date and shift | `service_date`, `shift`, `qty`, `unit_price_paise`, `status` (confirmed, skipped, late\_skip, delivered, failed), `delivered_at`, `delivered_by` | Unique (`subscription_id`, `service_date`, `shift`). Written at cutoff; price frozen at that moment |
| `ledger_entries` | One money event | `customer_id`, `order_id`, `invoice_id`, `type` (delivery, late\_fee, deposit, deposit\_refund, payment, adjustment), `amount_paise` (signed), `idempotency_key`, `created_by` | Insert only: a database trigger blocks UPDATE and DELETE. `idempotency_key` is unique |
| `asset_movements` | Cans or dabbas changing hands | `customer_id`, `order_id`, `asset`, `delta` (+ given, − returned) | Balance = SUM(`delta`) |
| `invoices` | One customer's bill for one month | `period` (YYYY-MM), `number`, `opening_paise`, `charges_paise`, `payments_paise`, `closing_paise`, `status`, `sent_at`, `paid_at` | Unique (`vendor_id`, `customer_id`, `period`). Totals are computed from the ledger, never typed |
| `messages` | A WhatsApp message RUXS sent | `customer_id`, `template`, `wa_message_id`, `context` (e.g. poll for subscription + date), `status` | Lets a button reply be matched to the poll it answers |
| `webhook_events` | A raw inbound event | `provider`, `external_id`, `payload` (jsonb), `received_at`, `processed_at`, `error` | Unique (`provider`, `external_id`), so a retried webhook is ignored |

**Sign convention.** A positive amount means the household owes more; a payment is negative. A customer's balance is `SUM(amount_paise)`, and the bill's closing total must equal it.

**Types.** Use `integer` paise (fine up to ₹2.1 crore per row), `date` for service dates, `timestamptz` for events, and `text` plus a check constraint for enums. Drizzle infers TypeScript types from the schema, so there are no hand-written model types.

## 8. Routes

There are 20 pages and two API routes. Public pages are static and indexed, app pages are dynamic and hidden from search, and every in-app write is a Server Action instead of an API route.

| Path | Who | Rendering | What it shows |
| --- | --- | --- | --- |
| `/` | Public | Static | Landing page for vendors |
| `/pricing` | Public | Static | Free, ₹499 and ₹1,499 plans + FAQ |
| `/for/tiffin-services`, `/for/water-suppliers` | Public | Static | One page per vendor type |
| `/in/[city]` | Public | Static, pre-built per city | Only cities RUXS actually serves, with real local detail |
| `/privacy`, `/terms` | Public | Static | Includes the DPDP Act notice |
| Sign-in | Public | Hexclave hosted page | Returns to `/app` |
| `/onboarding` | Signed in, no vendor yet | Dynamic | Create a vendor: name, area, UPI ID |
| `/app` | Signed in | Dynamic | Redirects to your vendor, or a picker if you have more than one |
| `/app/[vendor]/today` | Owner, staff | Dynamic | The count, poll progress and a cutoff countdown |
| `/app/[vendor]/run` | Driver, owner | Dynamic | Today's run sheet |
| `/app/[vendor]/customers` (+ `/new`, `/[id]`) | Owner | Dynamic | List, import, one customer's khata and cans |
| `/app/[vendor]/products` | Owner | Dynamic | Products, poll and cutoff times, late rule |
| `/app/[vendor]/bills` | Owner | Dynamic | This month's bills; mark paid |
| `/app/[vendor]/settings` | Owner | Dynamic | UPI ID, staff invites, plan |
| `/c/[token]` | Household (link) | Dynamic, noindex | Khata, can balance, pause dates |
| `/c/[token]/bills/[month]` | Household (link) | Dynamic, noindex | Itemised bill + UPI button |
| `/admin` | RUXS admin | Dynamic | Pending vendors, suspend, look up any vendor |
| `GET` + `POST /api/webhooks/whatsapp` | Meta | Route handler | Verify handshake; button taps and delivery status |
| `POST /api/cron/tick` | `custom-worker.ts` only | Route handler | Sends due polls, locks due cutoffs, sends reminders and monthly bills |

**Built-in files:** `sitemap.ts` → `/sitemap.xml`, `robots.ts` → `/robots.txt`, `manifest.ts` → `/manifest.webmanifest`, and `opengraph-image.tsx` for share cards.

**Server Actions (all writes):** `createVendor`, `saveProduct`, `importCustomers`, `saveSubscription`, `inviteStaff`, `markDelivered`, `recordCans`, `markPaid`, `addAdjustment`, and `pauseDates` (from the customer link, authorised by its token).

## 9. Auth, roles and tenant isolation

Hexclave answers "who is this person", and RUXS's own `vendor_members` table answers "what can they touch". Every read and write checks both in server code, because there is no middleware layer to lean on.

**Setup.** This follows the pattern the prototype already ran in production. The SDK reads `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID`, `NEXT_PUBLIC_HEXCLAVE_API_URL` and `HEXCLAVE_SECRET_SERVER_KEY` from the environment.

```ts
// src/lib/auth/hexclave.ts
import "server-only";
import { HexclaveClientApp, HexclaveServerApp } from "@hexclave/next";

const client = new HexclaveClientApp({
  tokenStore: "nextjs-cookie",
  urls: { default: { type: "hosted" }, afterSignIn: "/app", afterSignOut: "/" },
});

export const hexclave = new HexclaveServerApp({ inheritsFrom: client });
```

```ts
// src/lib/auth/session.ts
import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";

export const requireUser = cache(() => hexclave.getUser({ or: "redirect" }));

export const requireVendorAccess = cache(async (slug: string, roles: Role[] = ALL_ROLES) => {
  const user = await requireUser();
  const m = await findMembership(user.id, slug); // vendor_members join vendors
  if (!m || !roles.includes(m.role) || m.vendorStatus === "suspended") notFound();
  return { user, vendorId: m.vendorId, role: m.role };
});
```

| Who | How they get in | What they can reach |
| --- | --- | --- |
| Owner | Hexclave sign-in, then creates a vendor in `/onboarding` | Everything under `/app/[vendor]` |
| Staff or driver | Owner invites by email; first sign-in links the invite to `vendor_members` | `today` and `run` only |
| Household | Private link `/c/[token]` sent on WhatsApp | Their own khata, bills and pauses; nothing else |
| RUXS admin | Hexclave sign-in + user id in the `ADMIN_USER_IDS` allowlist | `/admin` |

**Rules every PR follows.**

1. A layout's check is only for the user experience. Every query and action calls `requireVendorAccess()` again.
2. `vendorId` always comes from `requireVendorAccess()`, never from a form field, URL query or request body.
3. Every query in `features/*/queries.ts` filters by `vendor_id`. A test signs in as vendor A and must get "not found" for vendor B's pages and actions.
4. Link tokens are 32 random bytes, and only their SHA-256 hash is stored. The vendor can reset a household's link in one tap.
5. Return `notFound()`, not "forbidden", so URLs don't reveal which vendors exist.

**Why not Hexclave Teams for roles?** Keeping membership in Postgres puts the access check in the same query as the data. That's one round trip, and the check can be tested with the rest of the schema. Hexclave Teams can replace it later if vendors need many staff with fine-grained permissions.

**Hexclave provider placement.** `HexclaveProvider` wraps only the `(app)` layout. Marketing pages never load the auth client, which keeps them static and light.

## 10. Core business rules

Six rules decide money and counts. Each lives in `src/core` as a pure function with tests, so it can't drift between the webhook, the cron and the screens.

**1. Late or not is decided by the tap's own time.** A change is late when its time is after the cutoff on that service date in Asia/Kolkata. The time is Meta's message timestamp, or the server receive time if that's missing, never the time the cron ran. A tap at 10:00:01 against a 10:00:00 cutoff is late.

```ts
// src/core/cutoff.ts
export const isLate = (tapAt: Date, serviceDate: string, cutoffAt: string) =>
  tapAt.getTime() > istDateTime(serviceDate, cutoffAt).getTime();
```

**2. Before the cutoff, store only changes.** Skips and extras go into `day_changes`, and the latest change per date wins. Nothing is written for households who do nothing.

**3. At the cutoff, write orders in one statement.** The cron tick finds products whose cutoff has passed and runs one `INSERT … SELECT` per product. It joins today's active subscriptions with that day's changes and adds `ON CONFLICT DO NOTHING`, so a re-run changes nothing. The price is copied onto the order at that moment, so a later price change never rewrites history. The kitchen count is `SUM(qty)` of confirmed orders.

**4. Late skips keep the count and change the charge.** A late skip turns a confirmed order into `late_skip`, and the ledger gets the charge from the product's rule: free = ₹0, half = 50%, full = 100%, locked = refused, with a reply saying so.

**5. The ledger is insert-only.** Each event writes one entry with a deterministic `idempotency_key`, so repeating a call does nothing:

| Event | Entry type | Amount | Key |
| --- | --- | --- | --- |
| Order delivered | `delivery` | + qty × unit price | `order:{id}:delivery` |
| Late skip | `late_fee` | + rule × qty × unit price | `order:{id}:late` |
| First can given | `deposit` | + deposit | `cust:{id}:deposit:{asset}` |
| Vendor marks paid | `payment` | − amount paid | `invoice:{id}:pay:{n}` |
| Correction | `adjustment` | ± any, with a required note | `adj:{uuid}` |

Mistakes are fixed with a new entry that reverses them, never with an edit. Balance = `SUM(amount_paise)`.

**6. Bills are computed from the ledger, never typed.** On the 1st at 10:00, each bill is: opening balance (before the month) + charges in the month − payments in the month = closing balance. The closing balance must equal the khata balance at that moment, and a test enforces it. The WhatsApp bill links to `/c/[token]/bills/[month]` with a UPI deep link: `upi://pay?pa={vendor VPA}&pn={vendor name}&am={rupees}&cu=INR&tn={bill number}`. RUXS never touches the money.

### Order states

`confirmed` (default at cutoff) → `delivered` or `failed`. `skipped` comes from a skip before the cutoff. `late_skip` comes from a skip after it. Disputes are handled by the vendor with an `adjustment` entry in the MVP; a formal dispute flow comes later.

### Idempotency everywhere

- **Inbound:** `webhook_events` is unique on (`provider`, `external_id`), so Meta's retries are dropped.
- **Scheduled work:** each tick step is safe to repeat. Polls are recorded in `messages` with a unique (`subscription`, `date`, `template`) context, so no household gets two polls.
- **Money:** every ledger insert carries its idempotency key.
- **The test:** run 100 simulated skips, then replay every webhook and tick twice. The ledger must be identical.

## 11. SEO plan

SEO targets vendors, not households: people searching for software to run a tiffin or water business in Indian cities. That means a few fast, static, honest pages with real local detail, not hundreds of thin auto-generated ones.

### Pages and the searches they target

| Page | Target searches (examples) |
| --- | --- |
| `/` | tiffin service software, subscription delivery app India |
| `/for/tiffin-services` | tiffin service management app, mess management software, tiffin khata app |
| `/for/water-suppliers` | water can delivery app, 20 litre water jar delivery software |
| `/pricing` | tiffin software price, free tiffin app |
| `/in/[city]` | tiffin service software Bengaluru (only for cities with live vendors) |

Later: guides such as "How to stop tiffin food waste with a cutoff time", Hindi pages with `hreflang` (`en-IN`, `hi-IN`), and opt-in public vendor pages with `LocalBusiness` data.

### Technical checklist

- [ ] `metadataBase` = `https://ruxs.in`; title template `%s · RUXS`; a unique title (under 60 characters) and description (under 155) per page, built by `lib/seo.ts`
- [ ] `alternates.canonical` on every public page; `www` permanently redirects to the apex domain
- [ ] `robots.ts`: allow `/`; disallow `/app`, `/c/`, `/admin`, `/api`, `/onboarding`
- [ ] `robots: { index: false }` in the `(app)` and `(customer)` layouts, plus an `X-Robots-Tag: noindex` header on `/c/*`
- [ ] `sitemap.ts` lists public pages only, built from `config/site.ts`, with real `lastModified` dates
- [ ] JSON-LD: `Organization` + `WebSite` on `/`; `SoftwareApplication` with `Offer` (INR 0, 499, 1499) on `/pricing`; `BreadcrumbList` on nested pages; `FAQPage` where there is a visible FAQ
- [ ] Open Graph and Twitter cards from `opengraph-image.tsx` (1200 × 630). Check it renders on the Workers preview, and fall back to a static PNG if not
- [ ] `<html lang="en-IN">`; one `h1` per page; descriptive link text; `alt` on every image
- [ ] No fake ratings, review counts or customer logos. Add `AggregateRating` only once real reviews exist
- [ ] Google Search Console and Bing Webmaster verified on day one; submit the sitemap

### Speed budget (mobile, Moto G-class phone on 4G)

| Metric | Budget on marketing pages |
| --- | --- |
| Largest Contentful Paint | < 2.0 s |
| Interaction to Next Paint | < 200 ms |
| Cumulative Layout Shift | < 0.05 |
| JavaScript on the landing page | < 70 KB gzipped |
| Lighthouse SEO / Accessibility / Performance | 100 / ≥ 95 / ≥ 90 |

How to hit it: marketing pages are Server Components with no client providers, fonts load through `next/font` (self-hosted, `display: swap`), images go through `next/image` on the Cloudflare Images binding the template already includes, and no third-party scripts run before consent.

## 12. Design system and UI/UX

The system is deliberately small: one background, one ink colour, one accent and one typeface. Every vendor screen answers a single question, with one big number or one list. All of it is written into `DESIGN.md` and the `@theme` block in `globals.css`.

### Principles

1. **One screen, one job.** Today answers "how many to cook". Run answers "which door next". Bills answer "who still owes".
2. **Thumb first.** Main actions sit in the bottom 40% of the screen. Touch targets are at least 48 px, and the bottom nav has at most 4 items.
3. **Numbers you can read across a kitchen.** The count is 48 px with tabular figures. Money always shows as ₹ with Indian grouping (₹1,23,450) via `Intl.NumberFormat("en-IN")`.
4. **Status in words and colour.** Every state has a label (Delivered, Skipped, Late) as well as a colour.
5. **Built for a ₹8,000 Android on patchy 4G.** Skeletons instead of spinners, optimistic taps that retry, and no layout shift.
6. **Plain words.** "Skip today", not "Cancel fulfillment". English first; Hindi copy comes after the MVP.
7. **No decoration in the app.** Illustration and photography belong on marketing pages only.

### Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#FAFAF7` | Page background |
| `--surface` | `#FFFFFF` | Cards, sheets, inputs |
| `--ink` | `#1C1B19` | Main text |
| `--muted` | `#6B6862` | Secondary text |
| `--line` | `#E7E5DF` | Borders and dividers (no shadows except the bottom sheet) |
| `--accent` | `#BD4B2A` | RUXS coral: primary buttons, links, the one thing to tap. About 5:1 on white |
| `--good` | `#2F7D4F` | Delivered, paid |
| `--warn` | `#9A5B00` | Waiting, due soon |
| `--bad` | `#B42318` | Failed, late, overdue |
| Type | Geist via `next/font`, 16 px body | Sizes 12 / 14 / 16 / 20 / 28 / 48; inputs never below 16 px, so iOS doesn't zoom |
| Space | 4 px base | 4, 8, 12, 16, 24, 32, 48 |
| Radius | 10 px controls, 12 px cards | Pills fully rounded |
| Motion | 150 ms ease-out | Off under `prefers-reduced-motion` |

Dark mode tokens can be added later. The MVP ships light only, because vendors use it in bright kitchens and at doorsteps.

### Components

- **From shadcn/ui:** Button, Input, Select, Sheet (used as a bottom sheet on phones), Dialog, Tabs, Badge, Table, Skeleton and Sonner toasts.
- **RUXS-specific:**
  - `BigCount`: product name and locked count, with a "locked at 10:00" note
  - `CutoffTimer`: a countdown that turns warn 30 minutes before
  - `PollProgress`: "58 of 80 replied"
  - `StopCard`: flat, name, items and a one-tap Delivered button
  - `QtyStepper`: large − / + controls for cans and extras
  - `MoneyText`: formats paise as rupees
  - `StatusPill`: a word plus a colour
  - `LedgerRow`: one khata line
  - `EmptyState`: one sentence and one action

### Key screens

| Screen | Layout |
| --- | --- |
| Today | Cutoff timer on top, one `BigCount` card per product, poll progress, then the list of changes since yesterday |
| Run | Sticky header with stops left; stops grouped by society → tower → floor; the next stop is expanded; Delivered sits at thumb height |
| Customer (vendor view) | Balance and cans at the top, then the khata as a timeline, newest first; "Add adjustment" in a bottom sheet |
| Customer link | Vendor name, this month's total and a Pay by UPI button, a calendar of the month's days, and a Pause dates button |
| Landing | Headline, one sentence and a WhatsApp poll mockup; three pains → three fixes; pricing preview; FAQ |

### Accessibility

Target WCAG 2.2 AA. That means visible focus rings, a label on every input, an accessible name on every icon button, inline form errors linked with `aria-describedby`, and never colour alone. Test with TalkBack on Android before the pilot.

## 13. Next.js practices for this repo

These are the rules a reviewer checks on every PR, and the same rules go into `AGENTS.md` so coding agents follow them too.

| Area | Do | Don't |
| --- | --- | --- |
| Components | Server Components by default; `"use client"` only on small interactive leaves (stepper, timer, form) | Put `"use client"` on a `page.tsx` or `layout.tsx` |
| Reads | Call `features/*/queries.ts` from Server Components; wrap per-request helpers in React `cache()` | Fetch your own API routes from the server |
| Writes | Server Actions with `useActionState`; zod parse → `requireVendorAccess()` → write → `revalidatePath()` | Add an API route for something only the app calls |
| Auth | Check in queries and actions (the data access layer) | Rely on a layout check, or add `proxy.ts` (OpenNext can't run it) |
| Request APIs | `await params`, `await searchParams`, `await cookies()`, `await headers()` | Read them synchronously (removed in Next 16) |
| Rendering | Marketing pages stay static (no request APIs; `generateStaticParams` for `/in/[city]`); app pages are dynamic | Call `cookies()` in a marketing layout, which makes every page dynamic |
| After the response | `after()` for work the user shouldn't wait on, such as the WhatsApp reply after a tap | Block a webhook response on an outbound call |
| Loading and errors | `loading.tsx` skeletons and `error.tsx` per app segment; `<Suspense>` around slow parts | Use full-page spinners |
| Optimistic UI | `useOptimistic` on Delivered taps and steppers, with retry on failure | Wait for the round trip before the button changes |
| Database | `getDb()` per request (`maxUses: 1`), as OpenNext's guide says | Keep a global pool, which breaks on Workers |
| Env | `lib/env.ts` validates with zod at startup; `NEXT_PUBLIC_*` only for values safe in the browser | Read `process.env.X` all over the code |
| Imports | `@/` alias; `import "server-only"` in server modules; direct imports | Use barrel `index.ts` files, which bloat client bundles |
| Types | `strict`, `noUncheckedIndexedAccess`; Drizzle-inferred row types; zod at every boundary | Use `any`, or hand-written copies of table types |
| Images and fonts | `next/image` with sizes; `next/font` | Use raw `<img>`, or a Google Fonts `<link>` |
| Caching | MVP: default rendering plus `revalidatePath`. Later: adopt Cache Components (`'use cache'`, which OpenNext supports) with Next's own adoption skill | Cache anything that shows money without a clear revalidation path |
| Lint and format | ESLint flat config (`eslint .`, since `next lint` is gone in Next 16) + Prettier with the Tailwind plugin; `tsc --noEmit` in CI | Merge with type errors |

**Webhook route shape (the pattern every route handler follows):**

```ts
// src/app/api/webhooks/whatsapp/route.ts
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new Response(null, { status: 401 });
  }
  const events = parseWhatsApp(raw);              // zod
  for (const e of events) await recordAndApply(e); // unique external_id → duplicates skipped
  after(() => sendRepliesFor(events));             // the reply goes out after the 200
  return new Response(null, { status: 200 });
}
```

## 14. AI agent setup

The repo carries its own rules (`AGENTS.md`) and 16 installed skills plus Hexclave's fetched skill, so Claude Code, Cursor or Antigravity build to this PRD without being re-told.

### Rules files

- **`AGENTS.md`**: the RUXS rules. It covers the folder map (section 6), the do/don't table (section 13), the six business rules (section 10), the commands, and three hard lines: money in paise, never update a ledger row, and `vendorId` only from the session.
- **`CLAUDE.md`**: one line, `@AGENTS.md`, so Claude Code reads the same rules.
- **`DESIGN.md`**: the tokens and principles from section 12.
- **Next.js's own rules:** from 16.3, `next dev` writes framework guidance into `AGENTS.md` / `CLAUDE.md` and ships its docs in `next/dist/docs/`. Keep the RUXS rules under their own heading, and check the diff after the first `next dev`.

### Skills to install

| Skill | Source | What it's for in RUXS |
| --- | --- | --- |
| Hexclave | `skill.hexclave.com` (fetched, not installed) | Up-to-date Hexclave setup and APIs. `AGENTS.md` tells agents to fetch it before touching auth |
| `react-best-practices` | `vercel-labs/agent-skills` | Vercel's React and Next.js performance rules |
| `composition-patterns` | `vercel-labs/agent-skills` | Clean component APIs for the design system |
| `web-design-guidelines` | `vercel-labs/agent-skills` | UI and UX review against web interface guidelines |
| `next-dev-loop` | `vercel/next.js` | Checks a change in the running app, not just that it compiles |
| `next-bundle-optimizer` | `vercel/next.js` | Keeps marketing-page JavaScript under budget |
| `wrangler` | `cloudflare/skills` | Wrangler config, previews, secrets, deploys |
| `workers-best-practices` | `cloudflare/skills` | Production rules for Workers |
| `web-perf` | `cloudflare/skills` | Core Web Vitals and Lighthouse audits |
| `neon-postgres` | `neondatabase/agent-skills` | Neon connections and migrations; it also says to use `node-postgres` with Hyperdrive on Cloudflare, which matches this plan |
| `neon-postgres-branches` | `neondatabase/agent-skills` | Database branches for CI and previews |
| `shadcn` | `shadcn-ui/ui` | Adding and styling shadcn components; applies `DESIGN.md` |
| `seo`, `accessibility`, `core-web-vitals` | `addyosmani/web-quality-skills` | Audits behind the SEO and accessibility targets |
| `frontend-design` | `anthropics/skills` | Deliberate visual choices instead of template defaults |
| `webapp-testing` | `anthropics/skills` | Playwright checks of real flows |

```bash
bunx skills add vercel-labs/agent-skills --skill react-best-practices
bunx skills add vercel-labs/agent-skills --skill composition-patterns
bunx skills add vercel-labs/agent-skills --skill web-design-guidelines
bunx skills add vercel/next.js --skill next-dev-loop
bunx skills add vercel/next.js --skill next-bundle-optimizer
bunx skills add cloudflare/skills --skill wrangler
bunx skills add cloudflare/skills --skill workers-best-practices
bunx skills add cloudflare/skills --skill web-perf
bunx skills add neondatabase/agent-skills --skill neon-postgres
bunx skills add neondatabase/agent-skills --skill neon-postgres-branches
bunx skills add shadcn-ui/ui --skill shadcn
bunx skills add addyosmani/web-quality-skills --skill seo
bunx skills add addyosmani/web-quality-skills --skill accessibility
bunx skills add addyosmani/web-quality-skills --skill core-web-vitals
bunx skills add anthropics/skills --skill frontend-design
bunx skills add anthropics/skills --skill webapp-testing
```

Commit `.agents/skills/` and `skills-lock.json`, as the prototype did.

**Do not install `cloudflare/skills` → `nextjs-on-cloudflare`.** It tells agents to use vinext for new projects, so an agent following it would try to migrate this OpenNext app. Also skip Next's `next-cache-components-*` skills until Phase 2.

## 15. Security, privacy and secrets

The biggest risks are leaked keys, one vendor seeing another's data, and edited money. Each one gets a specific control.

| Risk | Control |
| --- | --- |
| Leaked secrets | Secrets live only in `.dev.vars` (gitignored) and `wrangler secret put`; CI reads GitHub Actions secrets. Nothing secret is ever prefixed `NEXT_PUBLIC_`. **The Hexclave server key shared in chat on 9 Oct 2026 must be rotated before first deploy.** |
| Fake webhooks | Check `X-Hub-Signature-256` (HMAC-SHA256 of the raw body with the Meta app secret) using a constant-time compare; answer the `GET` handshake only with the right verify token |
| Anyone calling the cron | `/api/cron/tick` requires `Authorization: Bearer $CRON_SECRET`, which only `custom-worker.ts` sends |
| Cross-vendor access | `requireVendorAccess()` on every query and action; `vendorId` only from the session; a cross-tenant test suite in CI |
| Edited money | A database trigger blocks UPDATE and DELETE on `ledger_entries`; corrections are new entries with a required note and `created_by` |
| Guessable customer links | 32-byte random tokens, stored as SHA-256 hashes; `noindex` and `Referrer-Policy: no-referrer` on `/c/*`; vendor can reset a link |
| Abuse and floods | Cloudflare rate-limiting rules on `/api/webhooks/*` and the customer link actions |
| Browser attacks | Security headers in `next.config.ts` (CSP allowing Hexclave's API domain, HSTS, `X-Content-Type-Options`, `frame-ancestors 'self'`), carried over from the prototype |
| Data loss | Neon point-in-time restore on a paid plan before the pilot; migrations reviewed in PRs and run before deploy |

**Privacy (DPDP Act 2023).** RUXS collects only name, phone and flat address, for one purpose: delivering and billing the household's subscription. WhatsApp opt-in is recorded with a timestamp, and the vendor tells households how their data is used. A privacy notice is on `/privacy`. Export and deletion requests are handled by an admin action in the MVP. Drivers see addresses only for today's run, and phone numbers are never shown on public pages.

## 16. Testing and quality gates

Nothing ships unless the four launch gates pass as automated tests. Most tests hit the pure rules in `src/core`, where they run in milliseconds.

| Level | Tool | Covers | Runs |
| --- | --- | --- | --- |
| Unit | `bun test` | `src/core`: lateness, order snapshot, charges, bill maths, run order, UPI link, money formatting | Every push |
| Integration | `bun test` against a Neon branch | Queries and actions on real Postgres: idempotency, ledger trigger, cross-tenant denial | Every PR, on a fresh branch from `main` |
| End to end | Playwright on `bun run preview` (workerd) | Vendor onboarding → import → simulated poll taps → cutoff → run sheet → delivered → bill | Every PR |
| Quality | Lighthouse CI | Marketing pages against the section 11 budget | Every PR |

### Launch gates (from the startup overview)

- [ ] 100 simulated skips produce zero double charges
- [ ] A skip at 10:00:01 is late when the cutoff is 10:00:00
- [ ] Replaying every webhook and every cron tick twice leaves the database unchanged
- [ ] A bill's closing balance equals the khata balance for every test customer (this replaces the overview's UPI-clearing gate until a payment gateway exists)

### CI pipeline (`.github/workflows/ci.yml`)

1. Install with Bun, then run `tsc --noEmit`, `eslint .` and `bun test` (unit).
2. Create a Neon branch, run migrations, and run the integration tests.
3. Run `opennextjs-cloudflare build`, then Playwright and Lighthouse against the preview.
4. **On `main` only:** run `drizzle-kit migrate` against production, then `opennextjs-cloudflare deploy`.
5. Delete the Neon branch.

Migrations must be additive (add a column, backfill, then switch), so the old Worker keeps working while the new one rolls out.

## 17. Delivery plan

The plan is six one-week steps from an empty repo to three real vendors, starting Monday 12 Oct and ending with a pilot week of 16–20 Nov.

Each week ends with something deployed to ruxs.in. The WhatsApp gate sits before week 3 because Meta's review isn't in our control, so the application goes in during week 1. Week 5 includes Diwali (8 Nov). Pilot vendors are signed up before it and go live after it, when daily orders are back to normal.

## 18. Setup

Setup takes four steps: scaffold with C3, add the libraries, create Neon and Hyperdrive, and set secrets. The snippets below are the only files that differ from the template's defaults.

```bash
# 1. Scaffold (choose "OpenNext adapter" if prompted)
bun create cloudflare@latest ruxs --framework=next --variant=opennext
cd ruxs
bun add next@latest react@latest react-dom@latest eslint-config-next@latest   # template pins Next 16.3.8

# 2. Libraries
bun add @hexclave/next drizzle-orm pg zod sonner
bun add -d drizzle-kit @types/pg @playwright/test prettier prettier-plugin-tailwindcss
bunx shadcn@latest init

# 3. Database: create a Neon project in the region closest to India, then Hyperdrive with query caching off
bunx wrangler hyperdrive create ruxs-db --connection-string="$DATABASE_URL" --caching-disabled
bunx drizzle-kit generate && bunx drizzle-kit migrate

# 4. Secrets (never commit these)
bunx wrangler secret put HEXCLAVE_SECRET_SERVER_KEY
bunx wrangler secret put WHATSAPP_ACCESS_TOKEN
bunx wrangler secret put WHATSAPP_APP_SECRET
bunx wrangler secret put WHATSAPP_VERIFY_TOKEN
bunx wrangler secret put CRON_SECRET
```

Caching stays off because Hyperdrive caches read queries by default, and a cached balance would show stale money.

```jsonc
// wrangler.jsonc (additions to the template)
{
  "name": "ruxs",
  "main": "custom-worker.ts",
  "hyperdrive": [{ "binding": "HYPERDRIVE", "id": "<id from hyperdrive create>" }],
  "triggers": { "crons": ["* * * * *"] },
  "routes": [
    { "pattern": "ruxs.in", "custom_domain": true },
    { "pattern": "www.ruxs.in", "custom_domain": true }
  ],
  "vars": { "NEXT_PUBLIC_APP_URL": "https://ruxs.in", "WHATSAPP_PHONE_NUMBER_ID": "<id>", "ADMIN_USER_IDS": "<hexclave user id>" }
}
```

```ts
// custom-worker.ts
// @ts-ignore generated by opennextjs-cloudflare build
import { default as handler } from "./.open-next/worker.js";

export default {
  fetch: handler.fetch,
  async scheduled(_event, env, ctx) {
    const req = new Request("https://ruxs.in/api/cron/tick", {
      method: "POST",
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    ctx.waitUntil(handler.fetch(req, env, ctx));
  },
} satisfies ExportedHandler<CloudflareEnv>;
```

```ts
// src/db/index.ts (OpenNext's recommended Hyperdrive pattern)
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cache } from "react";
import * as schema from "./schema";

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  const pool = new Pool({ connectionString: env.HYPERDRIVE.connectionString, maxUses: 1 });
  return drizzle({ client: pool, schema });
});
```

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/schema",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! }, // direct Neon URL, migrations only
});
```

### Environment variables

| Variable | Where it lives | Secret | Used by |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | `.env` + wrangler `vars` | No | Metadata, sitemap, links |
| `NEXT_PUBLIC_HEXCLAVE_API_URL` = `https://api.hexclave.com` | `.env` (must exist at build time) | No | Hexclave SDK |
| `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` = `afdff151-7a3c-49b3-830f-abfcc23d8d61` | `.env` (must exist at build time) | No | Hexclave SDK |
| `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY` | `.env`, only if the project requires one | No | Hexclave SDK |
| `HEXCLAVE_SECRET_SERVER_KEY` | `.dev.vars` + `wrangler secret` | **Yes, rotate it** | Server-side Hexclave calls |
| `DATABASE_URL` | `.env.local` + CI secret | Yes | drizzle-kit migrations and seed only |
| `HYPERDRIVE` (binding) | `wrangler.jsonc` | — | Every runtime query |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` | `.dev.vars` + `wrangler secret` | Yes | Sending, signature check, handshake |
| `WHATSAPP_PHONE_NUMBER_ID`, `ADMIN_USER_IDS` | wrangler `vars` | No | Sending; admin allowlist |
| `CRON_SECRET` | `.dev.vars` + `wrangler secret` | Yes | `/api/cron/tick` |

`NEXT_PUBLIC_*` values are baked into the browser bundle during `next build`, so they must be in `.env` or the CI environment when building. Setting them only as wrangler vars won't reach client code. For local runs, `next dev` reads bindings through `initOpenNextCloudflareForDev()` (already in the template's `next.config.ts`). Point the local Hyperdrive binding at a Neon dev branch with the `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` environment variable.

## 19. Risks and open questions

The riskiest dependency is Meta, not the code. WhatsApp business verification and template approval gate the daily loop, so they start on day one.

| Risk | Effect | Mitigation |
| --- | --- | --- |
| WhatsApp verification or template approval runs long | No polls in week 3 | Apply in week 1. Fallback: vendors share customer links, and households skip from the link |
| WhatsApp message costs | Margin shrinks | Utility templates only; one poll per household per shift; replies inside the free 24-hour window |
| Hexclave can't sign people in by phone number | Drivers without email struggle | Google sign-in, since every Android phone has a Google account; revisit WhatsApp OTP later |
| OpenNext lags a Next.js release | Upgrades wait | Pin Next to versions the adapter supports; upgrade both together |
| Neon scales to zero overnight | The 8:30 rush starts slow | Turn off scale-to-zero on the production branch (paid plan) |
| Drivers skip can logging | Can balances drift | Stepper defaults to 1 out, 1 in, so doing nothing is usually right |
| A household disputes a late skip | Trust drops | The reply and the bill both show the exact tap time |

### Open questions

- [ ] Do drivers sign in with Google only, or do we need WhatsApp OTP for the pilot?
- [ ] Is HSR Layout confirmed as the first cluster?
- [ ] Is a Bill of Supply enough for the pilot, or must GST invoices for vendors with a GSTIN be in the MVP?
- [ ] Which payment gateway for Phase 2: Razorpay, Cashfree or PhonePe PG?
- [ ] Does the pilot need Hindi message copy, or can it wait?
- [ ] Does the Hexclave project require a publishable client key?
