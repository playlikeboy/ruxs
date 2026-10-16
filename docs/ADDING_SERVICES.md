# Adding new services to RUXs (gym trainers and anything else)

> Read [`AGENTS.md`](../AGENTS.md) first. Its hard lines (integer paise, insert-only ledger, `vendorId` only from `requireVendorAccess()`), layer rules and Next.js rules apply to every step below. `PROMPT.md` and `docs/PRD.md` still win over this file where they conflict.

Today the household app shows four categories: 🍱 Tiffin · 💧 Water · 🥛 Milk · 🧺 More. This document explains how to add a fifth (🏋️ Gym trainers) and gives a repeatable method for adding any other service: maids, cooks, tutors, laundry, salon at home, car cleaning, and so on.

---

## 1. How the platform works today (what you can reuse)

| Piece | Where | Reusable for new services? |
| --- | --- | --- |
| Categories (label, emoji, colours, order, on/off) | `categories` table, edited at `/admin/settings` | Yes, no code needed |
| Stores (location, radius, fee, commission, login) | `vendors`, `/admin/vendors` | Yes |
| Menu items | `products` (`kind` = category id, price, description, photo) | Yes, for anything sold at a fixed price |
| One-time cart orders | `shop_orders`, `shop_order_items` | Yes: "buy once, deliver or perform once" |
| Online payment through RUXs | Razorpay, `payments`, `/api/webhooks/razorpay` | Yes |
| Vendor balance and monthly withdrawal | `vendor_payouts`, `/admin/payouts` | Yes |
| Nearby search | GPS / IP / saved address + `service_radius_km` | Yes |
| Daily plans (subscriptions) | `subscriptions` → `orders` created **every scheduled day** at cutoff, charged per delivery | **Only for things delivered every day** |

The last row is the key constraint. A subscription in RUXs means "deliver N units on these weekdays and charge per delivery". That fits tiffin, water and milk. It does **not** fit a monthly gym membership, a 12-session training pack, or a weekly maid visit billed monthly. Those need a different fulfilment model (section 4).

---

## 2. Gym trainers: the plan

### What households need

1. Open **🏋️ Fitness**, see trainers and gyms near them (home visits, gym floor or online).
2. Open a trainer: photo, bio, specialities (weight loss, yoga, strength), languages, gender, price list, reviews later.
3. Buy one of:
   - **Trial session** (single, ₹199–₹499)
   - **Session pack** (8 / 12 / 24 sessions, valid 30–60 days)
   - **Monthly membership** (unlimited or N sessions per week)
4. **Book a slot** from the trainer's calendar (date + time, home address or gym).
5. See upcoming sessions, reschedule or cancel before a cutoff (for example 6 hours), and see sessions left in the pack.
6. Pay online via Razorpay. No cash for packs.

### What trainers (merchants) need

1. A login from admin (same as today: login ID + generated password).
2. Profile: bio, photo, specialities, service area (radius), modes (home / gym / online), gym address if any.
3. Price list: trial, packs, membership (uses `products`).
4. Weekly availability ("Mon–Sat 6–10 am and 5–8 pm"), holidays, slot length (45/60 min) and buffer.
5. A **Today** view: today's sessions in time order, with the client's name, address and pack balance. Mark *done*, *no-show* or *cancelled*.
6. Earnings and monthly withdrawal: already built.

### What admin needs

- Approve trainers (pending → active), check ID or certificates (uploaded file links).
- Set commission per trainer (already built: `commission_bps`).
- See bookings, cancellations and refunds (refunds already built on `/admin/payouts`).

### Phase A: launch in one day, with no code

Usable today for **trial sessions and fixed packs sold as one-time orders**:

1. `/admin/settings` → Categories → add: id `fitness`, label `Fitness & trainers`, short `Fitness`, emoji `🏋️`, blurb `Personal trainers near you`, pick colours, order `5`. Turn it on.
2. `/admin/vendors/new` → create each trainer as a store (area, lat/lng, radius 5–10 km). Copy the login ID and password to the trainer.
3. The trainer signs in at `/merchant-panel/sign-in` → **Menu** → add items with category **Fitness**:
   - "Trial session (60 min)": price, **One-time orders ON**, **Subscriptions OFF**, *Not food*.
   - "8-session pack (30 days)": same switches.
4. Households buy with **Pay online**. The trainer sees the order, accepts it, and arranges the time. When the session or pack starts, the trainer marks it delivered, which releases the money to their balance.

Limits of Phase A, so nobody is surprised: there's no calendar, no sessions-left counter, and the delivery-slot labels (Morning, Lunch…) are food-style. Keep **Subscriptions OFF** for fitness items. Turned on, they would create a "delivery" and a charge every day.

### Phase B: proper bookings (the real build, about 1–2 weeks)

Add a **booking** fulfilment model next to the existing delivery model. Steps, in build order:

1. **Category fulfilment flag** (migration): `categories.fulfilment text not null default 'delivery' check in ('delivery','booking')`. Set `fitness` → `booking`. All UI switches on this flag, never on the category id, so the next booking service (tutor, salon) needs no code.
2. **Schema** (new file `src/db/schema/bookings.ts`, migration `0006_bookings.sql`):
   - `provider_profiles`: `vendor_id` PK/FK, `bio`, `photo_url`, `specialities text[]`, `modes text[]` (home, gym, online), `languages text[]`, `gender`, `gym_address`, `verified_at`.
   - `availability_rules`: `id`, `vendor_id`, `weekday`, `start_time`, `end_time`, `slot_minutes`, `buffer_minutes`.
   - `availability_blocks`: `id`, `vendor_id`, `starts_at`, `ends_at`, `reason` (holidays, leave).
   - `passes`: `id`, `vendor_id`, `customer_id`, `product_id`, `sessions_total` (null = unlimited), `valid_from`, `valid_until`, `shop_order_id` (how it was paid).
   - `bookings`: `id`, `vendor_id`, `customer_id`, `pass_id`, `starts_at timestamptz`, `ends_at`, `mode`, `address`, `status check in ('booked','done','no_show','cancelled_by_customer','cancelled_by_provider')`, `cancel_reason`, `created_at`. Unique (`vendor_id`, `starts_at`) where status = 'booked' (a partial unique index) prevents double booking.
   - `products`: add `sessions_included int`, `validity_days int`, `duration_minutes int`. Null for food and water.
3. **Pure rules** in `src/core/booking.ts` with tests (`booking.test.ts`):
   - `openSlots(rules, blocks, existingBookings, fromDate, days, nowIST)`: free slots in IST, excluding the past and anything inside the minimum notice.
   - `canCancel(booking, now, cutoffHours)` and `canReschedule(...)`.
   - `sessionsLeft(pass, bookings)`: count `booked` + `done` (and `no_show` if the policy says it counts).
   - `passIsValid(pass, date)`.
   Keep IST handling in `core/time.ts`. No DB, React or Next imports in `core`.
4. **Feature folder** `src/features/bookings/`: `queries.ts` ("server-only"), `actions.ts` ("use server" + zod), `schemas.ts`, `components/`.
   - Household actions: `buyPass` (reuses `placeOrder` + Razorpay; on payment `settlePayment` creates the pass), `bookSlot`, `cancelBooking`, `rescheduleBooking`. Every write re-checks pass validity, sessions left and slot freedom inside one transaction; the partial unique index is the final guard.
   - Provider actions: `saveProfile`, `saveAvailability`, `blockTime`, `markBooking(done | no_show | cancelled_by_provider)`. `vendorId` only from `requireVendorAccess()`.
5. **Money**: keep the existing rule. Money becomes withdrawable when the order is *delivered*. For a pass: mark the pass order delivered on the first completed session, or split earnings per session (`paymentState` would need a third input). Start with "delivered on first session"; it's simpler and correct enough. Refunds for unused sessions are manual via `/admin/payouts` (already built).
6. **Household UI** (`src/app/(shop)/app/...`), switching on `category.fulfilment === "booking"`:
   - The store page shows the profile header, specialities and a **Book** button instead of ADD/Subscribe.
   - `/app/store/[slug]/book`: choose a pass (or use one already owned) → date strip → time chips → address or mode → pay or confirm.
   - New tab section on **Plans**: "Sessions" (upcoming with Cancel / Reschedule, past, sessions left).
7. **Provider UI** (`/merchant-panel/[vendor]`):
   - **Today** shows a timeline of sessions instead of kitchen counts when the store's categories are booking-based.
   - New **Calendar** page: week view, availability editor, block time.
   - **Clients**: the existing Customers page plus pass balance.
8. **Admin**: a provider verification checklist on `/admin/vendors/[id]` (certificate link, ID checked, `verified_at`), and a bookings tab on the vendor page.
9. **Notifications** (later): reminders 12 h and 1 h before a session. The WhatsApp pause in `AGENTS.md` still applies, so use email or in-app first.
10. **Verify** before shipping (see section 6): unit tests for slots and passes, an end-to-end run on prod with a throwaway trainer and household (buy pack → book → cancel → rebook → mark done → earnings), and a double-booking race test.

---

## 3. How to add *anything*: the decision tree

Ask three questions about the new service:

1. **Is it a physical item that's delivered?** (groceries, flowers, gas cylinder)
2. **Does it repeat on a schedule?** (daily milk vs. one-off cake)
3. **Does it need a time slot with a person?** (trainer, maid, tutor, salon)

| Answer | Fulfilment model | Example services | What to do |
| --- | --- | --- | --- |
| Delivered, repeats daily or weekly, priced per delivery | `delivery` + subscriptions | Tiffin, water cans, milk, newspaper, bread, eggs | **No code.** Add the category in `/admin/settings`; merchants add items with *Subscriptions ON* |
| Delivered once | `delivery` one-time | Groceries, sweets, gas refill, flowers, laundry pickup and drop | **No code.** Category + items with *One-time ON, Subscriptions OFF* |
| Person comes at a time, once or as a pack | `booking` | Gym trainer, yoga, tutor, salon at home, AC service, car wash, pest control | Build the **booking model once** (section 2, Phase B). After that every new booking service is no-code |
| Person comes on a fixed weekly schedule, billed monthly | `booking` with a recurring rule | Maid, cook, driver, elder care | Booking model + "recurring booking" (a rule that creates bookings each week) + monthly invoice from completed visits |
| Item lent and returned | `rental` | Furniture, baby gear, party equipment | New model, only if demand appears. Reuse `asset_movements` for what is out with the household |

Rule of thumb: **add a fulfilment model only once, then every service of that shape is just a row in `categories`.** Never branch the UI on `category.id === "fitness"`; branch on `category.fulfilment`.

### No-code checklist (any delivery-shaped service)

1. `/admin/settings` → add the category (id, label, short label, emoji, blurb, colours, order).
2. Add localities for any new city (`/admin/settings` → Localities) so locations show readable names.
3. `/admin/vendors/new` → create stores with lat/lng and radius; send each owner their login.
4. Owners add menu items in that category, choosing *One-time* and/or *Subscriptions* correctly.
5. Check the household app at the store's location: category tile, store card, item, cart, pay online.
6. Check the merchant panel: order arrives only after payment, accept → deliver, earnings update.

### Code checklist (a new fulfilment model)

1. Write a short plan in `docs/` naming tables, rules and screens (like section 2).
2. Migration in `src/db/migrations/` + Drizzle schema in `src/db/schema/`. Add the journal entry. Run `bun run db:migrate`. Never edit or delete `ledger_entries` rows.
3. Pure rules in `src/core/<model>.ts` with tests. Money in integer paise.
4. Feature folder `src/features/<model>/` (queries / actions / schemas / components). Auth checks in queries and actions; `vendorId` only from `requireVendorAccess()`.
5. UI branches on `category.fulfilment`. Server Components by default; client components only for interaction.
6. Reuse payments (`startOrderPayment`, `settlePayment`), payouts and refunds. Don't add a second payment path.
7. `bun run typecheck && bun run lint && bun run test`, then `bun run deploy`, then a signed-in smoke test on ruxs.in with throwaway accounts (create them with the Hexclave REST API and delete them afterwards).
8. Commit on `main` (Conventional Commits) and push.

---

## 4. Suggested order of new categories

1. **Fitness (gym trainers, yoga)**: Phase A this week; Phase B builds the booking model.
2. **Home services on booking** (salon at home, AC service, car wash): no code once the booking model ships.
3. **Maid / cook (recurring booking)**: adds the weekly rule and monthly invoice from visits.
4. **Groceries / daily needs (one-time delivery)**: already possible today. Add the category and stores.

---

## 5. Data rules (from `AGENTS.md`, restated for new services)

- Prices, deposits, fees, balances: **integer paise**.
- Ledger is insert-only, with idempotency keys. Fix mistakes with a reversing entry.
- Categories, localities, admins and all store data live in **Postgres**, edited from `/admin`. Don't hardcode them in code.
- Times: store `timestamptz`; show and reason in IST using `core/time.ts`.
- Households never see a vendor's phone number. Providers see the household's address and phone only for their own bookings.

## 6. Definition of done for a new service

- [ ] Category visible in the household app (tile, category page, search).
- [ ] At least one real store in a launch city with location and radius set.
- [ ] Buy flow works with **Pay online**, and the webhook settles the payment once.
- [ ] Merchant sees the order or booking, completes it, and earnings update.
- [ ] Cancel and refund path checked.
- [ ] Unit tests for any new `core` rule; typecheck, lint and tests pass.
- [ ] Deployed and smoke-tested signed in on ruxs.in (desktop and phone).
