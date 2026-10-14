# Route & Deployment Audit — 2026-10-14

## Summary

The repository and public deployment were out of sync during this check. The live public homepage and its category/city pages still served the earlier merchant-first copy, even though GitHub `main` contained the customer-first page revisions.

This is a deployment verification issue, not proof that the new source code is deployed. The repository has one active GitHub Actions workflow (`.github/workflows/ci.yml`) that runs validation only; there is no checked-in Cloudflare production deployment workflow. A GitHub push alone therefore cannot be treated as a completed deployment.

## Live HTTP smoke test

Checked on 2026-10-14 using a public web crawl. These are anonymous HTTP checks only; they do not validate authenticated merchant pages, database actions, order creation, or payment flows.

| URL | HTTP result | Finding |
| --- | ---: | --- |
| `/` | 200 | Served the older merchant-first homepage copy. |
| `/about` | 200 | Served the earlier About page. |
| `/in/bengaluru` | 200 | Served the earlier merchant-oriented city landing page. |
| `/for/tiffin-services` | 200 | Served the earlier tiffin software page. |
| `/for/water-suppliers` | 200 | Served the earlier water supplier software page. |
| `/privacy` | 200 | Reachable. |
| `/terms` | 200 | Reachable. |
| `/pricing` | 404 | Route was missing while robots allowed it and earlier docs listed it as a public SEO page. A pricing explainer is now implemented in source. |
| `/app` | Redirected to sign-in | Expected for an anonymous visitor; authenticated workspace workflows were not tested. |
| `/sign-in` | 200 | Reachable; explicit route link to sign-up was added outside the auth widget. |
| `/sign-up` | 200 | Reachable; explicit route link to sign-in was added outside the auth widget. |
| `/sitemap.xml` | 200 | The previous sitemap did not include `/pricing`; source is updated. |

## Source fixes in this change

1. Added `/pricing` as an explanatory page: RUXS does not impose universal prices; merchants set their own meal, water-can, deposit and subscription terms. It explicitly avoids claiming a full searchable live catalogue or checkout is already available.
2. Added the pricing page to `sitemap.ts` and kept it crawlable via `robots.ts`. Tightened exclusions to cover both `/app` and `/admin` roots, not only their slash-prefixed descendants.
3. Corrected title generation: the old SEO helper appended a "One-Link Daily Operating System" suffix and a brand suffix, while the root layout also appended RUXS. The metadata now uses one title template and customer-first wording.
4. Added explicit navigation between the dedicated `/sign-in` and `/sign-up` routes.
5. Changed global, merchant and customer error boundaries not to render raw internal exception messages to end users. They log the exception for debugging, expose the framework digest when present, and provide retry/recovery actions.
6. Added `workflow_dispatch` to the validation workflow so typecheck/lint/core-tests/build can be run manually when push events from an integration do not start a new workflow run.
7. Replaced a non-functional "Explore near me" form that sent a query to a static page which ignored it with working tiffin and water category links.
8. Updated product documentation so it separates the current customer-first public presentation from the unfinished full marketplace implementation.

## CI and deployment status

- The active GitHub Actions workflow validates code (typecheck, lint, core tests and Next.js build); it has no Cloudflare deploy step.
- No GitHub Actions runs were found for `main` since 2026-09-24 during the audit.
- A manual CI dispatch after adding `workflow_dispatch` returned HTTP 422: GitHub Actions is disabled for the connected user. Therefore, typecheck/lint/tests/build could not be run in GitHub Actions.
- The Cloudflare integration check failed before returning account/deployment information because the connected credential was rejected as an invalid `X-Auth-Key` header. Deployment state could not be inspected through that connection.
- Production is still a deployment blocker: current source needs a working Cloudflare deployment path and a public route smoke test after deployment. This audit does not claim the new source has been redeployed.

## Remaining verification

- Re-enable GitHub Actions or run `bun run typecheck`, `bun run lint`, `bun test src/core`, and `bun run build` in a configured development environment.
- Confirm Cloudflare credentials and deploy the built Worker.
- Re-run all public route checks against production after deployment.
- Test a valid customer token, an expired token, sign-in/sign-up, merchant onboarding, product creation, subscription setup, skip/extra/pause actions, billing and UPI handoff against a development database.
- The public marketplace still needs implementation and end-to-end verification for live merchant listing/search, service-area filtering, checkout/order enrollment and customer order status.
