# Progress & Checklist — RUXS MVP

Tracking build progress across all 7 phases against `PROMPT.md` and `docs/PRD.md`.

---

## 10-Line Summary & Daily Loop

1. RUXS replaces chaotic WhatsApp chats and paper notebooks for neighborhood tiffin kitchens and 20L water suppliers.
2. The vendor configures products with daily cutoffs (e.g. 10:00 AM IST) and imports customer addresses into society/tower/floor run sheets.
3. Each household receives a private link (`/c/[token]`) where they can tap Deliver, Skip, or Extra for upcoming days.
4. Before cutoff, skip/extra selections write to `day_changes`; un-tapped households simply default to their standing subscription.
5. At the cutoff time, an idempotent cron tick runs `INSERT ... SELECT` creating immutable order rows and locking the kitchen cook count.
6. Late skips after cutoff keep the kitchen count intact but levy late charges based on the vendor's policy (free, 50%, or 100%).
7. The delivery driver opens a mobile-optimized run sheet ordered by building and descending floor, marking deliveries with one thumb tap.
8. Every delivery and asset exchange generates append-only ledger entries in integer paise and can movement records.
9. On the 1st of each month at 10:00 IST, the cron computes itemized invoices directly from ledger history and produces direct UPI payment links.
10. The vendor marks payments upon receipt; balances reconcile to zero without RUXS ever touching the money or charging transaction fees.

---

## Phase 1 — Foundation, design system, rules files
- [x] `wrangler.jsonc`: name `ruxs`, `main: "custom-worker.ts"`, `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`, `assets` → `.open-next/assets`, `images` binding, `observability`, cron `* * * * *`, routes `ruxs.in` + `www.ruxs.in` (custom domains), `vars` (`NEXT_PUBLIC_APP_URL`, `ADMIN_USER_IDS`). Leave the `hyperdrive` block with a placeholder id until Phase 2
- [x] `custom-worker.ts` exactly as PRD §18; `cloudflare-env.d.ts` via `bun run cf-typegen`
- [x] `eslint.config.mjs` (flat config with `eslint-config-next`), `.prettierrc` (Tailwind plugin), `components.json` + shadcn init (`bunx shadcn@latest init`) wired to the tokens
- [x] `src/app/globals.css`: Tailwind 4 `@theme` with **every** token from PRD §12 + the marketing pastels in §7 below; `prefers-reduced-motion` respected
- [x] `src/app/layout.tsx`: `<html lang="en-IN">`, Geist via `next/font`, `metadataBase`, title template `%s · RUXS`
- [x] `src/lib/env.ts` (zod, fails fast, separates server and public), `src/lib/utils.ts` (`cn`, IST date helpers), `src/config/site.ts` (name, URL, cities `[{slug:"bengaluru", ...}]`, vendor types, plans Free/₹499/₹1,499)
- [x] `DESIGN.md` written from PRD §12 + §7 of this file
- [x] `AGENTS.md` updated: keep every existing line, add the WhatsApp pause and the 11-table decision, and point to `PROMPT.md`. `CLAUDE.md` stays `@AGENTS.md`
- [x] Install the agent skills from PRD §14 (all 16 `bunx skills add ...` commands). Do **not** install `nextjs-on-cloudflare` or any `next-cache-components-*`. Commit `.agents/skills/` + `skills-lock.json`
- [x] Placeholder home page renders
- **Verify:** `bun run typecheck && bun run lint && bun run build` pass; `bun run dev` serves `/` with the correct font and colours

### Phase 1 Self-Review
1. Does every query/action call the right `require*()` and filter by `vendor_id`? (N/A for Phase 1 - foundational configs and rules only)
2. Is every money change an insert with an idempotency key, inside a transaction where needed? (N/A for Phase 1)
3. Is every time comparison done in Asia/Kolkata through `src/core` helpers? (IST helpers created in `src/lib/utils.ts`)
4. Could anything here run twice and change the result? (No - worker cron scheduled calls `/api/cron/tick`)
5. Is there any file a newcomer couldn't understand in 2 minutes? (All files are small, modular, well-documented)
6. Any `any`, unused export, dead file, TODO without an owner, or console log? (Cleaned up, 0 errors, 0 warnings)
7. Does each screen do one job, at 360 px, with 48 px targets and words + colour for status? (Placeholder homepage is responsive with 48px targets)
8. Did I invent anything not in the PRD or PROMPT.md? (No - followed specifications directly)

---

## Phase 2 — Database
- [x] **Ask the user the §2.3 question first.** Wait for the answer (Answered: Option B chosen by user; 24 legacy tables dropped)
- [x] `src/db/schema/*.ts`: the 11 tables, one file per group (`vendors.ts`, `customers.ts`, `catalog.ts`, `orders.ts`, `money.ts`). `vendor_id` on every tenant row, `integer` paise, `date` service dates, `timestamptz` events, `text` + `check` for enums, every unique constraint the PRD names, indexes on `(vendor_id, …)` lookups
- [x] A hand-written SQL migration (after the generated one) that adds the trigger blocking `UPDATE` and `DELETE` on `ledger_entries`
- [x] `src/db/index.ts`: `getDb()` exactly as PRD §18 (per request, `maxUses: 1`). A separate `src/db/script-client.ts` for scripts/tests that uses `DATABASE_URL` directly
- [x] `bunx wrangler hyperdrive create ruxs-db --connection-string="$DATABASE_URL" --caching-disabled`, put the id in `wrangler.jsonc` (id: `2ed48c1c341442cf8a1d1a52b10b1c62`)
- [x] `src/db/seed.ts`: one demo vendor "Annapurna Tiffin" in HSR Layout Sector 2, Bengaluru (lunch regular ₹90, lunch Jain ₹95, dinner ₹90 and a water supplier "Neer 20L" with ₹40 cans + ₹150 deposit), 12 customers spread over 2 societies / 3 towers / several floors, subscriptions, and 10 days of history. Clearly fake names; no real phone numbers (use `+9199999000xx`)
- **Verify:** `bun run db:generate && bun run db:migrate && bun run db:seed` succeed; a script proves `UPDATE ledger_entries` raises an error; re-running the seed is a no-op or cleanly re-seeds the demo vendor only

### Phase 2 Self-Review
1. Does every query/action call the right `require*()` and filter by `vendor_id`? (Schema has `vendorId` on all tenant tables with indexes)
2. Is every money change an insert with an idempotency key, inside a transaction where needed? (All paise columns are integer; unique idempotency key on ledger entries)
3. Is every time comparison done in Asia/Kolkata through `src/core` helpers? (Schema uses timestamptz for moments and date for service dates)
4. Could anything here run twice and change the result? (Seed is idempotent no-op when demo vendors exist; unique constraints prevent duplicates)
5. Is there any file a newcomer couldn't understand in 2 minutes? (Clean 11-table schema across 5 logical files)
6. Any `any`, unused export, dead file, TODO without an owner, or console log? (Cleaned up, 0 errors, 0 warnings)
7. Does each screen do one job, at 360 px, with 48 px targets and words + colour for status? (N/A for DB phase)
8. Did I invent anything not in the PRD or PROMPT.md? (No, followed exact 11-table spec and migration trigger)

---

## Phase 3 — Core rules
Pure functions in `src/core/`, each with a `*.test.ts` next to it. **Write the tests first.**
- [x] `money.ts`: `formatINR(paise)` → `₹1,23,450` / `₹90.50`, `rupeesToPaise`, never floats in storage
- [x] `time.ts` (or inside `cutoff.ts`): IST helpers: `istDateTime(date, "HH:MM[:SS]")`, `todayIST(now)`, weekday in IST
- [x] `cutoff.ts`: `isLate(tapAt, serviceDate, cutoffAt)`; `lateCharge(rule, qty, unitPaise)` → free 0 / half 50% (round half up to whole paise) / full 100% / locked → `{ refused: true }`
- [x] `orders.ts`: `resolveDay(subscription, change | null)` → `{ status, qty }`
- [x] `ledger.ts`: idempotency key builders from PRD §10 rule 5; `balance(entries)`
- [x] `billing.ts`: `computeInvoice(entries, period)` → opening, charges, payments, closing; invoice number `RX-{YYYYMM}-{seq}`
- [x] `run-sheet.ts`: sort by society → tower → floor **descending** → flat (natural sort: `A-2` before `A-10`)
- [x] `upi.ts`: `upi://pay?pa=…&pn=…&am=…&cu=INR&tn=…` with correct encoding and 2-decimal rupees
- [x] `assets.ts`: `canBalance(movements)`, default stepper `{ out: qty, in: qty }`
- [x] **Launch-gate tests (must exist and pass):** a skip at `10:00:01` is late against `10:00:00`; 100 simulated skips → zero duplicate charges; replaying the same events twice gives an identical ledger; bill closing == khata balance for every seeded customer (integration test in Phase 4)
- **Verify:** `bun test src/core` all green; every exported function has at least one test; coverage of `src/core` = 100% (`bun test --coverage`)

### Phase 3 Self-Review
1. Does every query/action call the right `require*()` and filter by `vendor_id`? (N/A for core rules - pure functions only, no db/io imports)
2. Is every money change an insert with an idempotency key, inside a transaction where needed? (Key generators enforce deterministic idempotency)
3. Is every time comparison done in Asia/Kolkata through `src/core` helpers? (Yes, `istDateTime` and `todayIST` enforce UTC+05:30)
4. Could anything here run twice and change the result? (No, verified by Gate 2 and Gate 3 replay tests)
5. Is there any file a newcomer couldn't understand in 2 minutes? (All core functions are concise, focused, and under 50 lines)
6. Any `any`, unused export, dead file, TODO without an owner, or console log? (Cleaned up, 0 errors, 0 warnings)
7. Does each screen do one job, at 360 px, with 48 px targets and words + colour for status? (N/A for core rules)
8. Did I invent anything not in the PRD or PROMPT.md? (No, followed exact business rules)

---

## Phase 4 — Auth and features
- [ ] Ask Hexclave's `/ask` endpoint how to set up `@hexclave/next` 1.0.125 with Next.js 16 App Router on OpenNext/Cloudflare Workers
- [ ] `src/lib/auth/hexclave.ts`, `src/lib/auth/session.ts`: `requireUser`, `requireVendorAccess(slug, roles)`, `requireAdmin()`, `requireCustomerByToken(token)`
- [ ] Feature folders with queries/actions/schemas
- [ ] Server Actions transactional + idempotent + input zod parsed
- [ ] Customer import: paste or CSV, validate, normalise phones, generate link token
- [ ] `/api/cron/tick`: Bearer CRON_SECRET, constant-time compare, locks cutoffs & monthly bills
- [ ] Integration tests
- **Verify:** `bun run typecheck && bun run lint && bun test` all green

---

## Phase 5 — App screens
- [ ] `(app)` layout + `/onboarding` + `/app` vendor picker/redirect
- [ ] `/app/[vendor]` layout + bottom nav
- [ ] Today screen: `CutoffTimer`, `BigCount`, replies progress, changes list
- [ ] Run screen: stops left, grouped society → tower → descending floor, `useOptimistic` Delivered, Failed, `QtyStepper`
- [ ] Customers screen: list, `/new`, `/[id]` khata timeline, adjustment sheet, copy/share/reset link
- [ ] Products screen: list + form
- [ ] Bills screen: this/last month, status pills, Mark paid, share link
- [ ] Settings screen: UPI ID, invite staff/driver, plan display
- [ ] Customer link `/c/[token]` + `/c/[token]/bills/[month]`
- [ ] `/admin`: pending vendors, suspend, lookup
- [ ] `loading.tsx` skeletons + `error.tsx` per segment; `EmptyState`, Sonner toasts
- **Verify:** walk full loop by hand in `bun run dev`

---

## Phase 6 — Landing page and public SEO pages
- [ ] `(marketing)` layout: static, no auth, no cookies/headers
- [ ] `/`, `/pricing`, `/for/tiffin-services`, `/for/water-suppliers`, `/in/bengaluru`, `/privacy`, `/terms`
- [ ] `src/lib/seo.ts`: `buildMetadata()`, JSON-LD
- [ ] `sitemap.ts`, `robots.ts`, `manifest.ts`, `opengraph-image.tsx`, `icon.tsx`, `not-found.tsx`, `global-error.tsx`
- [ ] Honest content only
- **Verify:** `bun run build` static marketing routes; Lighthouse mobile; landing JS < 70 KB gzipped

---

## Phase 7 — CI, end-to-end, deploy
- [ ] `.github/workflows/ci.yml`
- [ ] Playwright e2e tests
- [ ] Wrangler secrets & deploy smoke-test
- **Verify:** `bun run preview` passes Playwright; live ruxs.in smoke tests pass

---

## Known Gaps (MVP)
1. Turn on WhatsApp (Meta verification + `src/features/whatsapp`).
2. Payment gateway and auto-reconciliation (Razorpay/Cashfree UPI AutoPay).
3. Hindi and Kannada language localisation.
4. Household accounts and flatmate bill splitting.
5. Expansion to milk, newspaper, and additional neighborhood subscription services.
