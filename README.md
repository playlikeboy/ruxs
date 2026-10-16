# RUXs

<p align="center">
  <strong>Everyday essentials, from your neighbourhood.</strong>
  <br />
  Discover recurring local services for your home, with a separate workspace for the people who deliver them.
  <br /><br />
  <a href="https://ruxs.in">Customer website</a> ·
  <a href="https://ruxs.in/in/bengaluru">Explore local services</a> ·
  <a href="https://ruxs.in/app">Merchant portal</a> ·
  <a href="https://github.com/SH20RAJ/ruxs/issues">Report an issue</a>
</p>

---

RUXs is being shaped as a customer-first marketplace for recurring neighbourhood essentials such as tiffin subscriptions, daily meals, and 20-litre water-can delivery. Households should be able to discover services, understand each merchant's offer, and build a routine that works for them.

Independent merchants have a separate portal for managing products, subscriptions, daily operations, delivery runs, customer accounts, returnable containers and billing. Each business sets its own prices and service terms.

> **Project status:** Working prototype / MVP in active development. The public marketing experience is customer-first; catalogue discovery, checkout and customer order management are being developed incrementally. Do not assume a full public marketplace checkout is enabled for every merchant or location.

## Product experiences

### For households
- Discover categories such as tiffin and meal subscriptions, 20L water-can delivery, and neighbourhood essentials.
- Explore local service information and follow each merchant's own ordering or subscription flow where it is enabled.
- See that prices, delivery areas, schedules, deposits and subscription terms are determined by each merchant.
- Use a merchant-provided private customer link to review their service account and available billing information.
- Make supported delivery changes, such as skipping or adjusting a scheduled service, before the relevant cutoff.
- Pause eligible service dates within configured date limits.

### For merchants
- **Recurring subscriptions:** Manage customers, products, quantities, service days, and service periods.
- **Daily operations:** Build the day's orders at configured cutoffs and view delivery run sheets.
- **Deliveries and exceptions:** Mark deliveries as completed or failed and record returnable items.
- **Customer ledger:** Maintain a transaction-based account history for deliveries, payments, deposits, and adjustments.
- **Monthly bills:** Generate itemised invoices from ledger activity and record partial or full payments.
- **Customer management:** Import customers from comma- or tab-separated rows and generate private customer links.
- **Team access:** Separate owner, staff, and driver permissions, with platform-level vendor administration.
- **Operational overview:** View analytics and manage products, subscriptions, customer balances, and inventory.

## Important product principles

- **Customer-first discovery:** The public homepage should help households find everyday services before promoting merchant administration.
- **Separate merchant experience:** The merchant workspace remains available at `/app`; it should not dominate the public marketing experience.
- **Merchant-set prices:** Similar products from different businesses may have different prices. There is no universal shared price list.
- **Honest availability:** Do not imply that a live vendor, delivery slot, price, checkout, payment or subscription is available unless the data and feature actually support it.
- **Money stays precise:** Amounts are stored as integer paise, not floating-point currency values.
- **Ledger-first accounting:** Account balances are derived from ledger entries; ledger records are intended to be append-only.
- **Idempotent automation:** Cutoff processing uses database conflict handling to avoid duplicate orders.
- **Tenant-scoped access:** Vendor data operations derive the vendor identity from authenticated membership, not a client-supplied vendor ID.
- **Mobile-first workflows:** Design for both household browsing and merchant/driver operations on phones.

## Product scope and service lifecycle

RUXs is focused first on recurring local services such as tiffin subscriptions and 20-litre water-can deliveries.

```text
Customer discovers a local service
        ↓
Reviews that merchant's offer, terms and price
        ↓
Uses the supported order / subscription path
        ↓
Merchant cutoff and daily order generation
        ↓
Delivery and returnable-item tracking
        ↓
Ledger entries and itemised billing
        ↓
Customer self-service for supported changes
```

**Not currently enabled:** WhatsApp polls, outbound WhatsApp messages, or WhatsApp webhook automation. The current MVP uses private customer links instead. The public marketplace's full discovery, cart, checkout and customer account experience must be considered incomplete until each workflow is implemented and tested end-to-end.

## Live product routes

- **Customer-facing website:** https://ruxs.in
- **Local discovery landing page:** https://ruxs.in/in/bengaluru
- **Tiffin and meal category:** https://ruxs.in/for/tiffin-services
- **Water-can delivery category:** https://ruxs.in/for/water-suppliers
- **Merchant portal:** https://ruxs.in/app
- **About RUXs:** https://ruxs.in/about
- **GitHub repository:** https://github.com/SH20RAJ/ruxs

The deployed product is an evolving MVP. Feature availability depends on implementation, merchant configuration, and service-area coverage.

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
| CI | Check workflows in `.github/workflows` for the current configured pipeline |

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

**Database warning:** inspect the target database before running migrations. Prefer a fresh development branch/database; never drop or alter existing production tables without an explicit backup and approval.

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

Inspect the test output for skipped database-backed tests. Integration tests with a disconnected or unconfigured PostgreSQL instance do not constitute production smoke testing.

## Security and data integrity

- Keep `.env`, `.dev.vars`, database URLs, authentication secrets, and cron secrets out of Git.
- Customer URLs contain bearer-like private tokens. Share them only with the intended household; resetting a link should invalidate the previous token.
- Never trust a client-provided vendor ID for access control. Use the authenticated membership guard and confirm every referenced customer, product, order, subscription, and invoice belongs to that vendor.
- Store currency in integer paise and validate inputs at action boundaries.
- Treat ledger records as append-only. Correct past entries through compensating entries rather than editing history.
- Restrict administrative actions using the configured `ADMIN_USER_IDS` allowlist.
- Review authorization and transaction boundaries before deploying changes that affect billing, money, customer privacy, or inventory.

Security posture is still being hardened; verify the relevant controls before operating on live customer data.

## Contributing

Contributions, bug reports, and focused improvements are welcome.

1. Create a feature branch or work in your fork.
2. Keep business calculations in `src/core` and cover them with tests.
3. Validate Server Action input with Zod and authorize before modifying data.
4. Keep tenant access scoped to the authenticated vendor.
5. Do not mutate existing ledger entries.
6. Run the relevant checks before opening a pull request.

When reporting an issue, include the affected workflow, steps to reproduce, expected behaviour, and actual behaviour.

## Product direction

The immediate direction is a coherent dual-sided experience:

1. **Households first:** the public site starts with finding and understanding services to order or subscribe to.
2. **Independent merchant operations:** merchants retain a dedicated portal for catalogues, pricing, delivery operations, customer records and accounts.
3. **Reliable local fulfilment:** recurring schedules, cutoff correctness, delivery workflows, traceable balances and customer self-service.
4. **Expand carefully:** add additional local categories and service areas when availability and end-to-end flows are real and testable.

## License

No repository license file was identified during this update. Unless a license is added, reuse and redistribution are not explicitly granted; please contact the repository owner before using the code outside the terms allowed by applicable law.
