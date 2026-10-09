# RUXS — Startup Overview

> Compiled on 2026-10-09 from the `ruxs` repository (product docs, business docs, architecture docs, ADRs, checklists, audits, DB schema, config and git history) before the codebase was removed.

| | |
| --- | --- |
| **Brand** | RUXS (pronounced "Rux", rhymes with *luxe*). Do not expand it into an acronym. |
| **Domain** | [ruxs.in](https://ruxs.in) (also `www.ruxs.in`). Customer app at `ruxs.in/app` |
| **GitHub** | https://github.com/SH20RAJ/ruxs |
| **Founder / builder** | Shaswat Raj (GitHub: SH20RAJ) — 380 commits, 2026-09-11 → 2026-10-09 |
| **Category** | Vertical SaaS + operating layer for recurring hyper-local household services in India |
| **Tagline (proposed)** | *"Your everyday life, on autopilot."* Alternatives: "The operating system for your household." / "Zero-friction daily essentials for modern homes." |
| **README one-liner** | "RUXS is a quiet operating layer for recurring local household services." |
| **Core belief** | "People should only need to touch the system when something changes." |
| **Former working name** | *DailyOps* (internal concept only, not to be used publicly). The repo started life as `ruxx` and was renamed to `ruxs`. |
| **Stage** | Working prototype deployed on Cloudflare Workers; production hardening still in progress |

---

## 1. What RUXS Is

Across urban and semi-urban India, households rely on a set of recurring local services: milk before dawn, tiffin at lunch and dinner, 20L RO water cans every 2–3 days, newspapers, pooja flowers, the dhobi, the car cleaner and the raddi-wala. The docs size this at **$50B+ a year in India**. Usage is daily or alternate-day, and customer relationships often last for years.

Almost all of it still runs on WhatsApp chats, phone calls, paper khata notebooks, calendar ticks behind the door, cash collection, awkward UPI reminders, and returnable cans and dabbas that nobody tracks.

**RUXS is not quick commerce and not a marketplace.** It doesn't run dark stores or cloud kitchens, hire gig riders, or mark up vendor prices. The local vendor stays the local vendor. RUXS is the software underneath that relationship. It handles subscriptions, daily confirmations, cutoffs, kitchen counts, delivery run sheets, a digital khata (ledger), returnable-asset tracking, monthly billing, UPI collection, household sharing and dispute resolution.

### The five vision tenets
1. **An operating system, not a store.** RUXS coordinates, keeps the books, sequences deliveries and bills. It does not sell the goods.
2. **Everyday autopilot.** The customer sets a default once. Daily changes take one tap on WhatsApp, and if they do nothing, the default runs.
3. **Keep hyper-local economics intact.** Neighbourhood vendors have trust, density and very low delivery cost. RUXS gives them enterprise-grade tooling.
4. **Financial and asset transparency.** Every daily state change goes into an immutable double-entry ledger and an asset ledger, so the month-end bill explains itself.
5. **One ledger for the whole house.** Over time RUXS becomes the command centre for all recurring household expenses, including Splitwise-style settling between flatmates.

---

## 2. The Problem

### Customer pain
- **Daily mental load.** "Bhaiya, aaj lunch mat bhejna" has to be sent before about 9:30 AM. If they forget, they pay for a meal nobody eats.
- **Month-end billing fights.** The customer's door calendar doesn't match the vendor's diary, and trust breaks down over ₹200–₹500.
- **Asset deadlocks.** Water vendors take ₹150–₹300 per can as a deposit. Cans get swapped or lost, and deposits are forfeited.
- **Flatmate accounting chaos.** One person pays the tiffin aunty, another pays for water, and Splitwise is never kept up to date.

### Vendor pain
- **Unpredictable demand and food waste.** Ingredients are committed by 9:30 AM, and late cancellations wipe out **15–25% of net margin**.
- **Delivery mix-ups.** Cancellations land on the owner's phone while the delivery boy is already out, so he knocks on doors that skipped.
- **Cash-flow drag.** The first week of every month goes on chasing about 150 UPI payments. DSO is around 14 days.
- **Asset bleed.** A water vendor with 300 customers has 600+ cans in circulation and loses **10–15% a year**.

### Why existing tools fail
| Alternative | Why it doesn't fit |
| --- | --- |
| Quick commerce (Blinkit, Zepto, Instamart) | Built for impulse on-demand orders. 20–30% commission. No subscriptions or returnable deposits. |
| Food delivery (Swiggy, Zomato) | An ₹80 tiffin can't carry a ₹40 delivery fee plus a 25% take rate. |
| Khata apps (Khatabook, OKCredit) | Record debt after the fact. No fulfillment state, cutoffs, run sheets or polls. |
| Society ERPs (MyGate, NoBrokerHood) | Built for visitor and maintenance management, with no depth on individual services. |
| WhatsApp chats | No structure and no database behind them. Messages get buried. |

**Root cause:** the market isn't short of demand or vendors. What's missing is a **coordination layer**.

---

## 3. The Solution: Core Pillars

1. **WhatsApp-first, app optional.** About 95% of daily customer actions happen through WhatsApp Cloud API interactive buttons. A PWA at `ruxs.in` handles ledgers, invoices and settings.
2. **Strict cutoff automation.** Each service and shift has its own cutoff. Before the cutoff, a skip is free. After it, the state locks and the vendor's late-cancellation policy applies (for example a 50% or 100% charge, or the cancellation is not allowed).
3. **Double-entry digital khata.** Balances are never edited directly. Every change is an immutable entry with a timestamp, fulfillment ID, service, type and creator. The customer and vendor see the same ledger.
4. **Physical asset ledger.** Each delivery records items delivered, items collected, the net balance held and the deposit held. Assets are reconciled before a deposit is refunded.
5. **Live driver run sheets.** Stops are ordered by Society → Tower → Wing → Floor → Flat, top-down for lifts. Skips drop off the sheet in real time.
6. **Households and expense splitting.** Several members share subscriptions, and the khata total can be split equally, by percentage or by custom amounts, with UPI settlement links.

### The core daily loop (MVP)
```
Morning WhatsApp poll → 1-tap DELIVER / SKIP / EXTRA → cutoff lock → kitchen prep count
→ driver run sheet → doorstep delivery + empty collected → automatic khata debit
→ (month end) one consolidated itemised UPI invoice
```

### What RUXS does and does not do
| Does | Does not |
| --- | --- |
| Sell cloud software to local vendors (SaaS) | Run dark stores or cloud kitchens |
| Automate polls, cutoffs and run sheets | Employ gig delivery fleets |
| Keep immutable ledgers and handle UPI billing | Mark up vendor prices |
| Track returnable inventory | Make vendors rebrand |
| Provide a 1-tap WhatsApp layer | Require a native app install |

---

## 4. Value Proposition

**For households:** "Your everyday household essentials, completely on autopilot."
- A 2-second WhatsApp tap replaces anxious messaging.
- Vacation mode pauses every service with one action instead of calling four vendors.
- The live ledger ends billing arguments.
- Household accounts and splitting stop flatmate disputes over money.
- Verified asset balances protect deposits.

**For vendors:** "Run your local business with corporate predictability, zero food waste, and instant cash collection."
- A locked production count at the cutoff, with an estimated **12–18% cut in waste**.
- Late-cancellation fees are enforced by the system.
- Itemised WhatsApp invoices with UPI links on the 1st of the month bring **DSO from about 14 days to under 48 hours**.
- Customers stay subscribed **about 3x longer** when bills can't be disputed (projection).
- Can and dabba returns are logged at every door.

**For delivery staff:** "Clear daily routes, zero confusion, and proof for every drop."
- Sequenced run sheets, a 1-tap doorstep asset audit, and delivery proof by photo or QR.

---

## 5. Users and Personas

**Five system roles:**
1. **Customer** (household primary owner): subscribes, skips, pays, invites members, raises disputes.
2. **Household member** (flatmate, spouse or parent): views, splits, and can skip if given permission.
3. **Vendor admin** (kitchen, dairy or water depot owner): catalogue, cutoffs, prep counter, roster, run sheets, assets, invoicing, cash reconciliation.
4. **Delivery staff:** run sheet, DELIVERED/FAILED, asset handover, proof, call or WhatsApp the customer.
5. **Platform admin** (RUXS ops): vendor approval and suspension, SaaS tiers, system health, dispute escalation.

**Personas from the docs:**
- **Rahul**, 26, software engineer in a shared flat in HSR Layout, Bengaluru. Skips dinner with one tap and splits the water cost with flatmates.
- **Meenakshi**, 34, PM in a Pune family home. Handles milk, flowers, two newspapers and scrap, and uses vacation mode from Dec 22 to Jan 2 to pause all of them.
- **Sharma-ji**, 48, runs a tiffin service in Jaipur with 110 subscribers and 2 delivery boys. Lost ₹14k a month to late cancellations. At 10:00 AM the dashboard shows "84 meals (72 Regular, 12 Jain, +18 extra rotis)."
- **Ramesh**, 22, Sharma-ji's delivery rider. Delivers 45 tiffins across 3 societies in 75 minutes, Tower A→B→C, with skipped stops greyed out.

---

## 6. Service Categories and Rollout

| Category | Cadence | Asset tracking | Cutoff urgency | Phase |
| --- | --- | --- | --- | --- |
| **Tiffin** (Regular, Jain, diet, non-veg; add-ons like +rotis) | Per meal shift | Steel dabbas | Critical | **MVP** |
| **20L RO water jars** (fixed schedule or SOS reorder) | Every 2–3 days | Cans + ₹150–300 deposit | Moderate | **MVP** |
| Milk and dairy (decimal quantities 0.5–2L, weekend extras) | Daily, early morning | Optional crates | Strict (night before) | 2 |
| Car or bike cleaning | Daily | No | Low | 2 |
| Newspapers | Daily | No | Strict | 2 |
| Pooja flowers (festival surges) | Daily | Baskets | Moderate | 3 |
| Bakery and breakfast | Daily or alternate days | No | Moderate | 3 |
| Laundry / dhobi (barcode-tagged piece counts) | Twice weekly | Bags, hangers | Low | 4 |
| Scrap and cartons (**reverse flow**: credits the customer's khata) | Weekly or monthly | Weighing | Low | 4 |

**Reference cutoffs:**
| Service | Poll | Cutoff | Delivery | Late-skip policy |
| --- | --- | --- | --- | --- |
| Tiffin lunch | 8:30 AM | 10:00 AM | 12:30–1:30 PM | 50% charge |
| Tiffin dinner | 4:30 PM | 6:00 PM | 7:45–8:45 PM | 50% charge |
| Milk | 8:00 PM (night before) | 10:00 PM (night before) | 5:30–7:00 AM | Not allowed |
| Newspaper | — | 9:00 PM (night before) | 5:30–7:00 AM | Not allowed |
| 20L water | 7:00 AM | 9:00 AM | 10 AM–2 PM | Full price |

The more recent design spec also lists A2 cow milk, dog walking and steam-laundry passes as examples of the categories the app UI shows.

---

## 7. Product Principles (the 10 rules)
1. **Zero friction.** Common daily actions take one tap and under 3 seconds. Doing nothing runs the default.
2. **WhatsApp first.** It must work for people who will never install an app.
3. **Local first.** Help neighbourhood vendors instead of replacing them.
4. **Recurring first.** The basic unit is a subscription, not a cart: `Cadence → Cutoff → Daily Fulfillment → Ledger Entry → Consolidated Billing`.
5. **Khata integrity.** Every rupee traces back to a verifiable fulfillment event.
6. **Physical and digital together.** Assets are tracked as precisely as money.
7. **Radically simple vendor screens.** Large touch targets and one number: "How many meals must I cook?"
8. **Automate the routine.** People step in only for exceptions.
9. **Transparent disputes.** Every day on the bill has a clear, auditable status.
10. **Modular services.** A new category never requires re-architecting (common `SubscriptionService`, `FulfillmentItem` and `LedgerBridge` interfaces).

---

## 8. Business Model

**Monetisation philosophy:** no 20–30% take rates. A hybrid of SaaS and payments infrastructure.

| Stream | Detail |
| --- | --- |
| **1. Vendor SaaS (primary)** | Starter **Free**, Growth **₹499/mo**, Pro/Hub **₹1,499/mo** |
| **2. Payment collection fee** | **0.5–1.0%** or a flat ₹5 per cleared monthly invoice (unit-economics model assumes 0.4%) |
| **3. Asset supply** | Branded, QR-coded steel tiffins and BPA-free 20L cans sold to vendors at wholesale prices |
| **4. B2B procurement (Phase 6)** | Combine network demand for rice, oil, atta and gas, bought **12–18% below mandi prices** |

### Vendor plans
| | Starter (Free) | Growth (₹499) | Pro/Hub (₹1,499) |
| --- | --- | --- | --- |
| Subscribers | 20 | 150 | Unlimited |
| Drivers | 1 shared | 3 | Unlimited |
| WhatsApp polls | Standard webhook | 3,000/mo | 15,000/mo |
| Cutoff shifts | 1 | Multiple | Custom multi-window |
| Khata | Full | Full | Full |
| Assets | Basic balance | Doorstep stepper | Multi-hub reconciliation |
| Run sheet | Society grouping | Floor sequencing | Multi-driver cluster dispatch |
| Payments | Manual UPI QR | Dynamic links + auto-reconcile | UPI AutoPay + priority settlement |
| Support | Community | 24h email/chat | Dedicated WhatsApp account manager |

The upgrade prompt appears when a vendor adds their 21st subscriber. Pro adds CSV export for the vendor's CA.

### Unit economics (proposed)
- **Variable cost per active household:** about **₹13.67/mo**. Excluding the payment gateway it is about **₹4.67/mo** (30 utility polls at ₹0.12 = ₹3.60, 4 alerts = ₹0.48, edge compute ₹0.01, DB ₹0.50, SMS fallback ₹0.08, gateway 0.3% of ₹3,000 = ₹9).
- **Example: Growth-tier tiffin vendor with 80 households and ₹2.4L monthly GMV.** Inflow is ₹499 SaaS plus ₹960 (0.4% take) = ₹1,459. Outflow is ₹326 WhatsApp + ₹40 infrastructure + ₹480 gateway = ₹846. **Contribution is ₹613 (42% margin).**
- **Vendor ROI.** Waste avoided ₹6,240, lost containers recovered ₹720, bad debt avoided ₹4,800. That is ₹11,760/mo of benefit against a ₹499 fee, about **23.5x ROI** (the plans doc gives a more conservative 6–12x).

---

## 9. Go-To-Market

- **Vendor-led, zero-CAC acquisition (the "Trojan horse").** A field rep onboards one vendor in 15 minutes. The vendor uploads their customers' phone numbers, RUXS sends WhatsApp welcome links, and **about 80 households activate in a day for ₹0 CAC**. Word of mouth then reaches nearby water and milk vendors ("What software is Sharma using?").
- **3 km² density playbook.** Win one dense cluster before expanding. Targets are PGs, 1/2BHK societies and co-living buildings with 10+ tiffin cooks, 3 water depots and 2 milk booths.
  - **Bengaluru:** HSR Layout (Sectors 1–3), BTM, Koramangala. The seed data uses HSR, Bellandur, Haralur and societies such as Prestige Falcon, Prestige Ferns, Prestige Meridian and Sobha Classic.
  - **Pune:** Kothrud, Viman Nagar, Wakad.
  - **Gurgaon:** DLF Phase 3, Sectors 43 and 56.
  - Also considered: Jaipur and Indore, which have traditional tiffin networks.
- **15-minute onboarding script.** 0–3 min pitch, 4–8 min profile setup (UPI ID, 10 AM cutoff), 9–12 min customer import (photo of the paper notebook or the WhatsApp contact list), 13–15 min a live test poll. The "aha" moment is watching the counter go up.
- **Spread inside gated communities.** Residents start expecting the same 1-tap experience from their water vendor, so RUXS becomes the default for the whole society.

---

## 10. Roadmap

| Phase | Window | Focus | Exit gate |
| --- | --- | --- | --- |
| 0 | 2026 Q1 | Architecture and specs | Complete docs (done) |
| **1** | 2026 Q2–Q3 | **MVP**: OTP login, vendor setup, WhatsApp polls, prep counter, khata, run sheet, UPI invoices. Tiffin and water, 10–20 vendors | 500 active subscriptions for 30 days at >95% accuracy |
| 2 | 2026 Q4–2027 Q1 | Milk, car cleaning, newspapers; full asset ledger; vacation mode; regional-language WhatsApp (Hinglish, Hindi, Kannada, Marathi); offline driver PWA | >2,500 households |
| 3 | 2027 Q2–Q3 | Society→Tower→Wing→Floor sequencing, photo/QR proof, **UPI AutoPay**, redelivery | DSO < 24h; drivers 30% faster |
| 4 | 2027 Q4–2028 Q1 | Laundry and scrap; household accounts; unified household calendar | 4+ services per household |
| 5 | 2028 Q2–Q3 | Splitwise layer with P2P UPI settlement | >40% of flatshares use it |
| 6 | 2028 Q4–2029 Q2 | Open discovery marketplace, vendor ratings, B2B procurement | — |

Long-term (5-year) arc: single-vendor MVP (2026) → multi-service hub (2027) → society density and AutoPay (2028) → household financial layer (2029) → hyper-local commerce OS and B2B supply (2030+).

> Note: in the codebase, households and expense splitting were built ahead of the roadmap's schedule.

---

## 11. Metrics and Targets

**North Star:** *Monthly autopilot fulfillments completed and cleared*, meaning deliveries completed, verified and settled with no open disputes.

| Metric | Phase 1 | Phase 3 |
| --- | --- | --- |
| Active subscriptions | 500 | 25,000 |
| Poll response rate | >65% | >75% |
| Autopilot satisfaction | >92% | >96% |
| Skip rate | 12–18% | 12–18% |
| 30-day retention | >80% | >85% |
| Invoices paid within 48h | >70% | >88% |
| Active vendors | 15 | 300 |
| Subscribers per vendor | 45 | 110 |
| Monthly vendor churn | <5% | <2% |
| Free→paid conversion | 15% | 35% |
| GMV | ₹10L/mo | ₹2Cr/mo |

Operational targets: waste down 15%, delivery completion >98.5%, failed deliveries <1.5%, asset loss <0.5%, billing disputes <1%, DSO <2.5 days, bad debt <0.8%, WhatsApp cost <₹8 per household per month.

**MVP launch gates:**
- Zero double charges across 100 simulated skips.
- A skip at 10:00:01 counts as late when the cutoff is 10:00:00.
- Duplicate webhooks cause no duplicate effects.
- An end-to-end UPI payment clears the khata within 3 seconds.

---

## 12. Risks

| # | Risk | Mitigation |
| --- | --- | --- |
| R1 | Vendors have low tech literacy | One-number dashboard, large buttons, 15-minute field onboarding |
| R2 | WhatsApp/Meta policy or pricing changes | Utility templates only, opt-in, PWA push and SMS fallback |
| R3 | Customers ignore the poll | Autopilot default (CONFIRMED) and cutoff countdown warnings |
| R4 | Late payments | Reminders on day 1, 3 and 5; optional suspension on day 7 |
| R5 | Drivers forget to log assets | Stepper defaults to 1 in = 1 out |
| R6 | Late-skip disputes | Millisecond webhook timestamps and a shared audit trail |
| R7 | Tenant data leaks | RLS, scoped queries, isolation tests |
| R8 | Support overload over food quality | RUXS is infrastructure. "Call Vendor" button for quality issues |
| R9 | Algorithmic routes drivers won't follow | Group by society and tower; no TSP in the MVP |
| R10 | Too many variants | Fixed variants plus integer add-ons |

### Open strategic questions
- **Q1 – B2B or B2C first?** Working answer: vendor-first SaaS.
- **Q2 – Which city first?** Bengaluru (HSR/Koramangala), Pune or Jaipur/Indore. Pick one 3 km² cluster. (The seed data points to HSR Bengaluru.)
- **Q3 – Verifying informal vendors.** Working answer: tiered. Phone + Aadhaar/PAN below ₹40k/mo, FSSAI required above 30 subscribers.
- **Q4 – WhatsApp costs.** Use the free 24h service window, PWA push, and message allowances bundled into tiers.
- **Q5 – Payment aggregator.** Cashfree, Razorpay, PhonePe PG or Decentro. Needs UPI fees under 0.25%, split payouts (98.5/1.5), and AutoPay.
- **Q6 – Splits vs. the vendor khata.** The vendor is always owed the full amount by the primary owner. Splits are internal reimbursement between members.
- **Q7 – Delivery proof.** A 1-tap check-off with geotag by default. Photo required only for first drops, high-value orders or flagged customers.
- **Q8 – GST.** A simple Bill of Supply by default. CGST/SGST is added automatically if the vendor provides a GSTIN.

---

## 13. Key Domain Mechanics

- **11-state fulfillment state machine:** `SCHEDULED → CONFIRMATION_REQUIRED → CONFIRMED / SKIPPED / LATE_SKIP → IN_PREPARATION → OUT_FOR_DELIVERY → DELIVERED / FAILED / CANCELLED → DISPUTED`. Doing nothing at the cutoff leads to CONFIRMED (autopilot). Fulfillments are generated at 00:01, deduplicated by a unique `(subscription_id, service_date, shift)` key.
- **Khata entry types:** `FULFILLMENT_DEBIT`, `PAYMENT_CREDIT`, `LATE_FEE_DEBIT`, `ASSET_DEPOSIT_DEBIT/REFUND`, `SCRAP_CREDIT`, `DISCOUNT_CREDIT`, `DISPUTE_REFUND`, `MANUAL_ADJUSTMENT`. Append-only, with all amounts as **integer paise** (no floating point).
- **Assets:** `new_balance = old + delivered − collected`, with a deposit liability per item.
- **Billing:** generated from the ledger on the 1st of the month. Partial payments carry forward.
- **Payments:** a UPI-first abstraction over intent links, dynamic QR and AutoPay, with idempotent webhook reconciliation.
- **WhatsApp templates:** `ruxs_daily_poll_v1`, `ruxs_cutoff_warning_v1` (30 minutes before the cutoff), `ruxs_delivery_success_v1`, `ruxs_monthly_invoice_v1` (1st of the month, 10 AM). Explicit "Reply YES" opt-in.
- **Households:** the owner, members and limited members have different permissions. Polls go either to the owner only or to all members, where the first tap counts for the whole household.
- **Vacation mode:** one date range pauses several services and freezes billing.
- **Disputes:** a lifecycle with an evidence timeline, resolved by **compensating entries** rather than edits. The Mediation Desk handles disputes over ₹500 within 48 hours.
- **Support tiers:** vendor direct (food quality, <15 min), Tier 1 RUXS Ops (<30 min), Tier 2 Engineering (<15 min response, <4h resolution), Mediation Desk.
- **Privacy (DPDP Act 2023):** phone numbers and addresses encrypted, drivers see addresses only during their shift, photos in a private R2 bucket via pre-signed URLs. Data export and account deletion APIs. Call masking (Exotel or Twilio) planned for Phase 3.

---

## 14. What Was Built (the codebase as of 2026-10-09)

**Status claims.** The master checklist marks all 30 workstreams "100% complete and verified against live Neon PostgreSQL." The README is more honest: *"active product prototype… production hardening remains in progress, particularly around authorization, durable persistence, tenant isolation, webhook controls and operational infrastructure."*

**Stack.** TypeScript, Next.js App Router syntax via **Vinext** on **Cloudflare Workers**, React 19 (RSC), Tailwind v4, Bun, Vite 8, **Neon PostgreSQL** + **Drizzle ORM**, Zod, shadcn/Base UI, and **Hexclave** (auth, RBAC, API keys, emails and analytics; sign-in by password, OTP, passkey or Google OAuth). Meta WhatsApp Cloud API. The architecture also plans for Redis/Upstash or KV, Cloudflare Queues and R2.

**Infrastructure.**
- Cloudflare Worker `ruxs` on custom domains `ruxs.in` and `www.ruxs.in`.
- Cron triggers: daily 00:00, 01:30, every 15 minutes, every 10 minutes, and monthly on the 1st.
- GitHub Actions: typecheck → test → build → migrate → deploy on pushes to `main`.

**Database (23 tables):** tenants, users, households, household_members, services, products, subscriptions, daily_fulfillments, khata_entries, invoices, payments, asset_holdings, asset_movements, vacations, delivery_runs, delivery_stops, disputes, audit_logs, household_expenses, household_expense_participants, webhook_events, notifications, background_jobs. There were 4 Drizzle migrations.

**Domain modules (21):** admin, assets, billing, customer, customer-ui, cutoff, delivery, disputes, expenses, fulfillment, households, jobs, khata, notifications, payments, pwa, services, subscriptions, vacation, vendor, whatsapp.

**Size:** 48 API routes and 31 test files.

**Product surfaces / routes:**
| Route | Purpose |
| --- | --- |
| `/` | Marketing landing page |
| `/app` (+ `/services`, `/search`, `/product/:id`, `/vendor/:id`, `/tracking`, `/khata`, `/cart`, `/notifications`, `/location`) | Geofenced customer app for discovery, subscriptions, tracking, khata |
| `/customer/{subscribe,onboard,household,expenses}` | Household setup and management (`/customer/dashboard` redirects to `/app`) |
| `/vendor/{onboard,dashboard,services}` | Vendor onboarding, live operations, catalogue |
| `/delivery` | Driver run sheet |
| `/disputes` | Dispute management |
| `/household`, `/household/expenses` | Shared household and expense splitting |
| `/admin`, `/admin/:slug` | Platform admin console |
| `/login`, `/onboard`, `/subscribe`, `/offline` | Authentication, onboarding, PWA offline page |

**API groups:** auth (OTP, session, logout), customer, vendor, marketplace, subscriptions, fulfillments (generate), cutoff (lock), delivery (run, stop), assets (exchange, holdings), khata (entries), billing (invoices), payments (create-order, webhook), webhooks, notifications (dispatch), vacation, households (members), expenses (settle), disputes, admin (audit, data, vendors), jobs (`[jobName]`), user (data-export, delete-account), seed.

**Brand and design evolution:**
1. The first design system was "Editorial Utility": dark ink surfaces, RUXS red, muted green, Geist and a serif display face.
2. In October 2026 it was redesigned to **Airbnb-DLS clarity with warm ivory (`#FFF8ED`), blush pink (`#FEC7BE`), accessible coral (`#BD4B2A`), warm-brown ink (`#5A554B`), and pastel blue, yellow and pink accents**.
3. Design primitives: DSButton, DSBadge, DSQuantityStepper, DSSearchBar, DSCategoryPill, DSBottomNav, DSBottomSheet, DSTimelineStepper, DSRatingPill. The app is an installable PWA.

**Customer URL/data audit (2026-09-24):**
- The customer app was refactored from a single-URL view switcher with mock data to deep-linkable routes backed by the database.
- Fabricated SEO ratings and USD price labels were removed.
- The cart is deliberately not presented as a completed checkout until a real checkout API exists.

**Recent engineering focus (latest commits):** durable expense settlement and dispute resolution that survive restarts, security audit fixes, and the landing page and DLS redesign.

**Development timeline:**
- **2026-09-11:** repo created with the Cloudflare CLI; full product docs and ADR-001 written the same day.
- **2026-09-11 → 2026-10-09:** about 380 commits.
- 50 commits under the handle SH20RAJ and 330 as Shaswat Raj (the same person).

---

## 15. Key Architecture Decisions (ADR-001, 2026-09-11)
- **Cloudflare Workers + Vinext over Node containers:** avoids cold starts and gives Indian PoPs (Mumbai, Chennai, Bengaluru, Delhi) under 10 ms latency, which the 8:30 AM webhook burst needs.
- **PostgreSQL over NoSQL:** ACID transactions for the double-entry ledger.
- **Drizzle over Prisma:** no heavy engine binary inside edge isolates.
- **R2 for photos and invoices:** no egress fees.
- **Trade-off:** no native Node modules on the edge runtime.

---

## 16. One-Paragraph Pitch

> **RUXS** is the operating system for India's recurring household services: tiffin, water, milk, newspapers, flowers, laundry, scrap. These services are worth more than $50B a year and still run on WhatsApp chats and paper khatas. Instead of competing with neighbourhood vendors the way quick commerce does, RUXS sells them SaaS: one-tap WhatsApp daily confirmations with autopilot defaults, strict cutoffs that end food waste, live kitchen counts and driver run sheets, an immutable digital khata and returnable-asset ledger, and one itemised UPI invoice each month. Vendors bring their existing 50–150 customers at zero CAC, the free-to-₹1,499/mo tiers return 6–23x ROI, and RUXS earns SaaS fees plus a small collection take rate. The plan is to win dense 3 km² clusters such as HSR Layout, then expand into a household-wide ledger with roommate splitting, UPI AutoPay, a discovery marketplace and B2B procurement.
