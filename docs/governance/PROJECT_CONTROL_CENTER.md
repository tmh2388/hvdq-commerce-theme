# HVDQ Commercial — Project Control Center

## Purpose

This repository is the governance authority for HVDQ Commercial. It governs the Shopify storefront, the partner/data-entry portal, and their production interfaces. It does not replace repository code, Pull Requests, CI, Shopify Admin, Netlify deployment records, Founder UAT, or rollback evidence.

## Current commercial objective

Launch and operate the Vietnam-first sales system with the smallest reliable architecture that protects production and supports revenue. Priority order:

1. Premium men's accessories.
2. Bespoke products and services.
3. Enamel watches as brand-positioning products.

Europe and the United States are secondary markets. China and marketplaces are outside the current scope.

## System boundary

In scope:

- Shopify storefront and theme.
- Product, variant, inventory, collection, cart, checkout, order and fulfillment workflows.
- Partner/data-entry portal when directly required for product intake and approval.
- Netlify frontend and Functions used by the portal.
- Shopify Admin API integration.
- Production protection, evidence, release and rollback.

Out of scope unless a later Founder decision reopens them:

- AppSheet PIM.
- Amazon, Etsy and other marketplaces.
- China-market channels.
- Full ERP.
- AI product generation not required for the current sales flow.

## Repository map

| Repository | Authority |
|---|---|
| `tmh2388/hvdq-commerce-theme` | Commercial governance authority and Shopify storefront implementation |
| `tmh2388/hvdq-partner-portal` | Portal runtime, Netlify configuration, local delivery runbooks and evidence |

## Sources of truth

1. Platform safety and project instructions.
2. Latest Founder decision.
3. Repository, branch, commit, Pull Request and CI evidence.
4. Shopify Admin and Theme Library evidence.
5. Netlify site and deployment evidence.
6. Chat history only as supporting context.

Shopify is the authoritative system for sellable products, variants, inventory, collections, customers, orders, payments and fulfillment. Any external intake workspace is temporary and must not overwrite Shopify operational state.

## Decision rights

- Founder: final commercial priorities, production publication, high-risk changes, cost decisions and UAT approval.
- Technical delivery owner: repository implementation, verification, evidence and rollback preparation within an approved Gate.
- Staff/partners: product intake only within least-privilege access; no uncontrolled activation or production publication.

## Delivery model

All runtime work follows:

`scope → Active Gate → branch → implementation → local verification → Draft PR → CI → valid preview → technical QA → Founder UAT → merge → controlled deploy/publish → production smoke test → deployment and rollback evidence`

Merge does not automatically mean production deployment or Shopify publication.
