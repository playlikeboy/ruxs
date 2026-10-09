# RUXS agent rules

The build spec is `docs/PRD.md`. Read it before changing anything; long-term context is in `RUXS_STARTUP_OVERVIEW.md`.
Hexclave handles auth — fetch its skill (https://skill.hexclave.com) before touching auth code.

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
