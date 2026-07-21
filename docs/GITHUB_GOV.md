# HVDQ Commercial — GitHub GOV

## 1. Purpose

This document is the operating law for HVDQ Commercial. It governs how work is scoped, implemented, verified, reviewed, merged, deployed, published and rolled back across Shopify, GitHub and Netlify.

Its purpose is practical: protect production, reduce errors, support launch and revenue, and avoid unnecessary builds, deploys, documentation and maintenance work.

## 2. Commercial priorities

1. Premium men's accessories.
2. Bespoke products and services.
3. Enamel watches as brand-positioning products.

Vietnam is the first market. Europe and the United States are secondary. China, marketplaces, AppSheet PIM, full ERP and AI product generation are outside the current scope unless the Founder reopens them because they directly block revenue.

## 3. Governance authority and source of truth

`tmh2388/hvdq-commerce-theme` is the governance authority for the whole Commercial system.

Repository ownership:

- `tmh2388/hvdq-commerce-theme`: Shopify storefront and system-wide GOV.
- `tmh2388/hvdq-partner-portal`: portal runtime, Netlify configuration, local tests and deployment evidence.

Authority order:

1. Platform safety and current project instructions.
2. Latest Founder decision.
3. Repository, branch, commit, Pull Request and CI evidence.
4. Shopify Admin and Theme Library evidence.
5. Netlify site and deployment evidence.
6. Chat history only as supporting context.

Unknown state must be written as `NOT VERIFIED` or `BLOCKED — ACCESS REQUIRED`.

Shopify is authoritative for products, variants, inventory, collections, customers, orders, payments and fulfillment. An intake sheet or portal may temporarily prepare data but must not replace Shopify operational state.

## 4. System boundary

Target flow:

`Authenticated intake → validation → approval → idempotent Shopify Draft Product → Shopify ID reconciliation → Founder/Admin review → publication → collection → storefront → cart → checkout → order → notification → fulfillment/cancellation/refund`

Production boundaries:

- Live Shopify theme.
- Shopify production product and order data.
- Netlify production portal and Functions.
- Production secrets and integration credentials.

A Git branch is not proof of a live Shopify theme. A green Netlify build is not valid evidence unless repository, branch, commit, site, base directory, publish directory and environment context match the candidate.

## 5. Mandatory working modes

Every new task or material scope change begins with one mode declaration:

- `MODE: CHAT` — analysis, design, planning, audit or content.
- `MODE: WORK` — multi-file or multi-system execution through available connectors.
- `MODE: CODEX` — code implementation, testing or commit workflow when Codex is actually active.
- `MODE: CHAT → WORK` or `MODE: CHAT → CODEX` — scope is locked before execution.

A mode must never be claimed unless that execution capability is actually active.

## 6. Standard delivery flow

Runtime work follows:

`scope → accountable repository → branch → implementation → local/static verification → targeted test → Draft PR → CI → valid Shopify preview or Netlify Deploy Preview → technical QA → Founder UAT → UAT PASS → merge → controlled deploy/publish → production smoke test → deployment evidence → rollback evidence`

Rules:

- Merge does not equal deploy or Shopify publish.
- Production is never a test environment.
- Every runtime change belongs to one clear scope and one accountable repository.
- Cross-repository changes use one shared scope and linked PRs, not duplicated state documents.
- Founder UAT PASS is required before customer-facing production release.

## 7. Production locks

The following may not be violated without an explicit Founder decision:

1. Do not edit the live Shopify theme directly.
2. Do not use Netlify production to test UI or integration behavior.
3. Do not deploy or publish without a rollback target.
4. Do not expose Shopify Admin tokens or private secrets in browser code or Git.
5. New integration-created products default to Draft.
6. Staff or partners may not activate or bulk-publish products outside the approved workflow.
7. Preview environments must not write Shopify production by default.
8. Every production write requires authentication, authorization, least privilege and audit evidence.
9. Retry must be idempotent; a timeout does not prove the write failed.
10. No app, payment, checkout, shipping, domain or production environment change occurs without explicit scoped approval.

## 8. Testing and verification

Use the smallest test scope that can reliably prove the change:

`static inspection → targeted test → integration test when dependencies are affected → full regression only for high-risk Gate or release`

Do not:

- run the full suite for unrelated small changes;
- rerun a passing test when code, dependency and environment are unchanged;
- read the entire codebase when the affected dependency boundary is known;
- repeat repair-test loops indefinitely;
- claim PASS without command, candidate SHA and result.

Valid states include:

- `IMPLEMENTED_NOT_VERIFIED`
- `STATIC_CHECK_PASS`
- `TARGETED_TEST_PASS`
- `INTEGRATION_TEST_PASS`
- `FULL_REGRESSION_PASS`
- `PREVIEW_VALID`
- `READY_FOR_FOUNDER_UAT`
- `FOUNDER_UAT_PASS`
- `READY_TO_MERGE`
- `MERGED_NOT_DEPLOYED`
- `DEPLOYED_NOT_VERIFIED`
- `PRODUCTION_VERIFIED`
- `NOT_VERIFIED`
- `BLOCKED`

## 9. Pull Request evidence

Every runtime PR should state, where applicable:

- business objective;
- repository and scope;
- base branch and head branch;
- head commit SHA;
- files changed and files outside scope;
- risk and blast radius;
- dependency impact;
- test commands and results;
- preview URL and preview commit;
- Founder UAT status;
- merge and deploy/publish status;
- production status;
- rollback target;
- remaining risks and Founder action.

Documentation-only changes do not require runtime UAT, but still require a clear diff and confirmation that runtime files were untouched.

## 10. Shopify controls

Theme work:

- use a development or unpublished theme;
- bind preview evidence to branch and commit;
- verify desktop and mobile;
- back up the live theme before publish;
- identify the rollback theme before publish;
- avoid broad changes to `settings_data.json`, template JSON, global JavaScript, header, footer, product and cart sections without blast-radius review;
- never let an agent publish the live theme without Founder approval.

Product work:

- default status is Draft;
- validate title, vendor, type, media, alt text, description, price, variants, SKU, inventory, weight, shipping, tax, SEO, handle, collections, tags, metafields, product status and channel publication;
- test bulk work on a small sample;
- retain source file, mapping and import log;
- detect duplicate products and provide correction or rollback procedure.

Checkout/payment work:

- use test mode when available;
- verify order creation, confirmation, notification, failure handling, cancellation, refund and reconciliation;
- do not use a real transaction unless technically necessary and explicitly approved.

## 11. Portal and integration controls

The portal must remain the smallest useful system for authenticated product intake and approval.

Mandatory controls:

- identity and roles are enforced server-side;
- Shopify Admin token never reaches the browser;
- validation exists at the trusted server boundary;
- Shopify writes create Draft products only until approved;
- preview environments use isolated credentials and data;
- write operations are idempotent;
- timeout handling reconciles Shopify state before retry;
- duplicate prevention and partial-write recovery are defined;
- API version and required scopes are explicit;
- each production write has an audit record.

Google Sheets or Apps Script may be retained only as a temporary intake/review layer. They are not the authority for Shopify product, inventory or order state.

The current portal PR must be narrowed before merge because Amazon output, unnecessary AI generation and Google Sheets authority exceed the current Shopify-native MVP.

## 12. Netlify and resource optimization

Use Deploy Preview instead of production for review. A separate long-lived staging site is unnecessary unless preview isolation cannot satisfy the requirement.

Rules:

- static and targeted checks run before creating a preview;
- assemble a stable candidate before push;
- collect review feedback before the next build;
- one scope has one primary Founder UAT candidate at a time;
- do not retry before reading the failure log;
- retry unchanged source only when a transient platform failure is evidenced;
- do not rebuild for comments, formatting, metadata or governance-only files when safe ignore/path rules can prevent it;
- do not create multiple sites for the same application without a clear architecture reason;
- pin dependencies and use deterministic installs;
- do not deploy again merely to obtain a new URL when the artifact is unchanged.

A new build is justified only when runtime code, dependency, environment or an evidenced defect changes.

If capacity remains insufficient after workflow optimization, report `CAPACITY_DECISION_REQUIRED`; governance does not authorize a subscription upgrade.

## 13. Release and rollback

Before production release:

- candidate and commit are identified;
- CI and required verification pass;
- Founder UAT passes;
- production branch/theme/site is verified;
- environment variables are verified;
- rollback target is recorded;
- smoke-test checklist is ready.

After release:

- execute production smoke test once;
- record deployed commit/theme/deploy ID;
- record result and residual risk;
- stop further deploys until the current release is verified.

Rollback evidence must identify the previous known-good theme, deploy or commit and the result of restoration.

## 14. Current state and maintenance

- `docs/governance/CURRENT_STATE.md` records only verified current state.
- `project-state.yaml` stores a minimal machine-readable summary.
- This document records durable operating law.
- Current state, plans and implementation details must not be duplicated inside this law.

Update this law only for a material operating-rule change. Do not create additional GOV documents, Gates or PRs merely for documentation structure.
