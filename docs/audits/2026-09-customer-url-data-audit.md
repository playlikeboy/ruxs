# RUXS Customer URL & Data Audit — 2026-09-24

## Previous problems

1. The customer app used `CustomerAppContainer` to switch views inside one `/app` URL. Views such as search, tracking, services, profile/Khata and cart were not independently addressable.
2. Browser navigation, refresh, bookmarks and deep links could therefore lose the active in-app view.
3. The customer UI context contained demo cart items, demo geofences, demo notifications and demo routines.
4. `mock-data.ts` was exported from the customer module and was imported directly by marketplace/search/detail views.
5. The home screen contained hardcoded user-facing copy/data such as the name, date, reviewer badge and external avatar image.
6. Search used mock products/vendors/categories and displayed USD-style price-filter labels even though RUXS prices are INR.
7. Product/vendor pages used mock-data lookups and static params, so DB changes could not become the canonical detail pages.
8. SEO metadata contained fabricated aggregate rating/offer counts and the sitemap enumerated mock catalog records.
9. Robots rules allowed only the old app surface and did not match the new customer route structure.
10. Delivery/geofence UI could imply verified coverage or free delivery without a real geometry check.
11. The cart UI visually looked like checkout, but the current backend does not expose a completed checkout workflow, so presenting a final paid total would be misleading.

## Canonical customer URLs

| Surface | Canonical route | Supported query state |
| --- | --- | --- |
| Discovery home | `/app` | `category`, `society` |
| Services | `/app/services` | `category` |
| Search | `/app/search` | `q`, `category`, `type`, `price` |
| Product | `/app/product/:id` | product-specific future state |
| Vendor | `/app/vendor/:id` | vendor/service-specific future state |
| Tracking | `/app/tracking` | `fulfillment` |
| Digital Khata | `/app/khata` | `tenant` |
| Cart | `/app/cart` | none |
| Notifications | `/app/notifications` | future notification filters |
| Location | `/app/location` | future location selector |

## Data ownership after the refactor

- Marketplace vendors come from verified `tenants`.
- Marketplace services come from active `services`.
- Products come from active `products`.
- Household location comes from `/api/households`.
- Notifications come from `/api/notifications`.
- Recurring routines come from `/api/subscriptions`.
- Delivery tracking comes from `/api/fulfillments`.
- Ledger balances come from `/api/khata`.
- Billing statements come from `/api/billing/invoices`.
- Client cart state is local to the browser and deliberately does not pretend to be a server order until a real checkout API exists.

## Runtime/build rule

DB-backed customer pages are marked dynamic so catalog data is resolved at runtime rather than being frozen into a static build.

## Verification status

GitHub Actions is configured to run typecheck, tests and `bun run build` on pull requests, and `bun run deploy` on pushes to `main`. The connector did not surface a workflow run/status for the feature branch while this audit was being prepared, so deployment is not claimed as independently verified yet.