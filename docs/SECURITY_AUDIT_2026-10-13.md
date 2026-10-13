# RUXS Source-Level Audit

**Target:** `SH20RAJ/ruxs`, default branch `main`  
**Reviewed:** 2026-10-13  
**Method:** Static source inspection through the connected GitHub repository API. No local clone, code execution, database access, deployment inspection, or dynamic penetration testing was available in this pass.

## Executive summary

The project has a sensible feature-oriented structure, server-side access guards, Zod validation, integer-paise accounting, unique constraints for core idempotency paths, private customer-link token hashing, and focused pure-rule tests. However, several server-side authorization and transactional integrity concerns are visible in the source and should be addressed before production use with real customer and billing data.

This is a source review, not a certification. Items marked **High** should be triaged first. Reproduce them in a disposable database and add regression tests before fixing.

## Findings

### 1. High — Ledger adjustment action trusts a client-supplied customer ID

**Location:** `src/features/ledger/actions.ts`, `addAdjustment()`

The action authorizes the caller as an owner/staff member of the selected vendor, then inserts a ledger entry using the submitted `customerId`. Unlike other feature actions, it does not first query that the customer belongs to `access.vendorId`.

**Impact:** A malicious or malformed request may attempt to create an entry referencing a customer from another vendor. Whether the insert succeeds depends on schema constraints and database triggers, but the action does not enforce the intended tenant boundary itself.

**Recommendation:** Before inserting, require a matching customer row for both `customerId` and `access.vendorId`. Add an integration test where a staff member from vendor A submits vendor B's customer ID and assert no record is written.

### 2. High — Customer details query fetches related records by customer ID alone

**Location:** `src/features/customers/queries.ts`, `getCustomerDetails()`

The parent customer row is checked against the authorized vendor after retrieval. Subsequent subscriptions, ledger entries, and asset movements are queried using only `customerId`, rather than including `vendorId` in the query predicates.

**Impact:** If the schema or data ever contains inconsistent cross-tenant references, related records can be returned without a tenant predicate. This is a defense-in-depth gap and makes the query harder to audit.

**Recommendation:** Scope every related query with `access.vendorId` and `customer.id`. Where practical, use composite foreign keys or database constraints to prevent cross-tenant references at the data layer. Add cross-tenant tests for both read and write paths.

### 3. High — Marking a delivery can create duplicate asset movements on repeated submission

**Location:** `src/features/orders/actions.ts`, `markDelivered()`

The action uses an idempotency key for the delivery ledger entry and deposit entry, but it inserts a new `assetMovements` record each time the action is called. The order update itself does not condition on an expected prior status.

**Impact:** Retrying a request or double-tapping delivery can duplicate can/dabba movement rows and distort a customer's asset balance, even if the money entry is deduplicated.

**Recommendation:** Make the entire delivery transition idempotent in a single transaction. Update only an order in an eligible prior state and verify the update succeeded before recording side effects. Add a stable unique/idempotency key for the asset movement associated with the order (and movement type), or guard the write based on the prior transition. Test repeated and concurrent calls.

### 4. High — Payment/adjustment invariants need stronger enforcement

**Location:** `src/features/ledger/actions.ts`, `markPaid()` and `addAdjustment()`

The payment action records any positive payment amount, subtracts it from invoice closing balance, and treats a non-positive closing balance as paid. The visible code does not reject payments greater than the outstanding balance. The adjustment action also does not validate that the target customer belongs to the current vendor.

**Impact:** An accidental overpayment can leave a negative invoice balance and mark it paid; repeated manual submissions each create a new payment entry because the idempotency key is random per invocation. Some businesses may permit credits/overpayments, but that policy should be explicit and displayed consistently.

**Recommendation:** Define whether overpayments are allowed. If not, validate against the current outstanding balance inside a transaction and use a concurrency-safe conditional update/lock. If yes, model and display credit carry-forward explicitly. Consider a client-generated operation ID or other stable idempotency mechanism for retry-safe payment writes. Add tests for overpayment, rapid duplicate submissions, and concurrent payment attempts.

### 5. High — Multi-step day-change writes can leave partial state

**Location:** `src/features/day-changes/actions.ts`, `setDayChange()`

A late skip can upsert the day change, update an order to `late_skip`, and insert a late-fee ledger entry as separate database operations without one encompassing transaction. The vendor path follows the same general pattern.

**Impact:** If a later step fails after the earlier write commits, the day-change/order/ledger state may disagree until manually repaired or retried.

**Recommendation:** Put the state transition and its ledger side effect in one transaction, retain the unique idempotency key, and make retry semantics explicit. Add fault-path tests where a later write fails.

### 6. Medium — Bill generation reports a bill created even when conflict handling skips the insert

**Location:** `src/features/billing/actions.ts`, `generateBillsForVendor()`

The invoice insertion uses `onConflictDoNothing()`, then increments `createdCount` unconditionally. If another invocation wins the unique constraint concurrently, the function can report a created invoice even though its insert did nothing.

**Impact:** Cron metrics and action feedback can overstate the number of invoices created.

**Recommendation:** Use `returning()` (or an equivalent result check) and increment `createdCount` only when an invoice row was inserted. Test concurrent invocation.

### 7. Medium — Invoice numbering and sequence allocation are concurrency-sensitive

**Location:** `src/features/billing/actions.ts`, `generateBillsForVendor()`

The sequence starts from the count of existing invoices and is incremented during a per-customer loop. Two concurrent calls may calculate the same sequence before either inserts. The unique constraint protects vendor/customer/period, not invoice number uniqueness.

**Impact:** Different invoices can receive the same human-readable invoice number during concurrent generation.

**Recommendation:** Add a database uniqueness constraint on the intended invoice-number scope and allocate sequence numbers with a database-backed sequence or locked counter row. Keep uniqueness and allocation consistent with the product's invoice numbering policy.

### 8. Medium — Vendor creation is not atomic

**Location:** `src/features/vendors/actions.ts`, `createVendor()`

The action inserts the vendor and then inserts the creating user into `vendor_members` in separate operations. If membership insertion fails, the vendor can remain without its owner membership. The preflight slug check also cannot prevent a race; the database unique constraint must remain the final guard.

**Impact:** Partial onboarding records and confusing retries are possible.

**Recommendation:** Use one database transaction for vendor creation and owner-membership insertion; handle the unique violation from the database as the source of truth.

### 9. Medium — Cron reports attempted cutoff locks, not newly locked products

**Location:** `src/app/api/cron/tick/route.ts`

The endpoint increments `lockedProductsCount` after calling `lockCutoffForProduct()` for every product whose cutoff time has passed. The cutoff SQL is designed to use conflict handling, so repeated per-minute runs may count an already processed product again. The current count is an attempt count rather than a true number of newly created orders.

**Impact:** Monitoring data can be misleading. The cron's once-per-minute behavior makes accurate metrics important for debugging missed or repeated work.

**Recommendation:** Return affected-row counts from the SQL and report attempted versus newly processed products separately. Consider querying only products not yet processed for the current service date.

### 10. Medium — Customer import is delimiter-split, not a full CSV parser

**Location:** `src/features/customers/actions.ts`, `importCustomers()`

Rows are split on every comma or tab. Quoted values containing commas, tabs, or escaped quotes are not handled as standard CSV fields.

**Impact:** Valid CSV data can be imported into the wrong columns or rejected. Raw database error messages are also included in failed-row results.

**Recommendation:** Use a well-tested CSV parser or clearly label the format as simple comma/tab-delimited text. Validate maximum import size and row count; return safe row-level errors while logging no personal data.

### 11. Medium — Database/runtime verification remains outstanding

**Location:** CI workflow and database-backed integration tests

CI config runs typecheck, lint, core tests, and production build. The integration suite checks database reachability and skips DB cases if the configured instance cannot be reached. No CI run or local test execution was available during this source inspection.

**Impact:** Green CI would not, by itself, prove cross-tenant protections, transaction correctness, or live database behavior unless DB-backed tests actually ran.

**Recommendation:** Add a disposable Neon/PostgreSQL CI branch or service for integration tests and fail clearly when a job intended to test database guarantees is skipped. Keep any production database isolated from tests.

## Positive controls observed

- `requireVendorAccess()` derives the vendor from authenticated membership and rejects suspended vendors.
- `requireAdmin()` uses a server-side allowlist.
- Customer private-link tokens are generated from cryptographically random bytes, stored as SHA-256 hashes, and looked up by hash.
- Money amounts and ledger records use integer paise.
- Unique keys exist for customer link tokens, vendor-scoped phone numbers, per-subscription per-day changes, orders by subscription/date/shift, invoice per vendor/customer/period, and ledger idempotency keys.
- The cron endpoint checks a bearer secret using `timingSafeEqual` after validating token length.
- Security-related headers and private/no-index headers for customer-link pages are configured in `next.config.ts`.
- Core rules have colocated tests, and CI is configured for type checking, linting, core tests, and a production build.

## Suggested remediation order

1. Enforce tenant ownership on customer IDs in all writes and related reads.
2. Make delivery, day-change, payment, and vendor-creation workflows atomic and retry-safe.
3. Fix invoice insertion counts and sequence allocation under concurrency.
4. Improve import size/format handling and safe error reporting.
5. Run typecheck, lint, core tests, database integration tests, and production build in a controlled environment.
6. Re-audit the resulting commit and test cross-tenant scenarios explicitly.

## Scope limitations

This audit did not inspect deployed runtime configuration, access logs, live database constraints/data, dependency advisories, complete repository history, secret exposure across all branches, or browser/UI behavior. No exploitable issue was confirmed through dynamic testing. Treat findings as source-supported risks to reproduce and resolve, not a substitute for a security test or penetration test.
