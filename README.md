<p align="center">
  <a href="https://ruxs.in" target="_blank" rel="noopener noreferrer">
    <img src="https://ruxs.in/brand/ruxs-app-icon.svg" width="96" height="96" alt="RUXs Logo" />
  </a>
</p>

<h1 align="center">RUXs</h1>

<p align="center">
  <strong>Everyday essentials, from people in your neighbourhood.</strong>
  <br />
  A modern, dual-sided platform for recurring home subscriptions, daily deliveries, and local service providers.
</p>

<p align="center">
  <a href="https://github.com/playlikeboy/ruxs/actions/workflows/ci.yml">
    <img src="https://github.com/playlikeboy/ruxs/actions/workflows/ci.yml/badge.svg" alt="CI & Deployment Status" />
  </a>
  <a href="https://ruxs.in">
    <img src="https://img.shields.io/badge/Live-ruxs.in-006241?style=flat&logo=cloudflare&logoColor=white" alt="Live Website" />
  </a>
  <a href="https://nextjs.org">
    <img src="https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js" alt="Next.js" />
  </a>
  <a href="https://developers.cloudflare.com/workers/">
    <img src="https://img.shields.io/badge/Cloudflare_Workers-OpenNext-F38020?style=flat&logo=cloudflare" alt="Cloudflare Workers" />
  </a>
  <a href="https://bun.sh">
    <img src="https://img.shields.io/badge/Runtime-Bun_1.4-fbf0df?style=flat&logo=bun&logoColor=black" alt="Bun Runtime" />
  </a>
  <a href="https://orm.drizzle.team">
    <img src="https://img.shields.io/badge/ORM-Drizzle_PostgreSQL-C5F74F?style=flat&logo=drizzle&logoColor=black" alt="Drizzle ORM" />
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
</p>

<p align="center">
  <a href="https://ruxs.in"><strong>Public Website</strong></a> ·
  <a href="https://ruxs.in/app"><strong>Household App</strong></a> ·
  <a href="https://ruxs.in/merchant-panel"><strong>Merchant Operations</strong></a> ·
  <a href="https://ruxs.in/admin"><strong>Admin Console</strong></a> ·
  <a href="https://github.com/SH20RAJ/ruxs"><strong>GitHub</strong></a>
</p>

---

<p align="center">
  <a href="https://ruxs.in">
    <img src="https://ruxs.in/og.jpg" width="100%" alt="RUXs — Everyday essentials, from your neighbourhood" style="border-radius: 16px; border: 1px solid rgba(0,0,0,0.1);" />
  </a>
</p>

---

## 🌟 What is RUXs?

**RUXs** is a hyperlocal commerce platform built to organize everyday neighbourhood subscriptions and essential services. From homemade daily tiffin and 20-litre filtered water-can delivery to kids academy workshops, milk deliveries, gym trainers, physiotherapists, and local stores — RUXs bridges households with the trusted providers operating in their community.

Instead of generic one-off ordering, RUXs is designed ground-up for **recurring routines**:
- Daily delivery cutoff scheduling with automatic skip & extra management.
- Double-entry, append-only financial ledgers with monthly itemized invoicing.
- Private customer portal links (`/c/[token]`) for effortless household self-service without requiring complex passwords.
- Multi-tenant operational workflows tailored to each distinct vendor type.

---

## 🗺️ The Four Surfaces

RUXs divides functionality into four purpose-built, secure surfaces:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                                 RUXS                                   │
├───────────────────┬────────────────────┬─────────────────┬─────────────┤
│ 1. Public Site    │ 2. Household App   │ 3. Merchant Ops │ 4. Admin    │
│    (Static/SEO)   │    (/app)          │    (/merchant-  │    (/admin) │
│                   │                    │     panel)      │             │
│ • Story & brand   │ • Nearby stores    │ • Orders & run  │ • Vendors   │
│ • Pricing & trust │ • 1-store cart     │   sheet         │ • KYC apps  │
│ • Category pages  │ • Subscriptions    │ • Menu & item   │ • Invoices  │
│ • Apply to vend   │ • Skip/Extra days  │   catalog       │ • Platform  │
│                   │ • Order history    │ • Ledger/Bills  │   settings  │
└───────────────────┴────────────────────┴─────────────────┴─────────────┘
```

1. **Static Public Site (`/`, `/about`, `/pricing`, `/for/*`)**: Ultra-fast, edge-cached landing pages that introduce the platform and onboard new merchants.
2. **Household Marketplace App (`/app`)**: Authenticated consumer experience powered by Hexclave. Households browse local merchants by category, manage single-store carts, subscribe to meal or water schedules, and review active orders.
3. **Merchant Operations Panel (`/merchant-panel`)**: Dedicated portal for vendors to review morning delivery run sheets, adjust availability, manage item catalogs, record returnable container deposits, and issue monthly bills.
4. **Platform Administration (`/admin`)**: Console for platform operators to review incoming vendor applications, verify vendor profiles, audit financial ledgers, and adjust platform settings.

---

## 🍱 Supported Vendor & Service Domains

Every vendor on RUXs belongs to an explicit **vendor type** that unlocks customized schemas, fields, and operational tools:

| Vendor Type | Key Specializations & Features |
| :--- | :--- |
| **Tiffin & Meals** (`tiffin`) | Meal shift selection (Lunch/Dinner), dietary preferences (Veg, Jain, Non-Veg), per-day skip/extra cutoffs, delivery runs. |
| **Water Suppliers** (`water`) | 20L returnable cans, dispenser tracking, security deposit ledger, bottle inventory reconciliation. |
| **Fresh Milk** (`milk`) | Morning & evening delivery slots, fat content tiers, glass/pouch container tracking. |
| **Kids Activities** (`kids`) | STEM workshops, gymnastics, tutoring, martial arts, age-group filters, trial sessions, pass ticketing. |
| **Fitness & Gym** (`fitness`) | Personal trainer packages, session slots, home vs. studio training schedules. |
| **Physiotherapy** (`physio`) | Clinic consultation & home-visit sessions, specialization tags, health assessment notes. |
| **Mehndi & Bridal** (`mehndi`) | Occasion packages, artist portfolios, travel fees, hourly & design-tier bookings. |
| **Neighbourhood Store** (`store`) | General grocery, pantry staples, local inventory catalog, same-day delivery. |
| **Gifts & Florists** (`gifts`) | Occasion delivery schedules, custom message cards, scheduled calendar dates. |

---

## 🔒 Core Architecture & Financial Guarantees

The codebase enforces strict, non-negotiable financial and architectural invariant rules:

1. **Money is Integer Paise (Never Floats)**: All monetary calculations are performed in integer paise ($₹1.00 = 100\text{ paise}$) to prevent floating-point rounding errors.
2. **Append-Only Financial Ledger**: The `ledger_entries` table never allows `UPDATE` or `DELETE` operations. Corrections and refunds are recorded as new compensating ledger entries with idempotency keys.
3. **Secure Vendor Tenancy**: `vendorId` is derived exclusively from the authenticated session guard (`requireVendorAccess()`), never from client input, route params, or query strings.
4. **Automated Cutoff Processing**: Orders are created at specified cutoffs in a single, idempotent `INSERT ... SELECT` database query to prevent duplicates.
5. **Private Household Links**: Customer management links (`/c/[token]`) allow households to adjust upcoming orders (Deliver / Skip / Extra) without friction.

---

## 🛠️ Technology Stack

```
Runtime & Language   │ Bun 1.4 · TypeScript 5.x
Framework            │ Next.js 16.4 (App Router, Server Actions)
Edge Deployment      │ Cloudflare Workers · OpenNext Cloudflare
Database & Cache     │ Neon PostgreSQL (Serverless) · Cloudflare Hyperdrive
ORM & Migrations     │ Drizzle ORM · Drizzle Kit
Authentication       │ Hexclave Next.js SDK
Payments             │ Razorpay
Styling & Design     │ Tailwind CSS · Impeccable Design System
```

---

## 🚀 Local Development Setup

### Prerequisites

- [Bun](https://bun.sh/) (version 1.4+)
- PostgreSQL 16+ or a [Neon](https://neon.tech) serverless database
- Node.js 20+

### 1. Clone & Install

```bash
git clone https://github.com/SH20RAJ/ruxs.git
cd ruxs
bun install --frozen-lockfile
```

### 2. Configure Environment

Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Fill in your configuration variables in `.env.local`:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID="your-hexclave-project-id"
NEXT_PUBLIC_HEXCLAVE_API_URL="https://api.hexclave.com"
HEXCLAVE_SECRET_SERVER_KEY="ssk_your_hexclave_secret_key"
CRON_SECRET="your-cron-secret-token"
```

### 3. Run Migrations & Start Server

```bash
# Apply database migrations
bun run db:migrate

# Start Next.js development server
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Quality Gates

Run the automated test suite and static checks before opening pull requests:

```bash
# Run pure business-rule core unit tests
bun test src/core

# Run all unit and integration tests
bun test src tests

# Run TypeScript typecheck
bun run typecheck

# Run ESLint quality gates
bun run lint
```

---

## 📦 Deployment & CI/CD

Deployments are automated through GitHub Actions using `@opennextjs/cloudflare`:

- **Pull Requests**: Runs type checking, linting, tests against an ephemeral PostgreSQL service container, and validates the Next.js production bundle.
- **Push to `main`**: Automatically packages the application with OpenNext and deploys to Cloudflare Workers with custom domains (`ruxs.in`, `www.ruxs.in`) and cron workers.

```bash
# Manual preview with Wrangler
bun run preview

# Manual deployment to Cloudflare
bun run deploy
```

---

## 📄 License

Copyright © 2026 RUXs Inc. All rights reserved. Code is provided for evaluation and authorized contribution under the terms established by the repository maintainers.
