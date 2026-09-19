# RUXS

**RUXS is a quiet operating layer for recurring local household services.**

[Domain](https://ruxs.in) · [GitHub](https://github.com/SH20RAJ/ruxs) · Cloudflare Workers · Next.js App Router

RUXS coordinates recurring services such as meals, water and dairy without making households repeat themselves every day.

## Product thesis

Local vendors already run the physical service. RUXS supplies the digital operating layer around that relationship:

- recurring subscriptions and defaults
- customer actions and cutoffs
- vendor preparation views
- delivery run sheets
- digital Khata and billing
- UPI-oriented payment flows
- household and dispute workflows

> People should only need to touch the system when something changes.

## Current status

RUXS is an active product prototype and engineering workspace. The repository contains the application shell, domain services, API routes, PostgreSQL/Drizzle schema, tests, deployment configuration and product/architecture documentation.

Production hardening remains in progress, particularly around authorization, durable persistence, tenant isolation, webhook controls and operational infrastructure. Treat the repository as an evolving prototype rather than a finished production service.

## Design system

The site and application shell now use one centralized visual language: **Editorial Utility**.

- dark ink surfaces with warm white type
- RUXS red for identity
- muted green for actions and healthy states
- Geist for interface copy
- restrained serif display typography for marketing
- 10 / 14 / 20px radius scale
- subtle borders and low-elevation surfaces
- spacing and hierarchy before decoration

Design tokens: src/design-system/tokens.ts

Design-system documentation: docs/design-system.md

Shared semantic styles: app/globals.css

## Product routes

| Route | Purpose |
| --- | --- |
| / | Marketing homepage |
| /subscribe | Household service setup |
| /vendor/onboard | Vendor onboarding |
| /login | Authentication |
| /vendor/dashboard | Vendor operations |
| /vendor/services | Vendor service catalog |
| /customer/dashboard | Household operations |
| /delivery | Driver run sheet |
| /household | Household management |
| /household/expenses | Shared expense workflows |
| /disputes | Dispute management |
| /admin | Platform administration |

Private application routes are intentionally excluded from the public sitemap.

## Technology

- TypeScript
- Next.js App Router
- React
- Tailwind CSS
- Bun
- Vite / Vinext
- Cloudflare Workers
- PostgreSQL
- Drizzle ORM
- Redis / queue-compatible architecture
- Meta WhatsApp Cloud API
- UPI-first payment abstraction

## Repository structure

app/ — Next.js pages and API routes

components/ — shared UI primitives

src/design-system/ — centralized design tokens

src/modules/ — domain modules

src/shared/ — shared auth, database, errors and types

docs/ — product, architecture, security and design-system documentation

drizzle/ — PostgreSQL migrations

public/ — PWA manifest, robots, sitemap and favicon

scripts/ — seed and maintenance scripts

## Development

bun install

bun run dev

bun run typecheck

bun run test

bun run build

bun run preview

bun run deploy

## Documentation

- docs/design-system.md
- docs/product/mvp.md
- docs/architecture/overview.md
- docs/architecture/authentication.md
- docs/architecture/authorization.md
- docs/security/security.md
- docs/checklists/MASTER.md

## License

Copyright © 2026 RUXS. All rights reserved.