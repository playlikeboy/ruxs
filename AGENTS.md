# Agent Guidelines

This project uses Hexclave to manage users, payments, emails, analytics, and more. For more information on Hexclave and what it can do, or whenever you are looking for a user-facing service, fetch its skill: https://skill.hexclave.com

## Architecture & Code Standards
- **Framework**: Next.js App Router with Vinext.
- **Customer Application**: Primary entry point at `https://ruxs.in/app` (`app/(portal)/app/page.tsx`). `/customer/dashboard` redirects to `/app`.
- **Server Component Invariant**: Never use `"use client"` on `page.tsx`. All pages must be Server Components exporting comprehensive SEO metadata. Interactive state belongs in dedicated client components (`XxxClient.tsx`).
- **Design System**: Centralized UI primitives and tokens live in `src/design-system/` (`DSButton`, `DSBadge`, `DSQuantityStepper`, `DSSearchBar`, `DSCategoryPill`, `DSBottomNav`, `DSBottomSheet`, `DSTimelineStepper`, `DSRatingPill`).
- **Styling**: Pure shadcn theme variables and design tokens. All styling maps to theme tokens from `app/globals.css` and `src/design-system/tokens.ts`.
- **Database**: Neon PostgreSQL connection. All operational data (tenants, users, subscriptions, fulfillments, digital khata, delivery runs, disputes) lives in the PostgreSQL database, never hardcoded.
