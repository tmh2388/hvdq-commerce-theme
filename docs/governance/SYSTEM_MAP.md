# HVDQ Commercial — System Map

## Authoritative ownership

| Component | Repository/service | Responsibility | Authoritative state | Production boundary |
|---|---|---|---|---|
| Shopify storefront | `tmh2388/hvdq-commerce-theme` + Shopify | Customer-facing theme, navigation, product presentation, search and cart entry | Git evidence for source; Shopify Theme Library for deployed state | Live Shopify theme |
| Product authority | Shopify Admin | Products, variants, inventory, collections, publication and sales channels | Shopify | Shopify production store |
| Cart, checkout and order | Shopify | Transaction and order lifecycle | Shopify | Shopify production store |
| Product intake portal | `tmh2388/hvdq-partner-portal` | Authenticated product intake, validation, review and approved Draft preparation | Portal repository plus runtime evidence | Netlify production portal |
| Portal edge/API layer | Netlify Functions | Server-side authentication boundary and secret-protected integration | Portal code plus Netlify environment evidence | Netlify Functions |
| Temporary intake workspace | Google Sheets/Apps Script, only if retained | Pre-Shopify intake and review buffer | Not authoritative for products, inventory or orders | Must be isolated from production writes |
| Commercial governance | `tmh2388/hvdq-commerce-theme` | Cross-system decisions, locks, current state and Active Gate | `docs/governance/` and `project-state.yaml` | Non-runtime control plane |

## Target product flow

`Authenticated portal intake → server validation → approval → idempotent Shopify Draft Product write → Shopify ID reconciliation → Founder/Admin review → Active status and channel publication → collection → storefront → cart → checkout → order → notification → fulfillment/cancellation/refund`

## Current verified flow

`Portal branch → Netlify Deploy Preview → Netlify Function → Apps Script → Google Sheets review workflow`

Shopify Draft synchronization is not verified as active. The live Shopify theme, Shopify-connected branch, Netlify production branch, environment contexts and production portal are not yet verified.

## Integration boundaries

- Browser code must never receive a Shopify Admin API token or private backend credential.
- Preview environments must not write Shopify production or use production intake data unless explicitly approved and isolated.
- Shopify writes must default to Draft and be idempotent.
- Timeout or retry must reconcile Shopify state before creating another product.
- A Git branch is not proof of the live Shopify theme.
- A green Netlify build is not valid evidence unless repository, branch, commit, site, base directory, publish directory and environment context match the candidate.

## Cross-repository change rule

A change affecting both repositories requires one Active Gate and linked Pull Requests. Each repository remains responsible for its own code, tests and deployment evidence. Current State is recorded only at Commercial governance level and must not be duplicated in the portal repository.
