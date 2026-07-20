# HVDQ Commercial — Decision Register

| ID | Date | Decision | Status | Authority | Consequence |
|---|---|---|---|---|---|
| COM-001 | 2026-07-15 | Commercial priority order is premium men's accessories, bespoke, then enamel watches. | Active | Founder | Product and storefront work follows this order. |
| COM-002 | 2026-07-15 | Vietnam is the first market; Europe/US are secondary. China and marketplaces are not in the current Gate. | Active | Founder | No China-channel or marketplace implementation without a new decision. |
| COM-003 | 2026-07-15 | Shopify is the authoritative operating system for products, variants, inventory, collections, customers, orders, payments and fulfillment. | Active | Founder | External workspaces may support intake but must not override Shopify operational state. |
| COM-004 | 2026-07-15 | Stop AppSheet PIM for the current Commercial delivery. | Active; supersedes earlier AppSheet workflow | Founder | Do not reopen AppSheet implementation unless it becomes a direct revenue blocker and Founder approves. |
| COM-005 | 2026-07-20 | Production storefront, live Shopify theme and Netlify production are not test environments. Founder UAT is required before customer-facing production release. | Active | Founder | Preview/development environments and rollback evidence are mandatory for runtime changes. |
| COM-006 | 2026-07-20 | Use layered, lean Github GOV for Commercial rather than copying ConsultApp governance. | Active | Founder | Commercial governance remains commerce-specific and avoids clinical controls. |
| COM-007 | 2026-07-20 | `tmh2388/hvdq-commerce-theme` is the Commercial governance authority; each runtime repository keeps local runbooks and CI evidence. | Active | Founder | Cross-system Current State and decisions are not duplicated in the portal repository. |
| COM-008 | 2026-07-20 | Portal PR #1 must not be merged unchanged because Google Sheets authority, Amazon content and AI generation exceed or conflict with the current Shopify-native scope. | Active | Founder-approved operating recommendation | Portal scope must be narrowed in a later Gate before merge. |
| COM-009 | 2026-07-20 | Netlify resource usage must be optimized before any capacity upgrade decision. | Active | Founder | Diagnose failures, reduce duplicate builds and use one UAT candidate; report `CAPACITY_DECISION_REQUIRED` only after optimization. |

## Supersession rule

A decision is never silently removed. A later decision records the superseded ID, effective date and reason. Chat summaries do not supersede this register.
