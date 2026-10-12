# PROMPT.md — Build the RUXS MVP

> Paste this file into Antigravity CLI from the repo root (`~/sop/ruxs`), or tell it: **"Read PROMPT.md and follow it exactly."**
> It is the single entry point. Everything it needs is in this repo.

---

## 0. Who you are and what you are building

You are the senior full-stack engineer building **RUXS**: software that lets a neighbourhood **tiffin kitchen or 20L water supplier** run its whole day on one web app instead of WhatsApp chats and a paper khata.

You are building the **MVP**. When the MVP is done and every gate in §9 passes, stop and report. Do not start post-MVP features.

**Your three priorities, in order:**
1. **Correct money and counts.** A wrong bill or kitchen count destroys trust. Rules live in pure, tested functions.
2. **Simple, readable code.** A new developer should understand any file in under 2 minutes. No clever abstractions, no frameworks-within-the-framework.
3. **A calm, premium, slightly cute look.** Clean and minimal in the app, warm and delightful on the landing page.

---

## 1. Read these first (in this order) and keep them open

| File | What it gives you | How to treat it |
| --- | --- | --- |
| `PROMPT.md` (this file) | The build order, the overrides, the checklists | **Wins over everything else** |
| `docs/PRD.md` | The full spec: scope, data model, routes, auth, rules, SEO, design, Next.js practices, tests | Follow it, except where §2 below overrides it |
| `RUXS_STARTUP_OVERVIEW.md` | Why RUXS exists, users, personas, pricing, roadmap | Use it for copy, tone and product judgement |
| `AGENTS.md` | Hard rules for every change | Never break them |
| `DESIGN.md` | Tokens and UI rules (you create it in Phase 1 from PRD §12 + §7 below) | Read before touching any style |
| Hexclave docs | Up-to-date auth SDK usage | **Always ask before writing auth code**: `curl -sSL -G https://skill.hexclave.com/ask --data-urlencode "question=..."`. Fallback: `https://skill.hexclave.com/full`, then the SDK source in `node_modules/@hexclave/next`. Never rely on memory for Hexclave APIs |

Before writing any code, write a 10-line summary of the product and the daily loop in your own words, then continue.

---

## 2. Decisions that override the PRD (read carefully)

### 2.1 WhatsApp is PAUSED for the MVP
Meta verification is not started, so **build nothing that talks to WhatsApp**. The household's channel is the **private customer link** (`/c/[token]`), which the PRD already lists as the fallback (PRD §19).

| PRD item | MVP decision |
| --- | --- |
| Morning WhatsApp poll (Deliver / Skip / Extra) | **Replace** with Deliver / Skip / Extra buttons per day on the customer link page. Same `day_changes` rules, `source = 'link'` |
| `/api/webhooks/whatsapp` route | **Do not build** |
| `messages`, `webhook_events` tables | **Do not create** (add them later with WhatsApp) |
| Opt-in message on import | **Skip.** Store `opted_in_at = null`. On import, show each customer's link with a **Copy link** and **Share** button (Web Share API, falls back to copy) so the vendor can send it however they like |
| Cutoff reminder 30 min before | **Skip** |
| Bills "sent on WhatsApp on the 1st" | Bills are **generated** on the 1st at 10:00 IST by the cron. The vendor sees them in `/app/[vendor]/bills` with Copy/Share link per bill. `sent_at` = when the vendor copied/shared |
| `WHATSAPP_*` env vars and secrets | **Do not add** |
| Marketing copy mentioning WhatsApp polls | Talk about "**one private link per household**" and "**one tap to skip**". Do not promise WhatsApp |

Keep the code shaped so WhatsApp can be added later as one new feature folder (`src/features/whatsapp`) that writes into the same `day_changes` via the same core rules. Do not add stubs, flags or empty files for it now.

### 2.2 Data model: 11 tables (not 12)
PRD §7 tables **minus** `messages` and `webhook_events`, **plus** `vendor_invites` (the PRD's staff-invite flow needs somewhere to keep a pending email before the person has a Hexclave user id):

`vendors`, `vendor_members`, `vendor_invites`, `customers`, `products`, `subscriptions`, `day_changes`, `orders`, `ledger_entries`, `asset_movements`, `invoices`.

`vendor_invites`: `id`, `vendor_id`, `email` (lower-cased), `role` (staff, driver), `created_by`, `created_at`, `accepted_at`, `accepted_user_id`. Unique (`vendor_id`, `email`). On a signed-in user's first visit to `/app`, accept any pending invites matching their **verified** primary email by inserting into `vendor_members`.

`day_changes.source` values: `link` (household), `vendor` (owner/staff on their behalf), `pause` (holiday pause).

### 2.3 The database already has the OLD prototype's tables
The Neon database in `DATABASE_URL` still holds 24 tables from the retired prototype (`tenants`, `users`, `products`, `subscriptions`, `invoices`, …). Some names collide with the new schema.

**Do not drop or alter them yourself.** At the start of Phase 2, **stop and ask the user** to choose one:
- **(A, recommended)** Create a fresh Neon branch (e.g. `mvp`) from an empty state and put its pooled URL into `.env` as `DATABASE_URL` and `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`, or
- **(B)** Give explicit written permission to drop the 24 old tables + `__ruxs_migrations` in the current branch.

Continue Phase 2 only after the user answers.

### 2.4 Other fixes to the PRD
- **No publishable client key.** Verified 2026-10-12: the Hexclave project accepts client calls without one. Do not add `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY`.
- **Hexclave API URL** is `https://api.hexclave.com` (the documented base). `HEXCLAVE_API_URL` / `HEXCLAVE_PROJECT_ID` without `NEXT_PUBLIC_` are CLI-only; the SDK does not read them.
- **TypeScript.** `typescript@7.0.2` is installed. If `next build` or `eslint-config-next` rejects it, pin `typescript@5.9` and note it in your report. Do not fight the toolchain.
- **Integration tests on a Neon branch in CI** need a `NEON_API_KEY` that does not exist yet. Write the integration tests so they run locally against `DATABASE_URL` (each test file uses a unique vendor slug and cleans up only its own rows), and leave the Neon-branch CI step as a commented, documented TODO.
- **Customer-link writes** (`setDayChange`, `pauseDates`) are Server Actions authorised by the token: hash the token, look up the customer, derive `vendorId` from that row. Never accept `vendorId` or `customerId` from the client.

---

## 3. What already exists (do not redo)

- Git repo on `main`, remote `https://github.com/SH20RAJ/ruxs.git`. Commit identity is **Shaswat Raj <shaswatraj3@gmail.com>** (set by `~/.gitconfig-sh20raj` via `includeIf` for `~/sop/`). Run `git config user.email` once to confirm before your first commit.
- `package.json` (scripts), `tsconfig.json` (strict, `noUncheckedIndexedAccess`, `@/*` → `src/*`), `next.config.ts` (security headers, `/c/*` noindex + no-referrer, www→apex redirect), `open-next.config.ts`, `drizzle.config.ts`, `postcss.config.mjs`, `.gitignore`, `.env.example`.
- Dependencies installed (Next 16.4, React 19.3, `@opennextjs/cloudflare` 1.20, `@hexclave/next` 1.0.125, drizzle-orm 0.45, pg, zod 4, sonner, Tailwind 4.3, wrangler 4.149, Playwright, ESLint, Prettier). `bun pm untrusted` shows one blocked postinstall; trust it only if a build needs it.
- `.env` and `.dev.vars` (gitignored) with **verified-working** values:
  - `DATABASE_URL` → Neon Postgres 18.6, `ap-southeast-1`, connects ✅
  - `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID`, `HEXCLAVE_SECRET_SERVER_KEY` → `GET /api/v1/projects/current` returns 200, project "ruxs" ✅
  - Hexclave project: email+password, magic link (email code), passkey and **Google** sign-in enabled; sign-up enabled; localhost allowed; trusted domains `ruxs.in`, `*.ruxs.in`, `*.shraj.workers.dev`
  - `CRON_SECRET` generated; `ADMIN_USER_IDS` empty (fill after the owner's first sign-in)
- `wrangler` is logged in to the Cloudflare account of shaswatraj3@gmail.com.

**Never print, log, commit or paste secret values.** Read env only through `src/lib/env.ts`.

---

## 4. Architecture (keep it this simple)

```
Browser ─▶ Next.js page / Server Action ─▶ src/features/<area> (auth check + query) ─▶ src/core (pure rules) ─▶ src/db (Drizzle) ─▶ Hyperdrive ─▶ Neon
Cron (every minute) ─▶ custom-worker.ts scheduled() ─▶ POST /api/cron/tick (Bearer CRON_SECRET) ─▶ src/features/* ─▶ same path
```

- **One Worker, one codebase, two entry points** (browser and cron). No webhook in the MVP.
- **Layers import downward only:** `app → features → core`, `features → db`. `core` imports nothing from `db`, `next` or `react`.
- **One folder per business area** in `src/features/`: `vendors`, `customers`, `products`, `subscriptions`, `day-changes`, `orders`, `ledger`, `assets`, `billing`, `admin`. Each has at most `queries.ts`, `actions.ts`, `schemas.ts`, `components/`. Don't create a file until something needs it.
- Folder map: PRD §6 (minus `whatsapp/` and `api/webhooks/`).
- Every rule in PRD §9 ("Rules every PR follows") and PRD §13 (Do/Don't table) applies to every file you write.

### The cron tick (`/api/cron/tick`), MVP version
Runs every minute and must be safe to run twice. In order:
1. **Lock cutoffs:** for each active vendor's product whose `cutoff_at` passed today (IST) and that has no orders for today yet, run the single `INSERT … SELECT … ON CONFLICT DO NOTHING` from PRD §10 rule 3 (apply `day_changes`: skip → `skipped`, extra/qty → adjusted `qty`, pause → `skipped`).
2. **Monthly bills:** if it is the 1st and ≥ 10:00 IST, create missing invoices for last month (PRD §10 rule 6). Unique (`vendor_id`, `customer_id`, `period`) makes re-runs no-ops.
3. Return JSON counts. Log nothing personal.

Suspended or pending vendors are skipped in both steps.

---

## 5. Build order: 7 phases

**Rules for every phase:**
- Start by re-reading the PRD sections listed for that phase.
- Finish by running that phase's **Verify** commands, ticking its checklist in `docs/PROGRESS.md` (create it in Phase 1 by copying the checklists below), then **commit and push to `main`**.
- Commit messages are Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`). **No `Co-Authored-By` lines and no AI attribution of any kind.** Don't create branches or PRs.
- If a Verify step fails, fix it before moving on. Never skip a check, never weaken a test to make it pass, never mark something done that you didn't run.

### Phase 1 — Foundation, design system, rules files (PRD §4, §6, §12, §13, §14)
- [ ] `wrangler.jsonc`: name `ruxs`, `main: "custom-worker.ts"`, `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`, `assets` → `.open-next/assets`, `images` binding, `observability`, cron `* * * * *`, routes `ruxs.in` + `www.ruxs.in` (custom domains), `vars` (`NEXT_PUBLIC_APP_URL`, `ADMIN_USER_IDS`). Leave the `hyperdrive` block with a placeholder id until Phase 2
- [ ] `custom-worker.ts` exactly as PRD §18; `cloudflare-env.d.ts` via `bun run cf-typegen`
- [ ] `eslint.config.mjs` (flat config with `eslint-config-next`), `.prettierrc` (Tailwind plugin), `components.json` + shadcn init (`bunx shadcn@latest init`) wired to the tokens
- [ ] `src/app/globals.css`: Tailwind 4 `@theme` with **every** token from PRD §12 + the marketing pastels in §7 below; `prefers-reduced-motion` respected
- [ ] `src/app/layout.tsx`: `<html lang="en-IN">`, Geist via `next/font`, `metadataBase`, title template `%s · RUXS`
- [ ] `src/lib/env.ts` (zod, fails fast, separates server and public), `src/lib/utils.ts` (`cn`, IST date helpers), `src/config/site.ts` (name, URL, cities `[{slug:"bengaluru", ...}]`, vendor types, plans Free/₹499/₹1,499)
- [ ] `DESIGN.md` written from PRD §12 + §7 of this file
- [ ] `AGENTS.md` updated: keep every existing line, add the WhatsApp pause and the 11-table decision, and point to `PROMPT.md`. `CLAUDE.md` stays `@AGENTS.md`
- [ ] Install the agent skills from PRD §14 (all 16 `bunx skills add ...` commands). Do **not** install `nextjs-on-cloudflare` or any `next-cache-components-*`. Commit `.agents/skills/` + `skills-lock.json`
- [ ] Placeholder home page renders
- **Verify:** `bun run typecheck && bun run lint && bun run build` pass; `bun run dev` serves `/` with the correct font and colours

### Phase 2 — Database (PRD §7, §10 rule 5; §2.2–2.3 here)
- [ ] **Ask the user the §2.3 question first.** Wait for the answer
- [ ] `src/db/schema/*.ts`: the 11 tables, one file per group (`vendors.ts`, `customers.ts`, `catalog.ts`, `orders.ts`, `money.ts`). `vendor_id` on every tenant row, `integer` paise, `date` service dates, `timestamptz` events, `text` + `check` for enums, every unique constraint the PRD names, indexes on `(vendor_id, …)` lookups
- [ ] A hand-written SQL migration (after the generated one) that adds the trigger blocking `UPDATE` and `DELETE` on `ledger_entries`
- [ ] `src/db/index.ts`: `getDb()` exactly as PRD §18 (per request, `maxUses: 1`). A separate `src/db/script-client.ts` for scripts/tests that uses `DATABASE_URL` directly
- [ ] `bunx wrangler hyperdrive create ruxs-db --connection-string="$DATABASE_URL" --caching-disabled`, put the id in `wrangler.jsonc` (ids are not secrets)
- [ ] `src/db/seed.ts`: one demo vendor "Annapurna Tiffin" in HSR Layout Sector 2, Bengaluru (lunch regular ₹90, lunch Jain ₹95, dinner ₹90 and a water supplier "Neer 20L" with ₹40 cans + ₹150 deposit), 12 customers spread over 2 societies / 3 towers / several floors, subscriptions, and 10 days of history. Clearly fake names; no real phone numbers (use `+9199999000xx`)
- **Verify:** `bun run db:generate && bun run db:migrate && bun run db:seed` succeed; a script proves `UPDATE ledger_entries` raises an error; re-running the seed is a no-op or cleanly re-seeds the demo vendor only

### Phase 3 — Core rules (PRD §10, §16 launch gates)
Pure functions in `src/core/`, each with a `*.test.ts` next to it. **Write the tests first.**
- [ ] `money.ts`: `formatINR(paise)` → `₹1,23,450` / `₹90.50`, `rupeesToPaise`, never floats in storage
- [ ] `time.ts` (or inside `cutoff.ts`): IST helpers: `istDateTime(date, "HH:MM[:SS]")`, `todayIST(now)`, weekday in IST
- [ ] `cutoff.ts`: `isLate(tapAt, serviceDate, cutoffAt)`; `lateCharge(rule, qty, unitPaise)` → free 0 / half 50% (round half up to whole paise) / full 100% / locked → `{ refused: true }`
- [ ] `orders.ts`: `resolveDay(subscription, change | null)` → `{ status, qty }` (the same logic the SQL uses; the SQL is tested against it in Phase 4)
- [ ] `ledger.ts`: idempotency key builders from PRD §10 rule 5; `balance(entries)`
- [ ] `billing.ts`: `computeInvoice(entries, period)` → opening, charges, payments, closing; invoice number `RX-{YYYYMM}-{seq}`
- [ ] `run-sheet.ts`: sort by society → tower → floor **descending** → flat (natural sort: `A-2` before `A-10`)
- [ ] `upi.ts`: `upi://pay?pa=…&pn=…&am=…&cu=INR&tn=…` with correct encoding and 2-decimal rupees
- [ ] `assets.ts`: `canBalance(movements)`, default stepper `{ out: qty, in: qty }`
- **Launch-gate tests (must exist and pass):** a skip at `10:00:01` is late against `10:00:00`; 100 simulated skips → zero duplicate charges; replaying the same events twice gives an identical ledger; bill closing == khata balance for every seeded customer (integration test in Phase 4)
- **Verify:** `bun test src/core` all green; every exported function has at least one test; coverage of `src/core` ≥ 95% (`bun test --coverage`)

### Phase 4 — Auth and features (PRD §8, §9, §10)
- [ ] **Ask Hexclave's `/ask` endpoint** how to set up `@hexclave/next` 1.0.125 with Next.js 16 App Router on OpenNext/Cloudflare Workers using hosted sign-in pages, a server app, and a provider only in the `(app)` layout. Follow its answer over PRD §9's snippet if they differ, and note the difference in `docs/PROGRESS.md`
- [ ] `src/lib/auth/hexclave.ts`, `src/lib/auth/session.ts`: `requireUser`, `requireVendorAccess(slug, roles)` (→ `notFound()`), `requireAdmin()` (allowlist), `requireCustomerByToken(token)` (hash → row → `notFound()`)
- [ ] Feature folders with queries/actions/schemas. Server Actions: `createVendor`, `saveProduct`, `importCustomers`, `saveSubscription`, `inviteStaff`, `markDelivered`, `markFailed`, `recordCans`, `markPaid`, `addAdjustment`, `resetCustomerLink`, `setDayChange` (vendor or link), `pauseDates` (link or vendor), `approveVendor`, `suspendVendor`
- [ ] Every action: zod parse → access check → write in a transaction where more than one row changes → `revalidatePath`. Return `{ ok: true } | { ok: false, error }`; never throw raw DB errors at the UI
- [ ] `markDelivered` writes the order status + one `delivery` ledger entry + asset movements (+ first-time `deposit` entry) in **one transaction**, all idempotent
- [ ] Customer import: paste `name, phone, society, tower, floor, flat` lines or upload CSV; normalise phones to `+91XXXXXXXXXX`; show bad rows inline with the reason; create a link token per customer (32 random bytes, store SHA-256 hash, show the raw link **once** at import and on reset)
- [ ] `/api/cron/tick` exactly as §4 (Bearer `CRON_SECRET`, constant-time compare)
- [ ] **Integration tests** (`bun test` against `DATABASE_URL`): cutoff SQL matches `resolveDay` for every seeded subscription; running the tick twice changes nothing; the ledger trigger blocks updates; **cross-tenant:** a member of vendor A gets not-found for every query and action on vendor B; a customer token can't read or write another customer
- **Verify:** `bun run typecheck && bun run lint && bun test` all green

### Phase 5 — App screens (PRD §8, §12)
Build mobile-first at 360 px width, then check 768 px and 1280 px.
- [ ] `(app)` layout: `HexclaveProvider`, `robots: { index: false }`. `/onboarding` (name, area, UPI ID, auto-slug with edit) → vendor `pending` + owner membership. `/app` → redirect to the only vendor, picker if several, onboarding if none; accepts pending invites
- [ ] `/app/[vendor]` layout: `requireVendorAccess`, bottom nav (max 4: Today, Run, Customers, More) and a "Pending approval" banner while `status = pending` (pending vendors can set up but the cron skips them)
- [ ] **Today:** `CutoffTimer`, one `BigCount` per product (before cutoff: "expected"; after: "locked at 10:00"), `PollProgress` renamed **"Replies today: 23 of 80"** (link taps), list of changes since yesterday
- [ ] **Run:** sticky "12 stops left", grouped society → tower → floor (top first), next stop expanded, one-tap **Delivered** with `useOptimistic` + retry, **Failed** with reason, `QtyStepper` for cans defaulting to 1 out / 1 in
- [ ] **Customers:** list with search and balance; `/new` with paste/CSV import; `/[id]` with balance, can balance, subscriptions, khata timeline (newest first), **Add adjustment** bottom sheet (note required), **Copy/Share link**, **Reset link**
- [ ] **Products:** list + form (kind, name, shift, price ₹, deposit ₹, asset name, cutoff time, late rule; poll time hidden while WhatsApp is paused)
- [ ] **Bills:** this month and last month; status pills; **Mark paid** (amount defaults to closing, partial allowed); Copy/Share bill link
- [ ] **Settings:** UPI ID, invite staff/driver by email, plan (display only in MVP)
- [ ] **Customer link `/c/[token]`:** vendor name; **today and the next 6 days** as cards with Deliver / Skip / Extra (disabled after cutoff, showing the late rule); this month's total + **Pay by UPI** button; can balance; month calendar with each day's status; **Pause dates** (range picker); khata list. `/c/[token]/bills/[month]`: itemised bill + UPI button
- [ ] `/admin`: pending vendors (approve), active vendors (suspend), search by slug/phone
- [ ] `loading.tsx` skeletons + `error.tsx` per segment; `EmptyState` everywhere a list can be empty; Sonner toasts for action results
- **Verify:** walk the full loop by hand in `bun run dev` with the seed: onboarding → product → import 3 customers → skip from a customer link before cutoff → run the tick → count is right → deliver on Run → khata entry appears on both sides → generate a bill (call the billing function for the current month in a test script) → mark paid → balance is ₹0

### Phase 6 — Landing page and public SEO pages (PRD §11, §7 here)
- [ ] `(marketing)` layout: header + footer only, **no** auth provider, **no** request APIs (every page must build as static, confirm in `next build` output)
- [ ] `/` landing page (spec in §7.3), `/pricing`, `/for/tiffin-services`, `/for/water-suppliers`, `/in/bengaluru` (`generateStaticParams` from `config/site.ts`), `/privacy` (with the DPDP Act notice from PRD §15), `/terms`
- [ ] `src/lib/seo.ts`: `buildMetadata()` (unique title < 60 chars, description < 155, canonical) + JSON-LD helpers; JSON-LD per PRD §11 checklist (Organization + WebSite on `/`, SoftwareApplication + 3 INR Offers on `/pricing`, BreadcrumbList on nested pages, FAQPage where a visible FAQ exists)
- [ ] `sitemap.ts` (public pages only), `robots.ts` (disallow `/app`, `/c/`, `/admin`, `/api`, `/onboarding`), `manifest.ts`, `opengraph-image.tsx` (1200×630, on-brand), `icon.tsx`, `not-found.tsx`, `global-error.tsx`
- [ ] Honest content only: **no fake testimonials, ratings, logos, user counts or "trusted by"**. Use real numbers from the overview only as clearly labelled examples ("e.g. 84 meals locked at 10:00")
- **Verify:** `bun run build` shows marketing routes as static (○); Lighthouse (mobile) on `/` and `/pricing`: SEO 100, Accessibility ≥ 95, Performance ≥ 90; landing JS < 70 KB gzipped (`next-bundle-optimizer` skill)

### Phase 7 — CI, end-to-end, deploy
- [ ] `.github/workflows/ci.yml`: Bun install → `typecheck` → `lint` → `bun test` (unit) → `opennextjs-cloudflare build` → Playwright against `bun run preview`. On `main` only: `drizzle-kit migrate` (secret `DATABASE_URL`) then `opennextjs-cloudflare deploy` (secret `CLOUDFLARE_API_TOKEN`). Neon-branch step commented as a TODO (§2.4)
- [ ] `e2e/` Playwright: landing renders + has one h1; `/robots.txt` and `/sitemap.xml` correct; customer link skip-before-cutoff flow on seeded data; `/app` redirects to sign-in when signed out; `/c/<bad-token>` returns 404
- [ ] Put secrets with `wrangler secret put` (`HEXCLAVE_SECRET_SERVER_KEY`, `CRON_SECRET`); **ask the user before the first `bun run deploy`**, then deploy and smoke-test `https://ruxs.in`
- **Verify:** `bun run preview` passes Playwright locally; after deploy, `/`, `/pricing`, `/robots.txt`, `/sitemap.xml` return 200 on ruxs.in and the cron tick logs a successful run in `wrangler tail`

---

## 6. Code style (simple and understandable)

- **Small files, plain functions.** Prefer one clear function over a class or a generic helper. If a file passes ~200 lines, split by responsibility.
- **Names say what things are in business words:** `lockCutoff`, `markDelivered`, `customerBalance`, not `processEntity` or `handleData`.
- **Comments explain *why*, not *what*.** One short comment above any rule that touches money, time zones or idempotency.
- **No premature abstraction:** no repository pattern, no service classes, no DI containers, no generic CRUD factories, no barrel `index.ts` files.
- **Types come from Drizzle and zod** (`typeof table.$inferSelect`, `z.infer`). No hand-written duplicates, no `any`, no non-null `!` except in config.
- **Errors:** actions return `{ ok, error }` with a human sentence ("That phone number is already a customer"). Log the technical detail server-side without personal data.
- **Client components are leaves:** steppers, timers, forms, optimistic buttons. Pages and layouts are always Server Components.
- **Accessibility is part of "done":** labels, focus rings, 48 px targets, `aria-describedby` errors, status in words and colour.

---

## 7. Design direction: clean, minimal, premium, a little cute

### 7.1 The feel
Think **a calm Indian kitchen notebook made premium**: lots of warm white space, one confident coral accent, soft rounded shapes, crisp type, and on the marketing site a few friendly hand-drawn touches (a smiling steel tiffin dabba, a 20L can with a tiny face, a little scooter) that make people smile once without getting in the way. Premium comes from **restraint, spacing and typography**, not from gradients and effects.

### 7.2 Tokens
Use the PRD §12 tokens **unchanged** for the app (`--bg #FAFAF7`, `--surface #FFFFFF`, `--ink #1C1B19`, `--muted #6B6862`, `--line #E7E5DF`, `--accent #BD4B2A`, `--good #2F7D4F`, `--warn #9A5B00`, `--bad #B42318`, Geist, 4 px spacing, radius 10/12, 150 ms motion).

Add these **marketing-only** pastel tints (backgrounds and illustration fills only; never for text and never inside `/app`, `/c`, `/admin`):

| Token | Value | Use |
| --- | --- | --- |
| `--peach` | `#FFE8DD` | Hero halo, coral-adjacent sections |
| `--butter` | `#FFF3C9` | Highlight chips, "how it works" step dots |
| `--mint` | `#E1F3E7` | "Delivered / Paid" illustrations, success sections |
| `--sky` | `#E2EEFA` | Water supplier page accents |
| `--blush` | `#FCE4EC` | Small decorative blobs, FAQ section |

Rules: the accent coral is the **only** saturated colour on any screen; at most **two** pastels per section; text on pastels is always `--ink`; check contrast is AA.

### 7.3 Landing page `/` (sections in order)
1. **Header:** wordmark "RUXS" (custom-lettered in coral, slightly rounded), links (For tiffin, For water, Pricing), a ghost "Sign in" link, a coral "Start free" button. Sticky with a hairline bottom border on scroll.
2. **Hero:** H1 like *"Your kitchen's day, sorted by 10 AM."* (or better; under 8 words). One sentence: *"RUXS locks tomorrow's count at your cutoff, gives your driver a clean run sheet, and keeps a khata every household can see."* Buttons: **Start free** (coral) + **See how it works** (text link). Right side: a phone mockup (pure HTML/CSS, not an image) showing the **customer link** card: "Lunch · Tue 14 Oct · Deliver / Skip / Extra", with a tiny dabba illustration peeking over the top edge and a soft `--peach` halo behind.
3. **"Sound familiar?" → "With RUXS":** three pain → fix pairs from the overview (80 unread messages → one locked count; late cancellations → enforced cutoff rule; month-end arguments → a shared khata). Two-column cards with a small doodle icon each.
4. **How it works:** 4 numbered steps on a gentle dotted path: Add your customers → They tap Skip on their link → Count locks at your cutoff → Driver delivers, khata updates itself.
5. **Two ways in:** cards for **Tiffin services** (`--peach`) and **20L water suppliers** (`--sky`), each linking to its `/for/...` page with 3 bullets.
6. **The numbers screen:** a large, real-looking `BigCount` component ("84 meals · 72 regular · 12 Jain · locked at 10:00") built from the app's own component, labelled "example".
7. **Pricing preview:** Free / ₹499 / ₹1,499 cards (Growth highlighted), link to `/pricing`.
8. **FAQ:** 6 honest questions (Do my customers need an app? → No, a private link. Do you hold my money? → No, UPI goes straight to you. What about WhatsApp? → Coming soon; today you share each household's link. Is my data safe? → DPDP notice. Can I try it free? → Yes, up to 20 households. Which cities? → Bengaluru first).
9. **Final CTA band** on `--butter` with a scooter doodle: "Run tomorrow's tiffins from one screen." + Start free.
10. **Footer:** product links, `/privacy`, `/terms`, "Made in Bengaluru", © 2026 RUXS.

Illustrations: **inline SVG, hand-drawn style, 1.5–2 px rounded strokes in `--ink`, pastel fills**, max ~6 on the page, each with `aria-hidden` (decorative) and none above the H1's LCP text. Motion: one gentle float on the hero dabba (disabled under reduced motion). No stock photos, no emoji as icons, no carousel, no auto-playing anything.

### 7.4 The app screens
No illustrations, no pastels, no shadows (except the bottom sheet). Big numbers with tabular figures, generous spacing, status pills with words. The **only** cute touch allowed in the app: the `EmptyState` may use one small line-drawn doodle.

---

## 8. Never do these

- Never build WhatsApp, Meta webhooks, payment gateways, household accounts/flatmate splitting, marketplaces, or services other than tiffin and water.
- Never `UPDATE`/`DELETE` ledger rows, store money as floats, or trust `vendorId`/`customerId` from the client.
- Never add `proxy.ts`/`middleware.ts`, put `"use client"` on a page or layout, or call request APIs in `(marketing)`.
- Never commit `.env`, `.dev.vars` or any secret; never print secret values in logs or reports.
- Never drop existing database tables or deploy to production without the user's explicit OK.
- Never add fake reviews, ratings, customer logos or user counts.
- Never add AI co-author/attribution lines to commits; never create branches.

---

## 9. Definition of done (the MVP gate)

Run all of these at the end and paste the real output into your final report:

- [ ] `bun run typecheck`: 0 errors
- [ ] `bun run lint`: 0 errors
- [ ] `bun test`: all unit + integration tests pass, including the 4 launch gates (PRD §16)
- [ ] `bun run build`: succeeds; marketing routes static, app routes dynamic
- [ ] `bunx playwright test` against `bun run preview`: green
- [ ] Lighthouse mobile on `/`: SEO 100 / A11y ≥ 95 / Perf ≥ 90
- [ ] Manual loop from Phase 5 Verify completed on the seeded vendor
- [ ] Cross-tenant tests prove vendor A can't see vendor B, and token X can't see customer Y
- [ ] `docs/PROGRESS.md` fully ticked, with a short "Known gaps" list
- [ ] Everything committed and pushed to `main` as Shaswat Raj, no AI attribution

---

## 10. Self-review loop (do this at the end of every phase)

Before you commit a phase, re-read your diff and answer each question in `docs/PROGRESS.md` under that phase:

1. Does every query/action call the right `require*()` and filter by `vendor_id`?
2. Is every money change an insert with an idempotency key, inside a transaction where needed?
3. Is every time comparison done in Asia/Kolkata through `src/core` helpers?
4. Could anything here run twice (double tap, retried request, double cron) and change the result? If yes, fix it.
5. Is there any file a newcomer couldn't understand in 2 minutes? Simplify it.
6. Any `any`, unused export, dead file, TODO without an owner, or console log? Remove it.
7. Does each screen do one job, at 360 px, with 48 px targets and words + colour for status?
8. Did I invent anything not in the PRD or this file? If yes, remove it or ask.

## 11. Final report format

When the MVP gate passes (or you are blocked), reply with:
1. **Status:** done / blocked (and on what)
2. **What works:** the loop, in 5 bullets
3. **Gate results:** the real command outputs (trimmed)
4. **Deviations from the PRD:** each with the reason
5. **Known gaps and next steps:** the top 5, starting with "Turn on WhatsApp (Meta verification + `src/features/whatsapp`)"
6. **Things the user must do:** e.g. rotate the Hexclave server key (it was shared in chat), add `ADMIN_USER_IDS`, add CI secrets, approve the first deploy
