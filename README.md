# RUXS

<p align="center">
  <strong>Your everyday life, on autopilot.</strong>
  <br />
  A quiet operating layer for recurring local household services.
  <br /><br />
  <a href="https://ruxs.in">Website</a> ·
  <a href="https://ruxs.in/about">About</a> ·
  <a href="https://github.com/SH20RAJ/ruxs/issues">Report an issue</a>
</p>

---

RUXS helps neighbourhood service businesses manage recurring household deliveries without juggling paper registers, scattered messages, and manual month-end calculations. It gives local vendors a simple workspace for subscriptions, daily delivery operations, customer balances, returnable containers, and billing—while households use a private link to manage day-to-day changes.

**RUXS is software for local vendors, not a quick-commerce marketplace.** Vendors keep their customer relationships, service routines, and pricing; RUXS provides the operating tools behind them.

> **Project status:** Working prototype / MVP in active development. Production hardening is ongoing. WhatsApp integration is currently paused; customer actions use private links.

## What it does

### For local vendors
- **Recurring subscriptions:** Manage customers, products, quantities, service days, and service periods.
- **Daily operations:** Build the day’s orders automatically at configured cutoffs and view delivery run sheets.
- **Deliveries and exceptions:** Mark deliveries as completed or failed and record returnable items.
- **Customer ledger:** Maintain a transaction-based account history for deliveries, payments, deposits, and adjustments.
- **Monthly bills:** Generate itemised invoices from ledger activity and record partial or full payments.
- **Customer management:** Import customers from comma- or tab-separated rows and generate private customer links.
- **Team access:** Separate owner, staff, and driver permissions, with platform-level vendor administration.
- **Operational overview:** View analytics and manage products, subscriptions, customer balances, and inventory.

### For households
- Open a private customer link—no native app installation is required.
- Review the service account and available billing information.
- Make permitted delivery changes, such as skipping or adjusting a scheduled service, before the relevant cutoff.
- Pause eligible service dates within the configured date limits.

### Core design principles
- **Money stays precise:** amounts are stored as integer paise, not floating-point currency values.
- **Ledger-first accounting:** account balances are derived from ledger entries; ledger records are intended to be append-only.
- **Idempotent automation:** cutoff processing uses database conflict handling to avoid duplicate orders.
- **Tenant-scoped access:** vendor data operations should derive the vendor identity from authenticated membership, not trust a client-supplied vendor ID.
- **Mobile-first operations:** practical screens for business owners and delivery teams.
- **No marketplace markup:** vendors set their own products and prices.

## Product scope

RUXS is being shaped around recurring local services such as tiffin subscriptions and 20-litre water-can deliveries. The architecture keeps the daily workflow consistent:

```text
Recurring subscription
        ↓
Customer makes a day change (optional)
        ↓
Service cutoff
        ↓
Daily order / kitchen count
        ↓
Delivery and returnable-item tracking
        ↓
Ledger entries
        ↓
Monthly itemised invoice
```

**Not currently enabled:** WhatsApp polls, outbound WhatsApp messages, or WhatsApp webhook automation. The current MVP uses private customer links instead.

## Live product

- **Website:** https://ruxs.in
- **Merchant workspace:** https://ruxs.in/app
- **About RUXS:** https://ruxs.in/about
- **GitHub repository:** https://github.com/SH20RAJ/ruxs

The deployed website is the intended entry point. Features and availability may change while the MVP is under active development.

## Technology

| Area | Technology |
| --- | --- |
| Web application | Next.js App Router, React, TypeScript |
| UI styling | Tailwind CSS |
| Authentication | Hexclave Next.js SDK |
| Database | PostgreSQL |
| Data access / schema | Drizzle ORM and Drizzle Kit |
| Validation | Zod |
| Runtime / deployment | Cloudflare Workers with OpenNext |
| Database connectivity | Cloudflare Hyperdrive |
| Tests | Bun test runner; integration tests can use a configured database |
| CI | GitHub Actions for type checking, linting, core tests, and production build |

Versions are managed in `package.json` and `bun.lock`.

## Architecture

The application is organised by business feature, with pure business rules kept separate from database and framework code.

```text
src/
├── app/               Next.js routes, layouts, metadata, and cron endpoint
├── core/              Pure business rules and unit tests
├── db/
│   ├── schema/        PostgreSQL schema definitions
│   ├── migrations/    Versioned SQL migrations
│   └── seed.ts        Demo data seeding
├── features/
│   ├── admin/         Platform administration
│   ├── analytics/     Business analytics
│   ├── assets/        Returnable-item inventory
│   ├── billing/       Invoice generation and status
│   ├── customers/     Customer import, private links, and account views
│   ├── day-changes/   Skip, extra, quantity, and pause workflows
│   ├── ledger/        Payments, adjustments, and account entries
│   ├── orders/        Cutoff generation and delivery operations
│   ├── products/      Product catalogue
│   ├── subscriptions/ Recurring service schedules
│   └── vendors/       Vendor profiles, membership, and invites
└── lib/
    ├── auth/          Authentication and access guards
    └── env.ts         Environment validation
```

Typical request flow:

```text
Next.js route or Server Action
        ↓
Feature query/action (validation + authorization)
        ↓
Pure rule in src/core (where applicable)
        ↓
Drizzle ORM
        ↓
PostgreSQL through Cloudflare Hyperdrive
```

The Cloudflare Worker also schedules a once-per-minute request to `POST /api/cron/tick`. That endpoint checks a bearer secret, processes eligible service cutoffs, and generates monthly invoices when the billing window is reached.

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) (the repository declares Bun as its package manager)
- Node.js compatible with the locked dependencies and Next.js toolchain
- A PostgreSQL database for database-backed workflows
- A Hexclave project for authentication
- Cloudflare account and Wrangler authentication for local Cloudflare preview or deployment

### 1. Clone and install

```bash
git clone https://github.com/SH20RAJ/ruxs.git
cd ruxs
bun install --frozen-lockfile
```

### 2. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Set the values required by your environment. Never commit real secrets.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public application URL (local or deployed) |
| `NEXT_PUBLIC_HEXCLAVE_API_URL` | Hexclave API base URL |
| `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` | Hexclave project identifier |
| `HEXCLAVE_SECRET_SERVER_KEY` | Server-side Hexclave credential |
| `DATABASE_URL` | PostgreSQL URL for migrations, scripts, and tests |
| `CRON_SECRET` | Secret used to authorize scheduled cron requests |
| `ADMIN_USER_IDS` | Comma-separated allowlist of platform admin user IDs |
| `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` | Local Hyperdrive-compatible PostgreSQL connection string for development |

The `WHATSAPP_*` values in `.env.example` are placeholders for future integration and are not part of the current MVP workflow. Do not add real credentials to source control.

### 3. Start the development server

```bash
bun run dev
```

Open http://localhost:3000.

The production database and Cloudflare bindings may require additional local configuration. Do not point local development or tests at a production database unless you explicitly intend to use it.

### 4. Database migrations and seed data

After configuring a suitable development database:

```bash
bun run db:generate
bun run db:migrate
bun run db:seed
```

**Database warning:** inspect the target database before running migrations. The project build notes mention an older prototype schema in the existing Neon database. Prefer a fresh development branch/database; never drop or alter existing production tables without an explicit backup and approval.

## Development commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start Next.js development server |
| `bun run build` | Build the Next.js application |
| `bun run start` | Start the built Next.js server |
| `bun run preview` | Build and preview with OpenNext / Wrangler |
| `bun run deploy` | Build and deploy to Cloudflare Workers |
| `bun run upload` | Build and upload the Worker bundle |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript without emitting files |
| `bun test src/core` | Run pure core-rule tests |
| `bun test src tests` | Run unit and configured integration tests |
| `bun run test:e2e` | Run Playwright end-to-end tests |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Apply migrations |
| `bun run db:seed` | Seed demo data |

CI currently runs dependency installation, type checking, linting, core tests, and a production build. Database integration tests require a reachable development database and are not a substitute for production smoke testing.

## Security and data integrity

- Keep `.env`, `.dev.vars`, database URLs, authentication secrets, and cron secrets out of Git.
- Customer URLs contain bearer-like private tokens. Share them only with the intended household; resetting a link should invalidate the previous token.
- Never trust a client-provided vendor ID for access control. Use the authenticated membership guard and confirm every referenced customer, product, order, subscription, and invoice belongs to that vendor.
- Store currency in integer paise and validate inputs at action boundaries.
- Treat ledger records as append-only. Correct past entries through compensating entries rather than editing history.
- Restrict administrative actions using the configured `ADMIN_USER_IDS` allowlist.
- Review authorization and transaction boundaries before deploying changes that affect billing, money, customer privacy, or inventory.

Security posture is still being hardened; see the audit notes in the repository's issue tracker and verify all recommendations before operating on live customer data.

## Testing

Core business rules have colocated `*.test.ts` files and are runnable without a live database:

```bash
bun test src/core
```

To run the broader test suite:

```bash
bun test src tests
```

Integration tests may skip database-backed scenarios if their configured PostgreSQL instance is not reachable. For meaningful verification, use a disposable development database and inspect the test output for skipped tests.

## Contributing

Contributions, bug reports, and focused improvements are welcome.

1. Create a feature branch or work in your fork.
2. Keep business calculations in `src/core` and cover them with tests.
3. Validate Server Action input with Zod and authorize before modifying data.
4. Keep tenant access scoped to the authenticated vendor.
5. Do not mutate existing ledger entries.
6. Run the relevant checks before opening a pull request.

Please include the affected workflow, steps to reproduce, expected behaviour, and actual behaviour when filing a bug.

## Roadmap direction

RUXS is focused first on dependable recurring-service operations: scheduling, cutoff correctness, delivery workflows, traceable balances, customer self-service, and billing. Integrations such as WhatsApp remain future work and should not be treated as active product functionality until implemented and verified.

## License

No repository license file was identified during this README update. Unless a license is added, reuse and redistribution are not explicitly granted; please contact the repository owner before using the code outside the terms allowed by applicable law.
