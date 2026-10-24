# RUXs Repository Audit, Feature Roadmap, and UI/UX Redesign Plan

**Repository:** [SH20RAJ/ruxs](https://github.com/SH20RAJ/ruxs)  
**Branch reviewed:** `main`  
**Reviewed revision:** [`8e4f72930e3eb94890179b7169b29e261c06ad86`](https://github.com/SH20RAJ/ruxs/commit/8e4f72930e3eb94890179b7169b29e261c06ad86)  
**Audit date:** 24 October 2026  
**Review type:** Read-only static code/configuration audit of repository files. Production data was not modified.

## 1. Executive summary

RUXs has a substantial MVP foundation: feature-oriented TypeScript modules, PostgreSQL with Drizzle ORM, Zod validation, vendor membership checks, signed Razorpay webhooks, append-only-style ledger patterns, and a useful set of pure domain-rule tests. The repository README also correctly describes the product as an evolving MVP rather than a fully enabled marketplace.

However, the reviewed revision contains several high-impact risks. The most urgent are unguarded scheduled-workflow helpers exported from Server Action modules, missing enforcement of child-provider safety verification, a publicly callable image-upload action alongside a committed third-party API key, and kids booking/pass flows that can create confirmed or paid records without a verified payment lifecycle.

**Recommendation: do not treat all RUXs marketplace flows as production-ready until the P0/P1 findings are fixed and regression-tested.** Prioritize the server-action exposure, children’s provider vetting, image upload/key rotation, and the kids payment state machines before expanding launch traffic.

The report also includes an admin-panel and merchant-panel feature roadmap, a shared UI/UX centralization strategy, a copy-paste redesign implementation prompt, and release acceptance criteria.

### Highest-priority findings

1. **Potentially unauthorised data mutation:** `lockCutoffForProduct` and `generateBillsForVendor` are exported from files marked `"use server"`, but the helpers themselves do not enforce authorization. They perform order-generation and invoice-generation database writes.
2. **Child safety / trust issue:** kids marketplace discovery and booking paths do not require a verified provider profile. Missing verification data is presented as approved/passed by default.
3. **Upload abuse and credential exposure:** `uploadImageAction` has no visible authentication/authorization check and calls an ImgBB uploader whose API key is hardcoded in source.
4. **Payment integrity:** kids service bookings, workshop enrollments, and holiday passes do not consistently follow payment confirmation states. In particular, passes are marked paid in a service comment-labelled demo/test behavior.
5. **Review integrity:** kids activity reviews can be published without proving completion and without binding the referenced booking to the vendor being reviewed.
6. **Release assurance gap:** CI runs pure core tests but does not run the repository’s integration tests or Playwright suite; `playwright.config.ts` points to `./e2e`, where no tracked test files were found in the inspected tree.

## 2. Scope and limitations

This report is based on reading the repository tree and selected source files at the revision listed above. It covers code-level authorization, payment transitions, domain logic, configuration, and test wiring.

**Not verified in this audit:** the production deployment’s runtime behavior, live database contents, Cloudflare secrets/bindings, provider dashboard settings, actual payment captures/refunds, real user journeys in a browser, production logs, or whether the current deployment has already mitigated any findings outside the checked revision. I did not run the test suite or a production smoke test as part of this read-only repository inspection. Findings below are marked as code-confirmed where the source directly shows the behavior; runtime impact still needs to be reproduced safely in a test environment.

## 3. Findings at a glance

| ID | Severity | Finding | Main files | Recommended action |
|---|---|---|---|---|
| RUX-01 | **P0 — Critical** | Internal order and billing helpers are exported from `"use server"` modules without their own authorization | `src/features/orders/actions.ts`, `src/features/billing/actions.ts` | Move helpers to server-only service modules; keep exposed actions guarded |
| RUX-02 | **P0 — Critical** | Kids provider verification is not enforced; missing profile defaults to approved/passed | `src/features/kids/queries.ts`, `booking-service.ts`, `workshop-service.ts` | Fail closed; require approved and passed status across display and mutation paths |
| RUX-03 | **P1 — High** | Unauthenticated image upload plus hardcoded ImgBB API key | `src/features/assets/actions.ts`, `src/lib/imgbb.ts` | Rotate key, move to secrets, authorize uploads, validate/rate-limit |
| RUX-04 | **P1 — High** | Kids service online booking can be confirmed before payment and is not wired to the payment lifecycle | `src/features/kids/booking-service.ts`, `src/db/schema/kids.ts`, `src/features/payments/actions.ts` | Implement held/pending payment flow or disable online option |
| RUX-05 | **P1 — High** | Holiday-pass purchase is marked paid without payment confirmation; request idempotency key is ignored | `src/features/kids/holiday-pass-service.ts`, `src/features/kids/actions.ts` | Disable real purchases until integrated; persist unique client key and settle only on verified payment |
| RUX-06 | **P1 — High** | Workshop enrollment is confirmed while payment status is unpaid | `src/features/kids/workshop-service.ts` | Hold capacity pending payment and release expired holds |
| RUX-07 | **P1 — High** | Kids reviews can be published without verifying completed eligible activity | `src/features/kids/actions.ts`, `src/features/kids/schemas.ts` | Require completed activity, verify vendor match, enforce uniqueness |
| RUX-08 | **P1 — High** | Online order email says “Order Confirmed” before payment and labels online as monthly bill | `src/features/consumer/actions.ts` | Send appropriate pending-payment email; send confirmation after verified capture |
| RUX-09 | **P1 — High** | Repeated dues-payment starts can create multiple payment orders for the same balance | `src/features/payments/actions.ts`, `src/features/payments/settle.ts` | Reuse one pending payment and serialize/idempotently settle dues |
| RUX-10 | **P2 — Medium** | Email HTML template interpolates dynamic values without HTML escaping | `src/features/notifications/service.ts` | Escape text and attributes; validate link destinations |
| RUX-11 | **P1 — High** | CI does not run integration or end-to-end flows | `.github/workflows/ci.yml`, `playwright.config.ts`, `tests/` | Add isolated test DB and critical smoke/E2E coverage |
| RUX-12 | **P2 — Medium** | `/in/:path*` redirect to `/app` may discard the intended locality path | `next.config.ts`, README | Confirm intended route behavior; preserve or deliberately resolve locality |
| RUX-13 | **P2 — Medium / verify** | Migration metadata contains one snapshot for 15 journal entries | `src/db/migrations/meta/`, migration journal | Validate generation in a scratch database/branch before relying on future schema diffs |

Severity definitions: **P0** means fix before exposing the affected workflow to untrusted users; **P1** means high business, money, trust, or launch risk; **P2** means important hardening or validation work that should be scheduled before wider rollout. Prioritization assumes these code paths are part of the active application; verify deployment flags and route exposure before determining real-world exploitability.

---

## 4. Detailed findings and remedies

### RUX-01 — Internal order-generation and billing functions are callable Server Actions

**Severity: P0 — Critical**  
**Evidence:**
- [`src/features/orders/actions.ts`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/orders/actions.ts#L159) exports `lockCutoffForProduct(productId, serviceDate, database?)`. The module begins with `"use server"`. The helper inserts daily `orders` rows for subscriptions associated with a supplied product and date, without calling `requireUser`, `requireVendorAccess`, or `requireAdmin`.
- [`src/features/billing/actions.ts`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/billing/actions.ts#L12) exports `generateBillsForVendor(vendorId, period, database?)` from another `"use server"` module. It creates monthly invoice records for a supplied vendor and period without its own authorization check.
- The cron endpoint at [`src/app/api/cron/tick/route.ts`](https://github.com/SH20RAJ/ruxs/blob/main/src/app/api/cron/tick/route.ts) imports these helpers, explaining why they may have been exported for internal reuse.

**Why it matters:** In Next.js, exported async functions in a `"use server"` module should be treated as remotely invocable Server Actions, not just private utility functions. The guarded user-facing actions in these modules do not protect a separate exposed helper. Depending on the framework-generated action exposure and deployment, an untrusted caller may be able to trigger order generation or invoice generation for arbitrary IDs/dates/periods. The extra `database` argument is also an implementation detail that should not be part of a public action contract.

**How to fix:**
1. Move internal logic into separate `server-only` modules, for example `src/features/orders/cutoff-service.ts` and `src/features/billing/generate-bills.ts`.
2. Export the pure internal functions from those modules; import them from the cron route and the guarded action module.
3. Keep only intended user-invocable mutations in `"use server"` modules. Validate period/date ranges at the entry boundary.
4. Ensure the cron route remains bearer-secret guarded and ensure the secret is long, random, stored only in the deployment secret manager, and rotated if exposed.

**Acceptance tests:** An anonymous/sessionless caller cannot invoke order cutoff or invoice generation. A vendor owner can generate only their own permitted invoice period through the guarded action. The scheduled worker can invoke the internal helper. Duplicate cutoff runs remain idempotent.

### RUX-02 — Kids provider vetting is not a hard requirement

**Severity: P0 — Critical (child-safety/trust)**  
**Evidence:**
- [`src/features/kids/queries.ts`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/kids/queries.ts#L55) filters services for active status and non-archived records, but does not require `kidsProviderProfiles.verificationStatus === "approved"` and `safetyReviewStatus === "passed"`.
- [`getKidsProviderBySlug`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/kids/queries.ts#L267) retrieves an active vendor without a vetting-state filter. It then defaults missing profile fields to `verificationStatus: "approved"` and `safetyReviewStatus: "passed"` near lines 328–329.
- [`createKidsBooking`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/kids/booking-service.ts#L34) and [`enrollInWorkshop`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/kids/workshop-service.ts#L20) validate activity/vendor availability but do not require successful provider verification.

**Why it matters:** A missing provider profile can be represented to users as vetted, and an active vendor with pending or flagged safety status may remain discoverable/bookable. That makes the safety badge/status unreliable and creates a particularly serious trust issue for a kids marketplace.

**How to fix:**
1. Make missing profiles explicitly pending/unverified rather than approved/passed.
2. Create a single server-side helper such as `requireApprovedKidsProvider(vendorId)` and use it in search results, detail pages, direct booking creation, workshop enrollment, and any pass/enrollment flows tied to providers.
3. Fail closed when verification is missing, rejected, suspended, or safety review is flagged/pending.
4. Ensure changes to approval/safety status invalidate cached pages and do not rely only on UI hiding.
5. Add an audit trail for who changed provider status, when, and why; restrict this mutation to `requireAdmin` as the existing admin action attempts to do.

**Acceptance tests:** pending, absent, rejected, suspended, and flagged providers are not shown as verified and cannot receive a new booking; approved + passed providers can be listed/booked; direct server-action calls cannot bypass the checks.

### RUX-03 — Image uploads lack visible access control and a third-party API key is committed

**Severity: P1 — High**  
**Evidence:** [`src/features/assets/actions.ts`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/assets/actions.ts#L11) exports `uploadImageAction(formData)` from a `"use server"` file. The function accepts a `Blob` or string image value and calls the uploader without an authentication or role check. [`src/lib/imgbb.ts`](https://github.com/SH20RAJ/ruxs/blob/main/src/lib/imgbb.ts#L6) defines the ImgBB API key as a hardcoded source constant, then sends it to the ImgBB upload endpoint.

**Why it matters:** An unauthenticated upload path can be abused for storage/quota exhaustion or unwanted content uploads. A key committed to Git should be considered exposed even if the repository is private; it can be copied from source history. This report intentionally does not reproduce the key value.

**How to fix:**
1. Revoke/rotate the existing ImgBB key immediately and check provider usage/logs for suspicious uploads.
2. Read the replacement key from a server-only environment secret, never from a `NEXT_PUBLIC_` variable or repository constant.
3. Require authentication and authorize the caller for the particular vendor/resource being edited (owner/admin as appropriate); do not rely on a UI-only restriction.
4. Validate MIME type, maximum byte size, file signature, and allowed formats on the server. Reject arbitrary data strings and enforce per-user/per-vendor rate limits.
5. Return a safe, minimal error to clients and log provider diagnostics without leaking secrets.

**Acceptance tests:** unauthenticated upload rejected; staff roles can upload only where explicitly allowed; non-image, oversized, and malformed payloads rejected; key absent from repository source/history after rotation; rate limits tested.

### RUX-04 — Kids online service bookings can be confirmed before payment

**Severity: P1 — High**  
**Evidence:** [`src/features/kids/booking-service.ts`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/kids/booking-service.ts#L179) inserts a kids service booking with `paymentStatus: input.paymentMode === "online" ? "unpaid" : "unpaid"`, `bookingStatus: "confirmed"`, and a `heldUntil` timestamp only for online payments. The status is confirmed regardless of payment mode. The kids booking schema in [`src/db/schema/kids.ts`](https://github.com/SH20RAJ/ruxs/blob/main/src/db/schema/kids.ts) does not persist a payment-mode field. The generic [payment actions](https://github.com/SH20RAJ/ruxs/blob/main/src/features/payments/actions.ts) work with the generic `bookings` and `shopOrders` tables, not `kidsServiceBookings`.

**Why it matters:** The UI can appear to confirm an online-paid session without a working connection to checkout/capture, and the hold timestamp does not itself expire or transition this booking. Unpaid reservations may occupy slots, and the provider/guardian can see a confirmation without the expected payment having occurred.

**How to fix:** Choose one safe product behavior before launch:
- **Short-term:** disable the online payment option for kids services until implemented and clearly present supported payment methods; or
- **Complete integration:** persist payment mode and payment reference, create a payment/order record tied to the kids booking, set the booking to `held`/awaiting payment, confirm only after verified capture, expire the hold reliably, and handle late capture/refund-required transitions.

Use a single transition service and database transaction for payment + booking updates. Do not trust browser success alone; verify the Razorpay signature and captured amount and make webhook processing idempotent.

**Acceptance tests:** an unpaid online booking is never confirmed; successful verified payment confirms exactly once; expired holds free capacity; a late payment after expiration enters an explicit refund/reconciliation state; duplicate webhooks are harmless.

### RUX-05 — Holiday passes are marked paid without a payment record or verification

**Severity: P1 — High**  
**Evidence:** [`src/features/kids/holiday-pass-service.ts`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/kids/holiday-pass-service.ts#L15) creates a pass purchase and sets `paymentStatus: "paid"` near line 45, with the inline comment `// Demo / test mode confirms`. The service input includes `clientKey`, and the action passes one, but the service does not persist or check it as an idempotency key. The pass schema contains purchase and remaining-credit fields, but this path does not integrate with the generic Razorpay payment lifecycle.

**Why it matters:** If reachable in the deployed customer flow, anyone who can call this action may acquire paid credits without a successful payment; retries can also create multiple purchases because the client key is ignored.

**How to fix:** Disable pass purchasing in production until end-to-end payment is implemented. Persist a unique idempotency/client key in the purchase table and check it transactionally. Create the pass as `unpaid`/pending; mark it paid and grant credits only after a verified payment capture. Use a single transaction for payment settlement and credit activation. Keep demo behavior behind an explicit non-production flag that cannot be enabled accidentally on the live environment.

**Acceptance tests:** no credits are usable before captured payment; repeated requests with the same client key return the same purchase; altered keys cannot purchase for another user; failed/cancelled payment does not activate credits.

### RUX-06 — Workshop enrollments are confirmed despite an unpaid status

**Severity: P1 — High**  
**Evidence:** [`src/features/kids/workshop-service.ts`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/kids/workshop-service.ts#L122) inserts workshop enrollment with `status: "confirmed"` and `paymentStatus: "unpaid"`. It reserves capacity through an active-enrollment count, but this service does not link the enrollment to payment capture or define expiry of a pending payment reservation.

**Why it matters:** Users can be told they are enrolled before paying, while unpaid registrations may consume workshop capacity. This also makes the displayed business state misleading for guardians and providers.

**How to fix:** Treat enrollment as pending/held until payment is captured or an explicitly accepted non-online payment method is selected. Define which states count against capacity, set an expiry timestamp for online holds, and release expired reservations atomically. Recheck capacity under a row/advisory lock during the final transition, not only in the UI.

**Acceptance tests:** paid enrollment becomes confirmed once; an unpaid enrollment is labelled correctly and expires; concurrent sign-ups cannot exceed capacity; cancellation and payment failure free the slot according to policy.

### RUX-07 — Kids reviews do not prove completion or verify vendor consistency

**Severity: P1 — High**  
**Evidence:** [`submitKidsReviewAction`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/kids/actions.ts#L277) optionally receives a `bookingId`. If supplied, it checks that a booking belongs to the current guardian, but it rejects only when the booking is missing; it does not require the fetched status to equal `completed`. It also does not compare the booking’s vendor ID to the submitted `vendorId`. Both booking and enrollment IDs are optional in the schema, and new reviews are inserted with `moderationStatus: "published"` around line 310.

**Why it matters:** A signed-in user may be able to publish a review without having completed the activity, use a booking associated with another vendor, or submit a review without an eligible booking/enrollment reference.

**How to fix:** Require at least one valid activity reference. Confirm the booking/enrollment belongs to the signed-in guardian, is completed, belongs to the submitted vendor, and is eligible under cancellation/refund rules. Add uniqueness constraints to prevent duplicate reviews for the same activity and guardian. Consider a pending moderation state for new reviews, especially while abuse controls are limited.

**Acceptance tests:** pending/held/cancelled bookings cannot be reviewed; incomplete or cross-vendor IDs are rejected; review without an eligible booking/enrollment is rejected; duplicate reviews fail at the database level.

### RUX-08 — Order email claims online orders are confirmed before payment

**Severity: P1 — High (customer trust)**  
**Evidence:** In [`src/features/consumer/actions.ts`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/consumer/actions.ts#L113), online orders are initially stored with status `awaiting_payment`. Later in the same action, the email template is called with the heading `Order Confirmed` around line 228 and a message saying the kitchen has been notified. The email's payment-mode detail around line 233 maps only `cod` to “Pay on delivery” and labels every other mode “Monthly bill”, so `online` is misrepresented.

**Why it matters:** The customer may believe an order is placed and being prepared even when the order still awaits payment, and the payment method in email may be wrong.

**How to fix:** Branch notification copy and timing on the actual persisted order/payment state. For online orders, send a “Payment required / awaiting payment” notice with a checkout link, if that is desired. Send order confirmation to customers and merchant only after the verified payment transition changes the order to placed. For COD/monthly bill flows, use the exact payment mode and send confirmation only after the order is actually accepted into the intended workflow.

**Acceptance tests:** online orders do not send “confirmed” notifications before capture; the webhook/callback sends the final confirmation once; email payment mode always matches the stored order.

### RUX-09 — Dues payment can create duplicate payment orders for the same balance

**Severity: P1 — High (financial integrity)**  
**Evidence:** [`startDuesPayment`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/payments/actions.ts#L156) computes a current customer ledger balance around line 177 and creates a new Razorpay order with a time-derived receipt. Unlike the order/booking payment flows in the same file, it does not look for and reuse an existing payment with status `created` for the customer’s dues. [`src/features/payments/settle.ts`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/payments/settle.ts) makes each captured payment add its own idempotent ledger entry keyed by Razorpay payment ID.

**Why it matters:** repeated or concurrent requests can create more than one payable Razorpay order for the same outstanding balance. If both are captured, the ledger may receive more than one payment credit, creating overpayment/reconciliation work. Payment settlement can be idempotent per payment, while still allowing two different payments for one intended balance.

**How to fix:** Create a durable “outstanding dues payment attempt” keyed by customer and balance/invoice version; reuse its open Razorpay order. Serialize creation using a transaction/row lock or unique constraint. On settlement, verify the captured amount against the saved expected amount and detect stale balances. Define a deliberate overpayment/refund/credit policy.

**Acceptance tests:** concurrent calls for the same dues snapshot yield one active payment order; repeated webhook delivery settles one payment once; two separate captured payments for one intended dues snapshot are flagged for reconciliation rather than silently creating excess credit.

### RUX-10 — Dynamic values are inserted into transactional email HTML without escaping

**Severity: P2 — Medium**  
**Evidence:** [`src/features/notifications/service.ts`](https://github.com/SH20RAJ/ruxs/blob/main/src/features/notifications/service.ts) builds HTML using template-string interpolation for the heading, lead, details labels/values, action text, and action URL. These are not consistently escaped as HTML text or attribute values. Some values can originate from merchant-provided names or customer/vendor review replies.

**Why it matters:** A user-controlled string containing markup may alter email rendering or spoof the message. The risk is increased where review text/replies or vendor profile information appears in transactional messages.

**How to fix:** Implement central HTML escaping for all text nodes and attribute contexts. Validate action URLs using a strict `https:` allowlist and escape the URL before interpolation. Do not treat database values as trusted HTML. Add template-level tests with `<script>`, quotes, angle brackets, ampersands, and malicious `href` strings.

### RUX-11 — CI omits integration tests and the configured E2E suite appears empty

**Severity: P1 — High (release assurance)**  
**Evidence:** [` .github/workflows/ci.yml`](https://github.com/SH20RAJ/ruxs/blob/main/.github/workflows/ci.yml#L34) runs `bun test src/core`, then typecheck, lint, and a production build. The repository includes `tests/integration/features.test.ts` and `tests/integration/kids-domain.test.ts`, but CI does not run `bun test src tests`. [`playwright.config.ts`](https://github.com/SH20RAJ/ruxs/blob/main/playwright.config.ts#L4) points to `testDir: "./e2e"`; no tracked `e2e` files were present in the inspected recursive tree.

**Why it matters:** Typechecking and a production build cannot prove authorization boundaries, database constraints, payment transitions, or customer journeys work. A configured E2E command without test files gives little release confidence. The workflow also uses `bun-version: latest`, which can make future builds change when the toolchain updates.

**How to fix:**
1. Run integration tests against an isolated disposable PostgreSQL database/branch in CI, applying migrations first. Never point CI tests at production.
2. Add E2E tests for signup/sign-in, merchant approval, tenant boundaries, checkout/webhook settlement, cancellation/refunds, invoice generation, cutoff scheduling, child-provider approval, pass purchase, and mobile flows.
3. Add a test result summary and fail the job on skipped critical cases or missing test files.
4. Pin Bun and relevant action/toolchain versions to known-good versions and update deliberately.
5. Provide CI with minimal-permission secrets only when needed and ensure forks cannot access secrets.

**Acceptance tests:** CI runs all deterministic core tests, integration tests against a fresh test DB, and a meaningful E2E suite; the job fails if a required test group is missing or skipped.

### RUX-12 — Local discovery URL redirect may discard its location slug

**Severity: P2 — Medium**  
**Evidence:** [`next.config.ts`](https://github.com/SH20RAJ/ruxs/blob/main/next.config.ts) redirects `/in/:path*` to `/app` without preserving the captured path. The README advertises `/in/bengaluru` as a local discovery landing page.

**Why it matters:** If `/in/bengaluru` is intended to be a location-specific public landing page, redirecting all such paths to `/app` discards the city slug and may undermine locality-aware discovery and search indexing. This needs product confirmation; it may be deliberate if `/in/*` is only a temporary funnel.

**How to fix:** Decide whether `/in/:city` is meant to be an actual SEO landing route or a redirect. If it should be a landing page, implement the dynamic route, preserve the city, canonicalize it, and show services available in that location. If it is only a funnel, update public links and README copy so users and crawlers are not promised a route that behaves differently.

**Acceptance tests:** `/in/bengaluru` renders the agreed localized experience or redirects to an explicitly documented location-aware destination; it must not silently erase the location context.

### RUX-13 — Drizzle migration metadata should be validated before future schema changes

**Severity: P2 — Verify in a scratch environment**  
**Evidence:** `src/db/migrations/` contains SQL migrations `0000` through `0014`, and `src/db/migrations/meta/_journal.json` lists 15 migration entries, while the inspected `meta` directory includes only `0000_snapshot.json`.

**Why it matters:** This does not by itself prove migrations fail to apply; the SQL journal is present. But missing snapshots for later migration indices may affect future Drizzle migration generation/diff behavior and risks confusing future maintainers. Do not regenerate or rewrite production migration history based only on this observation.

**How to fix:** In a disposable database/branch, run the documented migration and generation commands with the exact locked Drizzle version. Verify a clean schema diff produces no unexpected changes and that the expected snapshot metadata is generated. Commit the correct metadata if required by the installed version; do not modify already-applied production migration files in place.

**Acceptance tests:** a fresh database can apply every migration in order, and a subsequent `db:generate` after no schema changes creates no unexpected destructive migration.

---

## 5. Additional checks worth doing

These are not all confirmed defects in the reviewed source; they are important verification tasks before wider launch:

- **Payment reconciliation:** compare payment table states, order/booking states, ledger entries, and Razorpay captured/refunded amounts in staging. Confirm webhook amount validation is always present and refunds are actually issued or tracked rather than merely marked `refund_due`.
- **Tenant isolation:** fuzz every server action with valid IDs belonging to a different vendor/customer. The `requireVendorAccess` helper is a good foundation, but the child actions and unauthenticated upload route demonstrate why every mutation needs its own guard.
- **Children’s privacy:** minimize stored child profile data, strictly scope reads and exports to guardian/provider/admin roles, protect private routes from caching and indexing, and review consent versioning and deletion/retention behavior.
- **Cron reliability:** verify the actual Cloudflare Cron Trigger configuration, request timeout limits, retry behavior, and whether a large vendor/product list may exceed one invocation. Make jobs resumable and observable; avoid relying on a single HTTP run completing every row.
- **Database performance:** inspect `EXPLAIN ANALYZE` on production-like data for customer ledger scans and unbounded `searchKidsServices` result collection. The latter fetches matching rows and performs free-text filtering in application memory, which may become expensive as the catalogue grows. Add filtering, pagination, and targeted indexes before scale requires it.
- **Operational observability:** add structured logs/correlation IDs for orders and payments, alert on webhook failures and stuck `awaiting_payment`/`refund_due` records, and provide a reconciliation view for admins.
- **Public marketing claims:** compare the marketing and pricing pages to real feature availability. The README appropriately warns that marketplace checkout is incomplete; UI copy must maintain the same honesty.

## 6. Recommended implementation order

### Phase 0 — Contain the most serious risks

1. Move `lockCutoffForProduct` and `generateBillsForVendor` into `server-only` helper modules and keep exposed mutations authenticated.
2. Rotate the committed ImgBB key and secure the image upload action.
3. Fail closed on missing/pending kids provider verification and block unapproved providers at server-side booking/enrollment boundaries.
4. Disable kids pass purchase and kids online payment paths in production until their payment state machines are correct.
5. Correct the kids review eligibility checks so users cannot create unearned published reviews.

### Phase 1 — Make money/status transitions reliable

1. Define one explicit state machine per order, standard booking, kids booking, workshop enrollment, holiday pass, payment, and refund.
2. Treat server-verified captured payment as the only basis for a paid/confirmed online transaction.
3. Ensure all settlement paths are idempotent and compare expected vs captured amount.
4. Prevent duplicate dues checkout orders and create admin reconciliation for late capture, overpayment, refund due, and failed refund.
5. Correct the order emails and test notification timing.

### Phase 2 — Improve confidence and ongoing operations

1. Add integration CI against a disposable PostgreSQL database and make skipped tests visible.
2. Create Playwright tests for critical customer and merchant paths on mobile and desktop.
3. Validate schema migration generation in a scratch branch and pin the CI toolchain.
4. Add structured logs/metrics and alerts for payment/webhook/cron failures and stuck states.
5. Run a performance pass on high-volume queries, especially catalogue search and ledger balance computation.

## 7. Release acceptance checklist

Before enabling the affected features for real customers, confirm all of the following:

- [ ] No internal mutation helper is inadvertently exposed as a user-invocable Server Action.
- [ ] All write actions authenticate the user and authorize their role and tenant on the server.
- [ ] Kids services, providers, and workshops cannot be booked unless the provider satisfies the required verification and safety states.
- [ ] A `paid` record always corresponds to a verified captured payment or an explicitly authorized non-online payment workflow.
- [ ] Online bookings are not confirmed before payment; expired holds release capacity; late payment is reconciled.
- [ ] Holiday passes cannot be activated for free and duplicate purchase requests are idempotent.
- [ ] Workshop capacity remains correct under concurrent requests, payment expiry, cancellation, and retries.
- [ ] Every kids review is tied to a completed eligible activity for the same vendor and guardian.
- [ ] Dues payment initiation cannot create multiple active payment orders for one balance snapshot.
- [ ] Email templates safely escape dynamic values and accurately reflect transaction states.
- [ ] ImgBB key is rotated, sourced from secrets, and uploads are authenticated, validated, and rate-limited.
- [ ] CI runs core, integration, and meaningful E2E tests against test resources only.
- [ ] Migration generation is verified on a disposable database with the locked tooling versions.
- [ ] Staging smoke tests cover payment success/failure, duplicate webhook, late capture, cancellation, refund, cron replay, and cross-tenant access attempts.

## 8. Overall assessment

RUXs is not starting from zero: its feature boundaries, validation schemas, vendor-role helper, signed webhook verification, transaction use in several flows, and pure domain tests are solid foundations to build on. The main issue is that a few high-impact workflows do not consistently apply those safeguards end-to-end. In a marketplace handling payments and children’s activities, “the UI normally does not show this” or “the status should be correct” is not enough; authorization, provider vetting, idempotency, and payment-state transitions must be enforced at the server and database boundaries.

**Best next step:** fix RUX-01 through RUX-07 in focused pull requests, add regression tests as part of each change, and only then proceed with full staging checkout/launch verification. This report identifies code-level risks from the reviewed revision; it is not a substitute for staging reproduction, production configuration review, or a qualified security review.

---

# 9. Product feature roadmap: Admin panel and Merchant panel

This section proposes additions based on the codebase's existing domains and routes. It is a product roadmap, not a claim that every suggested feature is absent; several foundations already exist (vendor management, bookings, invoices, payouts, support tickets, analytics, reviews, products/services, subscriptions, inventory, and settings). The objective is to close operational gaps and make existing features more coherent before adding unrelated scope.

## 9.1 Admin panel — suggested improvements

The admin panel should be an **operations and governance console**, not just a collection of CRUD pages. The first screen should tell the team what requires intervention today.

| Priority | Feature | What it should do | Why it matters / acceptance criteria |
|---|---|---|---|
| P0 | **Operations overview / exception queue** | Show pending merchant approvals, suspended merchants, payment failures, overdue refunds, failed payouts, disputed orders, stalled bookings, open urgent tickets, and cron/job health. Each item links directly to the record and next action. | Admin can see the unresolved launch-critical work without manually checking multiple pages. Counts reconcile with underlying records and show a last-updated timestamp. |
| P0 | **Merchant verification workbench** | A step-by-step review for identity/business documents, bank details, contact verification, store photos, service-area validation, and category-specific safety checks. Store status, reviewer, decision, evidence, notes, timestamps, and rejection reason. | No merchant can accept real orders until required checks are explicitly complete. Sensitive files are private, access-logged, retained only as long as necessary, and never exposed in public storefront responses. |
| P0 | **Payments, refunds and reconciliation console** | Search payment by RUXs order/booking/invoice, Razorpay order/payment IDs, user, merchant, date, amount, and state. Show expected vs captured vs refunded amounts, webhook history, idempotency state, and actions requiring approval. | Admin can detect amount mismatches, late captures, duplicate payments and stuck `refund_due` records. Never call a record “refunded” until the gateway confirms the refund. Destructive/high-value actions require audit trails and possibly dual approval. |
| P0 | **Audit log for privileged actions** | Record actor, role, action, target, timestamp, before/after changes (redacted), reason, and request/correlation ID for merchant approval/suspension, credential resets, payout/refund actions, category changes, admin access changes, and platform settings. | Logs are append-only to application roles and searchable by target/actor. Secrets, payment credentials and unnecessary personal data are not logged. |
| P1 | **Merchant lifecycle and onboarding tracker** | Track `application → needs information → under review → approved/rejected → active/suspended`, onboarding completion, pending documents, first catalogue item, first available slot, first successful order and first payout. | Support can explain the next required step and measure activation friction. State changes are authorized and recorded. |
| P1 | **Disputes and support SLA management** | Priorities, assignment, internal notes, customer/merchant-visible replies, attachments, due times, escalation rules, and response/resolution metrics. | Every ticket has an owner, status and next action; overdue urgent tickets appear in the exception queue. |
| P1 | **Catalog and content moderation** | Review listing images, service descriptions, category assignment, pricing, prohibited content, and reported listings. Support hide/unpublish with reason and appeal history. | Public pages only show approved/active/available records according to a defined publication policy. |
| P1 | **Kids safety governance** | A dedicated queue for provider qualifications, identity/background-check status where legally appropriate, safety review, guardian consent policy versions, complaints, incident escalation and review expiry. Keep sensitive notes private. | Provider discovery and booking fail closed until required approval is complete. Store only evidence necessary for the policy and define retention/access controls. |
| P1 | **Financial rules and tax configuration** | Central, versioned settings for commission, fees, tax treatment, rounding, refund rules and invoice formatting, with effective dates and an audit trail. Avoid unexplained hardcoded percentages. | Every transaction stores a snapshot of the applied configuration. Changes do not silently recalculate historical orders. Tax rules must be confirmed by a qualified accountant/advisor before release. |
| P1 | **Role and permission management** | Separate platform admin, support, finance, verification reviewer and read-only analyst capabilities; apply least privilege and record grant/revocation events. | Support cannot perform finance/admin operations without permission. Admin roster cannot be accidentally reduced to zero. |
| P1 | **Customer privacy requests** | A controlled process for data access/export, correction, deletion where applicable, consent history and account closure. Track request status and exceptions for legally required financial retention. | Sensitive data is only available to authorized staff; deletion is consistent across related records and policy-compliant. |
| P2 | **Locality and supply coverage dashboard** | Coverage by city/area/pincode, active providers, accepting-order status, catalogue depth, distance, failed delivery reasons and demand signals. | The product team can tell where RUXs can honestly claim service availability and where supply is missing. |
| P2 | **Controlled feature flags and launch gates** | Enable features by environment, vendor type or locality; show owner, reason, created/expiry dates and impact. | High-risk features (online kids payments, payout release, etc.) remain disabled until their acceptance checks pass. Flag changes are audited. |
| P2 | **Export center and scheduled reporting** | Authorized CSV exports for vendors, orders, payouts, invoices and support metrics, with date filters, redaction and export history. | Exports are permission-checked, rate-limited, scoped and auditable; do not expose arbitrary tenant data. |

### Recommended admin information architecture

- **Overview:** exceptions, KPIs, job health and today's priorities.
- **Merchants:** applications, verification, profiles, status, staff, onboarding.
- **Marketplace:** catalogue moderation, categories, localities and availability.
- **Transactions:** orders, bookings, payments, refunds, payouts, invoices, reconciliation.
- **Trust & Safety:** kids-provider reviews, consent/incident workflow, reports and moderation.
- **Support:** tickets, SLA, escalations and communication history.
- **People & Access:** households, admin roles, access logs and privacy requests.
- **Analytics & Exports:** operational/financial reports with explicit date ranges.
- **Settings & Audit:** tax/commission rules, feature flags, notification settings and audit log.

If the current route layout is already heavily established, introduce these as sections within the existing console rather than duplicating screens or replacing working routes all at once.

## 9.2 Merchant panel — suggested improvements

The merchant panel should be a **daily business workspace**. Its home screen should answer: What do I need to do today? What is late or at risk? How much did I sell/collect? What should I do next?

| Priority | Feature | What it should do | Why it matters / acceptance criteria |
|---|---|---|---|
| P0 | **Action-first Today dashboard** | One queue for orders to accept/prepare/deliver, today's subscriptions and cutoffs, bookings, payment/collection issues, stock/returnable exceptions, and urgent customer requests. Show clear counts and one-click safe actions. | The merchant can complete a normal operating day from mobile without hunting across tabs. Every action has a confirmation/undo strategy where appropriate and a server-side permission check. |
| P0 | **Reliable order/booking timelines** | A timestamped event history for placed, accepted, prepared, out for delivery, delivered, cancelled, payment captured, refund requested, refund completed, booking held/confirmed/completed, with actor and reason. | Customer support and merchants can explain what happened; UI status derives from server state, not an optimistic client-only update. |
| P0 | **Payment and dues reconciliation** | Show unpaid order amount, customer ledger balance, Razorpay status, COD/cash collections, online payment and payout statuses separately. Support safe recording of offline collections with actor, timestamp, reference and idempotency. | No confusing conflation of order state with payment state; totals reconcile to ledger and gateway; duplicate collections are prevented or flagged. |
| P1 | **Guided onboarding checklist** | Business profile, service area, bank/payout details, required documents, products/services, service hours/cutoffs, delivery fee/minimum order, staff, policies and go-live check. Show approval state and specific missing steps. | The merchant understands what is blocking approval/go-live and cannot mistake a saved draft for a published listing. |
| P1 | **Catalogue and price management** | Bulk import/export, validation preview, safe bulk edit, image upload with constraints, availability scheduling, stock, service duration/capacity, optional add-ons/material fees, historical price snapshots. | Bad rows are reported individually; bulk changes are previewable/reversible; active orders keep their price snapshot. |
| P1 | **Subscription lifecycle controls** | Pause/resume, start/end dates, weekly schedule, skip/extra/quantity changes, cutoff countdown, holiday handling, next delivery preview and change history. | Rules are clear about what can still be changed before cutoff; the final daily quantity matches the change log and billing. |
| P1 | **Unified calendar and availability** | Day/week/month views for sessions, bookings, workshops and time off; staff assignment and capacity where applicable; prevent overlapping slots and unavailable-provider booking. | Time zone is consistent (IST for the current India-focused workflow), bookings cannot exceed capacity, and expired holds release capacity. |
| P1 | **Customer CRM and communication history** | Customer profile, contact details, address/service preferences, active plans, order history, outstanding balance, disputes and interaction history. Provide safe contact-link and private-link reset actions. | Merchant can serve a customer without exporting spreadsheets. Access is tenant-scoped; sensitive links are not shown unnecessarily or logged in analytics. |
| P1 | **Delivery/run-sheet optimization** | Route-ordered run sheet, map links, delivery attempts, failed-delivery reasons, returnable cans/dabbas, proof/notes if appropriate, offline-tolerant status capture with conflict handling. | Driver can work on a phone; offline mode never invents success and sync conflicts are visible. Avoid caching sensitive customer details beyond what's essential. |
| P1 | **Inventory and returnable assets** | Stock movements, opening/closing counts, cans/dabbas out/in, damaged/lost assets, minimum-stock warnings, deposit ledger and reconciliation. | Inventory totals derive from movement records and reconcile with customer-level outstanding assets and deposits. |
| P1 | **Payouts, fees and settlement history** | Expected payout, commission/fees, adjustments, bank account status (masked), payout schedule, completed/failed payout and downloadable statement. | Merchants can understand how net payout is calculated and raise a dispute against a specific line item. Never expose full bank details. |
| P1 | **Reports with clear definitions** | Daily/weekly/monthly sales, active subscribers, delivery completion, cancellations, refunds, average order value, outstanding dues, popular items and repeat customers. Include CSV export and date/time zone. | Metrics use documented formulas and respect merchant scope. Avoid charts whose totals disagree with the ledger/invoice data. |
| P1 | **Staff roles and task assignment** | Owner, manager/staff and driver permissions; assign routes/bookings; invite/revoke staff; show last activity where available. | A driver cannot change payouts/catalog pricing or access unrelated customer/merchant data. |
| P2 | **Customer-facing storefront preview** | Preview mobile/desktop listing, prices, service area, hours, policies and availability before publishing; show completeness warnings. | What the merchant previews matches the public listing and availability logic. |
| P2 | **Notification center** | In-app notifications for new orders/bookings, upcoming cutoff, low stock, payment failure, cancellation, review, payout and unresolved support. Each notification deep-links to the relevant record. | Notifications are deduplicated, preference-aware and do not substitute for durable status changes. |
| P2 | **Guided setup and contextual help** | Inline explanations, field examples, validation at point of entry, first-run checklist, searchable help and contextual support ticket creation. | Fewer avoidable setup errors and support requests, without cluttering the daily-work screen. |

### Suggested merchant panel navigation

Use a consistent shared shell with a small number of durable primary destinations:

- **Today** — next actions, deadlines, exceptions.
- **Orders & Deliveries** — order queue, run sheet, delivery history.
- **Bookings** — calendar, services, sessions and capacity (where applicable).
- **Customers** — customer history, plans, balances, private links.
- **Catalogue** — products/services, schedules, inventory and add-ons.
- **Money** — ledger, bills, collections, payments and payouts.
- **Insights** — analytics and exports.
- **Inbox** — notifications, reviews, tickets and important system alerts.
- **Business settings** — profile, team, policies, service area and availability.

Only show domain-specific destinations that the vendor type can use. Keep the route authorization and `requireVendorModule` server-side; hiding a menu item is not access control.

## 9.3 Shared features both panels need

1. **Universal search:** search only records within the actor's authorized scope; show result type, useful status and a direct route.
2. **Global date range and time-zone conventions:** explicit dates; default to the business's intended timezone and state the timezone on reports.
3. **Consistent status vocabulary:** separate fulfillment status, payment status, verification state and support state. Do not reuse one ambiguous badge for multiple state machines.
4. **Action history:** show who performed a consequential action and when.
5. **Useful empty states:** explain why the list is empty and the next legitimate action; don't show fake demo totals as live business data.
6. **Operational feedback:** save/loading states, optimistic updates only when safely reversible, success/error messages, retry guidance and stale-data refresh.
7. **Responsive tables:** searchable/filterable tables on desktop; stacked rows/cards or controlled horizontal scrolling on mobile. Preserve primary actions and status at small widths.
8. **Accessible forms and dialogs:** labels, keyboard operation, focus management, error summaries, high contrast and adequate target sizes.
9. **Safe exports and privacy:** role-checked exports, redaction, no public indexing/caching of private customer routes, and no secrets or full payment/bank credentials in logs.
10. **Observability links:** correlation IDs and user-safe support diagnostics for failed workflows; never expose stack traces to end users.

## 9.4 What to build first

**First release slice (highest value):**
1. Fix and test the P0 security/payment/safety findings in Sections 4–6.
2. Add the admin exception queue and merchant verification workbench.
3. Add merchant Today action queue and reliable order/booking/payment timeline.
4. Add payment/refund reconciliation with a durable audit log.
5. Add shared UI tokens/components and refactor two or three high-traffic routes first (admin overview, merchant Today, checkout/order detail) as a representative vertical slice.
6. Add Playwright coverage for those exact journeys before migrating the remaining pages.

**Avoid building first:** a large new analytics suite, AI chat assistant, complex route optimization, elaborate gamification, or a total rewrite of all pages. These add surface area without resolving the current trust and operational risks.

---

# 10. UI/UX centralization and redesign strategy

## 10.1 Goals

RUXs needs a coherent design system shared by the public site, household app, merchant workspace and admin console, while still keeping each role's workflow appropriate. Centralization should reduce duplicated styles and inconsistent behavior—not force every screen into the same layout.

The intended outcome is a **clean, premium, trustworthy, mobile-first product UI** with clear information hierarchy, calm visual density, predictable navigation, accessible controls and consistent operational feedback. The redesign must preserve correct business logic and URLs while making important tasks easier to complete.

## 10.2 Centralization principles

- **One source of truth for design tokens:** central CSS custom properties for colors, typography, spacing, radii, shadows, borders, focus rings, layers and motion. Map Tailwind utilities to these tokens rather than repeating arbitrary hex values or one-off spacing everywhere.
- **One component library:** shared primitives for Button, IconButton, Input, Select, Textarea, Checkbox, Radio, Switch, Date/Time Picker, Dialog, Drawer, Tooltip, Tabs, Badge, Avatar, Card, Table, Pagination, Breadcrumbs, Toast, Skeleton, EmptyState, ErrorState, ConfirmAction and PageHeader.
- **Role-specific shells, shared foundations:** keep separate public, household, merchant and admin navigation where the tasks differ, but share typography, primitives, focus behavior, feedback, field styling and spacing rules.
- **Shared form patterns:** common label/help/error/hint conventions, server-validation error mapping, pending states, disabled states and unsaved-change warnings.
- **Shared data-view patterns:** one approach to filtering, sorting, pagination, row actions, loading/empty/error states, date filters and exports.
- **Domain-specific status components:** centralize status-to-label/color/icon mapping for order status, payment status, merchant verification, booking status and support status; do not mix state domains.
- **Mobile-first and progressive enhancement:** ensure actions fit narrow screens, dialogs become usable drawers where suitable, touch targets are large enough, tables have a small-screen plan, and essential work doesn't depend on hover.
- **Accessible by default:** semantic controls, keyboard navigation, visible focus, appropriate contrast, reduced-motion support, correct dialog focus trapping/return, accessible validation and screen-reader announcements.
- **No needless abstraction:** centralize repeated patterns that genuinely recur; do not turn simple pages into a generic framework that is harder to maintain.
- **No visual-only fake functionality:** all redesigned controls must call the existing correct workflow or be explicitly marked as not yet available.

## 10.3 Design system architecture proposal

Adapt this layout to the existing repository rather than creating duplicates if equivalent foundations already exist:

```text
src/
  app/
    globals.css                 # global reset + token entry point only
  components/
    ui/                         # accessible low-level primitives
    patterns/                   # DataTable, FilterBar, FormField, StatusBadge,
                                # EmptyState, ErrorState, ConfirmAction, PageHeader
    layout/                     # role-aware shells, navigation, page containers
  design-system/
    tokens.css                  # color/type/space/radius/shadow/motion tokens
    status.ts                   # typed state-to-variant maps
    typography.ts               # heading/body/label styles when needed
  features/
    ...                         # business components composed from shared patterns
```

The source has many route and feature-specific components and a large generated/theme stylesheet. Before moving files, inventory where existing styles originate (including Hexclave-generated CSS and Tailwind v4 configuration), identify conflicting variable names and duplicate primitives, and preserve generated assets/tooling. Do not delete or rewrite the generated Hexclave theme without proving how it is built and consumed.

### Token groups to define

- **Color:** page background, raised surface, muted surface, primary text, secondary text, border, subtle border, primary action, secondary action, success, warning, danger, info, and corresponding accessible foregrounds.
- **Typography:** font families, display/heading/body/label/caption scale, line heights, weights and letter spacing. Use a small scale rather than hand-tuning every page.
- **Spacing:** a consistent spacing scale for page gutters, section gaps, cards, forms, table density and dialog padding.
- **Shape:** control heights, border radii, border thickness, elevation/shadow levels and focus-ring widths.
- **Motion:** a short, consistent transition set with reduced-motion fallback; no animation that delays a critical operational action.
- **Layout:** shared maximum content widths, sidebar widths, sticky header offsets, mobile safe areas and responsive breakpoints.
- **Z-index/layers:** documented values for menus, popovers, dialogs, drawers, toast notifications and mobile navigation.

## 10.4 Page redesign requirements

Every redesigned page must define:

1. **Purpose and primary task:** one clear page title and the most important action placed consistently.
2. **Information hierarchy:** critical status and action first; supporting metrics second; low-frequency detail lower on the page.
3. **Real data semantics:** distinguish loading from zero, unavailable from empty, and error from success. Display update time where operational data may be stale.
4. **Filtering/search:** filters should be relevant, composable, removable and preserved when moving between list/detail where helpful. Avoid dumping every possible filter in the initial view.
5. **Destructive actions:** explicit confirmation with meaningful consequences; re-check authorization and current state on the server.
6. **Forms:** group fields into logical sections, provide units and examples, validate progressively, preserve entered values after recoverable errors and avoid clearing a form on failure.
7. **Feedback:** visible pending/success/error states; no double submission; retry actions for retryable errors and a clear recovery path for permanent errors.
8. **Responsive behavior:** review narrow mobile, common tablet and desktop widths; no clipped dialogs, off-screen primary buttons or inaccessible hover-only interactions.
9. **Accessibility:** keyboard-only testing, screen-reader labels, contrast checks, focus order, reduced motion and errors associated with the correct fields.
10. **Performance:** avoid fetching all catalogue records and filtering only in the browser at scale; use server-side pagination/search, sensible caching and image optimization where appropriate.

## 10.5 Visual direction

- Use a calm, warm neutral foundation with a restrained RUXs brand accent; reserve semantic colors for real status meaning.
- Favor strong typography, comfortable whitespace and clean alignment over excessive cards, gradients, borders, shadows or decorative icons.
- Make financial figures align and format consistently in INR, with clear units and accessible tabular numerals.
- Design status badges and action buttons so labels remain understandable without color alone.
- Use charts only when they answer a real decision question and include date range, units, legend and a useful empty state.
- Avoid emoji as a replacement for consistent iconography in core admin/merchant operations.
- Keep marketing pages conversion-oriented and storytelling-friendly, while admin/merchant pages prioritize scanability, speed and task completion.
- Maintain a clear separation between customer shopping UX and merchant operational UX; they share the visual system, not necessarily the same navigation or page structure.

---

# 11. Copy-paste implementation prompt: RUXs UI/UX centralization and redesign

Use the following prompt in your coding agent after the P0 authorization/security and payment-state fixes are underway. It is intentionally written to require repository inspection and staged execution rather than an unbounded rewrite.

```text
You are the senior product designer, design-systems architect, accessibility specialist, and staff frontend engineer for RUXs (https://ruxs.in; repository SH20RAJ/ruxs).

MISSION
Centralize and modernize RUXs UI/UX across the public marketing site, household marketplace, merchant panel, and admin panel. Build a coherent, premium, trustworthy, mobile-first design system while making each role's workflows faster and clearer. Preserve existing product behavior, business rules, routes, permissions, schemas, payment logic, and tenant boundaries unless an independently verified defect requires a separate fix.

START WITH REPOSITORY RECONNAISSANCE
1. Read README.md, AGENTS.md, DESIGN.md, PRODUCT.md, package.json, next.config.ts, src/app/globals.css, the Hexclave theme generation scripts, and existing feature/page components.
2. Map all user-facing route groups and their current layout shells. Inventory duplicated components, color values, typography, spacing, status mappings, form patterns, tables, dialogs, navigation, and responsive overrides.
3. Identify which styles are hand-authored, generated by Hexclave tooling, or supplied by Tailwind. Do not edit generated output as the source of truth; update the source/generator and verify the resulting output instead.
4. Run existing typecheck, lint, tests and build if the environment supports them. Record baseline failures separately from failures introduced by the redesign. Never use a production database for design work.
5. Inspect current live product behavior only when safe and possible; do not submit purchases, create real orders, contact merchants, or change production records.

NON-NEGOTIABLE SAFETY AND ENGINEERING RULES
- Do not expose or weaken authentication, authorization, merchant-tenant scoping, kids safety checks, payment verification, webhook handling, ledger immutability, audit trails or private customer link protections.
- Do not make a frontend-only hide/show change as a substitute for server-side access control.
- Do not fake metrics, payment states, merchant verification, stock, bookings, customer data or success messages.
- Do not change database schema, server actions, pricing rules, API contracts or payment state machines merely to fit a visual component. Raise those changes separately with tests and rationale.
- Never commit secrets, tokens, private customer data, documents or real payment details.
- Do not rewrite all pages in one pass, delete working behavior, replace the router, add large UI dependencies without justification, or create duplicate primitives when an existing component can be upgraded safely.
- Keep code idiomatic for the repository's Next.js App Router, React, TypeScript, Tailwind CSS v4, Drizzle and Cloudflare/OpenNext stack.
- Follow existing repository instructions. Reuse existing libraries and package manager versions from the lockfile where feasible.

DESIGN SYSTEM DELIVERABLES
1. Establish one documented token source for semantic colors, typography, spacing, radii, borders, shadows, focus rings, motion, layout widths, breakpoints and z-index layers.
2. Map tokens to the project's existing Tailwind/CSS approach. Remove repeated arbitrary values only when the token replacement preserves intent.
3. Establish accessible shared primitives: Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, FormField, Alert, Badge, Avatar, Tooltip, Dropdown, Dialog, Drawer, Tabs, Card, Table, Pagination, Breadcrumbs, Toast, Skeleton, EmptyState, ErrorState, ConfirmAction and PageHeader. Reuse existing primitives before creating new ones.
4. Establish shared patterns: FilterBar, searchable/paginated DataTable, responsive list/card view, form sections, status history/timeline, KPI strip, empty/error/loading state, confirmation flow and mobile page actions.
5. Create typed status presentation maps for order fulfillment, payment, booking, merchant verification, payout and ticket states. A state must have consistent text and an icon or label that makes sense without color.
6. Document component usage, variants, density, responsive rules, accessibility expectations and examples in a design-system README or existing design documentation.
7. Preserve role-specific shells. Public, household, merchant and admin areas should share tokens and primitives but retain navigation appropriate to the tasks.

UX GOALS BY AREA
PUBLIC / HOUSEHOLD
- Make location and actual service availability clear; don't claim coverage when no active merchant is available.
- Simplify discovery, service/store details, prices, delivery areas, schedule, policies, cart/checkout, booking, order history and account management.
- Keep checkout focused, show itemized totals and fees, explain online vs pay-on-delivery/monthly-bill options accurately, prevent duplicate submit, and clearly distinguish awaiting payment from paid.
- Display useful empty/loading/error states and preserve cart/form content after recoverable failure.

MERCHANT PANEL
- Treat Today as an action-first operations dashboard: orders/bookings due, cutoffs, delivery runs, pending collections, inventory/returnable exceptions and important alerts.
- Use responsive tables and fast filters for orders, customers, products, services, bookings, invoices, inventory and payouts.
- Make status, deadline, amount, customer and next action scannable; provide event history for high-impact state changes.
- Make complex tasks such as onboarding, product/service setup, availability, subscription changes and invoice reconciliation understandable with progressive disclosure and field-level help.
- Keep merchant-type-specific navigation relevant; don't show tools a vendor cannot use.

ADMIN PANEL
- Make Overview an exception/operations queue rather than a wall of decorative metrics.
- Make merchant onboarding and verification states explicit, reviewable and auditable.
- Make payments/refunds/payouts/invoices searchable with filters, amount reconciliation and audit history.
- Provide clear risk, verification, moderation, support and operational states. High-impact actions must have contextual confirmations and reasons.
- Avoid exposing full bank details, credentials, guardian/child sensitive information or private customer link tokens unnecessarily.

VISUAL QUALITY BAR
- Aim for a calm, modern, premium and approachable interface: restrained brand color, excellent typography, consistent alignment, breathable spacing and deliberate density.
- Use semantic colors only for meaningful status. Do not decorate every surface with a card, border, gradient or shadow.
- Use icons consistently and add accessible names to icon-only buttons. Never use color alone to convey state.
- Use clear, concise product language and consistent INR/date/time formatting.
- Avoid unnecessary animations; respect reduced-motion preferences.

RESPONSIVE AND ACCESSIBILITY REQUIREMENTS
- Validate representative narrow mobile, tablet and desktop widths.
- Ensure no horizontal page overflow; tables must have a deliberate mobile presentation, not accidental clipping.
- Primary actions must be reachable without hover. Touch targets, focus indicators, keyboard operation, modal focus trapping/return, labels and error associations must be correct.
- Test screen-reader announcements for asynchronous status and form errors; honor reduced motion and adequate contrast.
- Don't cache private merchant/customer/admin data in public or shared caches.

IMPLEMENTATION METHOD
Phase A — inventory and baseline: produce a concise route/component map, duplicated-pattern list, current behavior inventory, and baseline test results.
Phase B — foundations: add tokens and shared primitives/patterns, with documentation and component-level tests. Avoid redesigning every route yet.
Phase C — representative vertical slice: migrate Admin Overview, Merchant Today, and one high-traffic customer checkout/order flow. Verify desktop/mobile layouts, real data binding, loading/error states, permissions and test behavior.
Phase D — migrate by workflow: merchant orders/deliveries; bookings/calendar; products/services; customers/subscriptions; money/invoices/payouts; admin merchants/verification; support/settings; remaining customer and marketing routes.
Phase E — cleanup: remove only proven-dead duplicate styles/components, document migration decisions, and check generated styles, build output and route behavior.

For each phase, list files changed, why, user impact, risks, and validation results. Keep each implementation slice small enough to review and revert. Do not claim completion of a page or journey unless its actual states and responsive behavior were inspected.

TESTING AND ACCEPTANCE GATES
- Typecheck and lint pass; relevant existing unit tests pass.
- Add tests for shared primitive behavior, form validation mapping, status mappings, permission-sensitive states and data-table filtering/pagination as appropriate.
- Add/extend Playwright coverage for the migrated routes at mobile and desktop breakpoints.
- Smoke test loading, empty, populated, error, disabled, pending, success and destructive-confirmation states.
- Confirm exact routes, navigation, server actions, URL parameters, search/filter semantics and business calculations are unchanged unless an intentional separately tested fix is recorded.
- Verify keyboard-only navigation, focus handling, contrast, responsive overflow and reduced-motion behavior.
- Run production build and review console errors and hydration warnings.
- Compare screenshots at the same viewport before/after; explain intentional changes and fix layout regressions.
- Summarize residual issues honestly; don't hide failed tests or skip accessibility/performance checks silently.

FINAL OUTPUT
Produce: (1) an inventory and design-system plan, (2) a centralized token/component implementation, (3) migrated high-priority vertical slices, (4) test evidence and screenshots where available, (5) updated design documentation, and (6) a prioritized remaining-work list. Optimize for consistency, maintainability, accessibility and task completion—not superficial novelty.
```

---

# 12. Delivery plan and definition of done

Treat security/payment remediation and UI modernization as linked but separately reviewable streams. A polished interface must not conceal a broken business state machine.

### Workstream A — trust and transaction integrity

- [ ] Fix RUX-01 through RUX-09 with focused pull requests and regression tests.
- [ ] Rotate the ImgBB key and confirm no active secret remains in source/history that is still usable.
- [ ] Confirm kids approval, consent, booking, enrollment and pass redemption server-side requirements.
- [ ] Add reconciliation for payment captured late, duplicate captures, refund pending, failed refunds and overpayments.
- [ ] Confirm authorization across all Server Actions, including exports and uploads.

### Workstream B — admin/merchant operations

- [ ] Define state machines, roles and action ownership for merchant onboarding, verification, payment/refund, payout, support and booking/order lifecycle.
- [ ] Implement exception queue and merchant verification workbench.
- [ ] Implement merchant Today dashboard and coherent order/booking timeline.
- [ ] Add audit history to privileged operations and high-impact transaction mutations.
- [ ] Add real data definitions for KPI cards and reports.

### Workstream C — design-system centralization

- [ ] Inventory route shells, existing primitives, CSS tokens, generated styles and duplicate UI patterns.
- [ ] Establish semantic tokens and document the intended source of truth.
- [ ] Standardize FormField, Button, StatusBadge, DataTable, PageHeader, EmptyState, ErrorState, Skeleton, Toast and ConfirmAction.
- [ ] Migrate the representative routes first; preserve business logic and URLs.
- [ ] Run visual, keyboard, responsive, accessibility and regression checks before broad migration.

### Workstream D — quality gates

- [ ] CI runs lint, typecheck, pure tests, integration tests against an isolated database, and a meaningful E2E suite.
- [ ] Critical happy-path and failure-path tests cover payment, booking, merchant verification, order cutoff, invoice generation and refunds.
- [ ] Preview/staging smoke tests verify Cloudflare bindings, cron, webhook configuration and private route caching.
- [ ] Release checklist has a named owner for each unresolved P0/P1 issue.

**Definition of done:** no P0 finding remains open; all P1 findings affecting enabled production flows are fixed or the affected feature is explicitly disabled; integration/E2E checks pass; admin and merchant users can complete their primary workflows on mobile and desktop; accessible error/empty/loading states exist; and the team can audit who changed merchant, money, verification and support records.

---

# 13. Final recommendation

RUXs has enough product and engineering structure to improve incrementally. Avoid a blanket redesign or feature explosion. First close the server-action, credential, child-safety and money-state gaps; next build the exception-driven admin console and action-first merchant Today experience; then centralize the component system and migrate routes in tested slices. Add new operational features only when they improve trust, reduce manual work, clarify the next action, or help reconcile money and fulfillment. Every new interface should reflect one authoritative server-side state and be covered by regression tests.
