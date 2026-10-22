# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Urban Households & Families**:
   - Apartment dwellers, working parents, and bachelors needing daily meal subscriptions (tiffin), 20L drinking water cans, fresh morning milk, and local grocery essentials.
   - Parents looking for verified local tutors, STEM coaches, dance instructors, and holiday camps for their children without chaotic WhatsApp coordination or unsafe private visits.
   - Seniors and family members who need a simple interface without installing heavyweight native apps or remembering passwords.

2. **Independent Neighborhood Merchants & Providers**:
   - Home tiffin kitchen owners, local water-can delivery agencies, milk distributors, and grocery stores.
   - Qualified educators, home tutors, choreographers, sports coaches, and creative workshop organizers.
   - Need reliable morning/evening cutoff locks, automated delivery run sheets sorted by society/tower/floor, append-only ledgers, and zero-commission direct UPI payments.

3. **Platform Administrators**:
   - Neighborhood market managers overseeing vendor onboarding, credentials verification, safety compliance, and dispute resolution.

---

## Product Purpose

RUXs replaces chaotic WhatsApp groups, lost paper notebooks, and predatory 30% delivery commission platforms with a calm, hyper-local neighborhood operating system.

It exists to give local service providers professional operating tools while giving households reliable, predictable everyday essentials and verified family enrichment close to home.

Success means:
- Kitchens lock their cook count exactly at cutoff and waste zero food.
- Households manage daily deliveries in one tap via private links or the `/app` portal.
- Parents book verified mentors with clear child safeguarding and non-toxic guarantees.
- Merchants receive 100% of their earnings directly to their bank accounts via UPI with zero transaction deductions.

---

## Positioning

Unlike aggregator apps (Swiggy, Zomato, Urban Company) that charge 25–35% commissions, intermediate customer relationships, and push unpredictable gig workers:
- **Zero Commission**: RUXs charges zero per-order commission; merchants keep 100% of their billings.
- **Private Household Links (`/c/[token]`)**: Households manage skips and extras without downloading an app or creating a password.
- **Idempotent Cutoff Mechanics**: Strict morning and evening cutoff times (Asia/Kolkata) that compute locked kitchen counts and generate append-only ledger entries in integer paise.
- **Child Safeguarding Architecture**: Strict separation of home services vs physical products, requiring mandatory guardian presence for home tutoring and verified non-toxic materials for activity kits.
- **DPDP Act 2023 Compliance**: Customer phone numbers and addresses are strictly protected; delivery drivers receive building/floor run sheets without accessing raw phone directories.

---

## Operating Context

- **The Kitchen Morning Rush (09:00 - 10:30 AM IST)**: Tiffin cooks check the large 48px tabular kitchen count screen across a hot, steamy kitchen to prepare exact dabba counts.
- **The Driver's Route (11:00 AM - 01:00 PM IST)**: Delivery boys on scooters navigating high-rise apartment complexes with a thumb-friendly mobile run sheet sorted by building society, tower, and descending floor (e.g. 14th floor down to 1st floor) to eliminate lift delays.
- **The Parent's Evening (07:00 - 09:00 PM IST)**: Working parents planning their child's week—booking an abacus tutor, reserving a weekend robotics workshop, or ordering an origami kit.
- **The First of the Month (10:00 AM IST)**: Automatic itemized monthly bills computed directly from immutable ledger lines, delivered with direct UPI payment links.

---

## Capabilities and Constraints

- **Four Product Surfaces**:
  1. `(marketing)`: Fast, static public website with zero auth overhead.
  2. `(shop)` (`/app`): Household portal for browsing local stores, one-store cart, subscriptions, and Kids Zone.
  3. `(app)` (`/merchant-panel`): Merchant workspace for managing products, services, calendar, run sheets, and billing.
  4. `(admin)` (`/admin`): Super-admin console for vendor auto-approval, type profiles, and dispute mediation.
- **Technical Constraints**:
  - Cloudflare Workers + OpenNext edge runtime (no Node server processes, no filesystem writes at runtime).
  - Hyperdrive-pooled PostgreSQL on Neon with Drizzle ORM.
  - Zero floats for money: all monetary amounts are integer paise (1 INR = 100 paise).
  - Strictly Asia/Kolkata time calculations for cutoffs and billing ticks.
  - Verification & Media: ImgBB API for certificate and photo hosting; YouTube embed parser for preview lessons.

---

## Brand Commitments

- **Tone & Voice**: Calm, honest, practical, and respectful. Indian neighborhood warmth made premium through craft and restraint.
- **Visual Identity**: Warm ivory backgrounds (`#FAFAF7`), crisp hairline borders (`#E7E5DF`), deep ink typography (`#1C1B19`), and single coral focal accent (`#BD4B2A`).
- **No Deceptive Patterns**: Never hide fees, never manipulate ratings, never lock customers into deceptive subscription cycles, never fabricate false scarcity counters.

---

## Evidence on Hand

- Fully working multi-tenant schema with 10 kids vendor types, daily tiffins, water cans, dairy, and local stores.
- 134 automated unit and integration tests passing with 482 assertions across pure core rules.
- Live deployment active on Cloudflare Workers edge network at `https://ruxs.in`.

---

## Product Principles

1. **Restraint Over Noise**: The app should feel like a well-kept neighborhood notebook, not a casino or ad-filled delivery feed.
2. **Deterministic & Immutable**: Never update or delete ledger records; mistakes are fixed with transparent reversing entries.
3. **Protect the Vulnerable**: Children and seniors come first. Home services require guardian presence; interfaces must work seamlessly without native app barriers.
4. **Local Sovereignty**: Independent providers own their pricing, schedules, and customer relationships.
