# Architecture Specification: Codebase Folder Structure

**Classification:** `[CONFIRMED ARCHITECTURAL SPECIFICATION]`

---

## 1. Modular Directory Organization

RUXS follows a domain-oriented modular Next.js App Router structure:

```
ruxx/
├── app/                              # Next.js App Router Entry Points
│   ├── (app)/                         # Marketing + public application shell
│   │   ├── page.tsx                  # Public landing page
│   │   ├── login/                    # Shared authentication entry
│   │   ├── subscribe/                # Customer service setup
│   │   └── ...                       # Public/secondary application pages
│   ├── (portal)/                      # Isolated authenticated operational workspaces
│   │   ├── customer/                  # Shared customer workspace chrome
│   │   │   ├── dashboard/             # Customer household command center
│   │   │   ├── subscribe/             # Recurring services workspace
│   │   │   ├── household/             # Flatmates & permissions
│   │   │   ├── expenses/              # Shared expense settlement
│   │   │   └── onboard/               # Household profile setup
│   │   └── vendor/
│   │       ├── dashboard/            # Vendor operations command center
│   │       ├── services/             # Service & pricing configuration
│   │       └── onboard/              # Customer invite/onboarding
│   ├── (admin)/                       # Isolated platform administration workspace
│   │   └── admin/                    # Platform control center
│   ├── api/                           # HTTP Route Handlers
│   │   ├── auth/                     # Auth, session and role destination handlers
│   │   ├── webhooks/                 # Ingress Webhooks (WhatsApp, Payments)
│   │   └── crons/                    # Scheduled Worker Triggers
│   ├── api/                          # HTTP Route Handlers
│   │   ├── auth/                     # OTP Request & Verification Handlers
│   │   ├── webhooks/                 # Ingress Webhooks (WhatsApp, Payments)
│   │   └── crons/                    # Scheduled Worker Triggers
│   ├── layout.tsx                    # Global RootLayout with App Shell
│   ├── globals.css                   # Global CSS & Tailwind Directives
│   ├── loading.tsx                   # Suspense Fallback
│   ├── error.tsx                     # Global Error Boundary
│   └── not-found.tsx                 # 404 Route
├── src/                              # Core Domain & Shared Libraries
│   ├── modules/                      # Domain Bounded Contexts
│   │   ├── subscriptions/            # Subscription models, services, recurrence
│   │   ├── fulfillment/              # Daily fulfillment FSM & generators
│   │   ├── cutoff/                   # Cutoff window evaluators & batch counters
│   │   ├── khata/                    # Double-entry ledger calculations
│   │   ├── assets/                   # Physical container holding calculations
│   │   ├── billing/                  # Monthly invoice derivation
│   │   ├── payments/                 # Gateway adapters & webhook verification
│   │   └── whatsapp/                 # Meta Cloud API client & template builders
│   ├── shared/                       # Cross-cutting Utilities
│   │   ├── db/                       # Database client, Drizzle schema & migrations
│   │   ├── auth/                     # JWT session encoding & edge guards
│   │   ├── types/                    # Domain entities, Money/Paise types
│   │   └── validators/               # Zod validation schemas
├── docs/                             # Executable Documentation System
└── public/                           # Static Assets, PWA Manifest & App Icons
```
