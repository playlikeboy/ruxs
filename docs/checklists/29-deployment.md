# Checklist 29: Production Deployment & Infrastructure

## Goal
Automate production deployment to Cloudflare Workers with zero-downtime database migrations.

## Requirements
- [x] GitHub Actions deployment pipeline targeting Cloudflare Workers (.github/workflows/ci.yml)
- [x] Production secrets injection via Wrangler CLI & GitHub Secrets
- [x] Staging vs Production environment isolation (APP_ENV flags & dev fallbacks)
- [x] Database connection pooling via Neon AWS PostgreSQL pooler

## Implementation
- [x] Database/model (Custom idempotent migration runner src/shared/db/migrate.ts)
- [x] Server-side logic (Edge Next.js App Router with Vinext on Cloudflare)
- [x] UI
- [x] Validation
- [x] Error handling
- [x] Tests
- [x] Documentation

## Acceptance Criteria
- [x] bun run deploy deploys successfully to ruxs.in
- [x] Zero downtime during schema migrations

## Verification
- [x] Local test passed
- [x] Build passed (bun run build compiled in 3.95s)
- [x] Relevant tests passed (99/99 unit & integration tests)
- [x] Manual verification passed

## Git
- Commit: chore: configure zero-downtime migration runner and deployment pipeline
- Push: SUCCESS
- Branch: main
