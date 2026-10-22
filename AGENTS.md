# RUXs agent rules

Start with `PROMPT.md` (build order, checklists, and decisions that override the PRD). The full spec is `docs/PRD.md`; long-term context is in `RUXS_STARTUP_OVERVIEW.md`.

**Product direction (updated 2026-10-15):** RUXs has four surfaces. (1) The static public site. (2) The household app at `/app` (Hexclave sign-in at `/sign-in`): browse nearby stores by category (tiffin, water, milk, other), one-store cart and checkout (pay on delivery or add to monthly bill), subscriptions with per-day skip, orders and plans. (3) The merchant panel at `/merchant-panel` (its own sign-in at `/merchant-panel/sign-in`): orders, plans, menu CRUD, run sheet, bills, storefront settings. (4) The admin panel at `/admin`. Households never see vendor phone numbers. Products are archived, never deleted (orders reference them).

**MVP overrides:** WhatsApp is paused — households use the private link `/c/[token]` to Deliver/Skip/Extra; no webhook, no `messages`/`webhook_events` tables, no `WHATSAPP_*` env. The schema is 11 tables (adds `vendor_invites`) plus the marketplace tables `consumers`, `shop_orders`, `shop_order_items` (migration 0003). See `PROMPT.md` §2.
**Vendor types (updated 2026-10-22):** every vendor is exactly one `vendor_type` (tiffin, water, milk, gifts, store, fitness, physio, mehndi, kids — `src/core/vendor-types.ts`). The type decides its tables (profile tables like `tiffin_kitchens`, `physio_clinics`; item tables like `tiffin_meals`, `water_cans`, `fitness_packages`; kids uses `kids_provider_profiles` + `kids_services`), its merchant-panel tools (`requireVendorModule()` gates every page) and the categories it may list under. DB triggers (migration 0013) reject rows written for the wrong type. Type-specific form fields live in `src/features/vendor-types/fields.ts`. Hand-written SQL migrations run via `scripts/apply-sql-migrations.ts`.
**Adding a new service or category** (gym trainers, maids, tutors, groceries…): follow `docs/ADDING_SERVICES.md`. Most services are data-only (`/admin/settings`); only a new fulfilment model needs code.
Hexclave handles auth — fetch its skill (https://skill.hexclave.com) before touching auth code.


## Frontend and design-system rules

For every UI change, read `PRODUCT.md` and `DESIGN.md` first. Follow the Impeccable design guidance at https://impeccable.style/: use Operate-mode restraint for authenticated app/merchant/admin surfaces and Persuade-mode brand expression for public marketing. Treat the logo palette and existing tokens as source of truth; avoid generic AI-generated gradients, nested cards, decorative motion and invented product claims. Do not claim a visual browser review or automated detector/build ran unless it actually did.

## Hard lines
1. Money is integer paise. Never floats.
2. Never UPDATE or DELETE a `ledger_entries` row. Fix mistakes with a new reversing entry.
3. `vendorId` comes only from `requireVendorAccess()` — never from a form, URL query or body.

## Layers (PRD §6)
`src/app` routes only → `src/features/*` (queries.ts "server-only", actions.ts "use server" + zod + auth) → `src/core` (pure rules, fully tested) → `src/db` (only place importing drizzle).

## Next.js rules (PRD §13)
- Server Components by default; never `"use client"` on page.tsx/layout.tsx.
- In-app writes are Server Actions; `app/api` is only for the WhatsApp webhook and cron tick.
- No `proxy.ts`/middleware (OpenNext can't run it); auth checks live in queries/actions.
- Marketing pages stay static: no cookies()/headers()/auth there.
- `getDb()` per request (Hyperdrive, `maxUses: 1`); env via `src/lib/env.ts`.
- `await params/searchParams/cookies()/headers()`. `@/` imports, no barrel files.

## Business rules (PRD §10)
Lateness by tap time vs. IST cutoff; store only day changes before cutoff; write orders in one idempotent INSERT…SELECT at cutoff; late skips change the charge not the count; insert-only ledger with idempotency keys; bills computed from the ledger.

## Commands
`bun run dev` · `bun run typecheck` · `bun run lint` · `bun test` · `bun run db:generate` · `bun run db:migrate` · `bun run preview` · `bun run deploy`

## Git
Work on `main`, commit as SH20RAJ, no AI co-author lines.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
