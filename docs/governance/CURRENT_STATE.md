# HVDQ Commercial — Current State

Last verified: 2026-07-20

This document records only verified technical and platform state. Durable operating rules are defined in `docs/GITHUB_GOV.md`.

## GitHub

### Storefront

- Repository: `tmh2388/hvdq-commerce-theme`.
- Visibility: public.
- Default branch: `main`.
- `main` was verified as containing only the initial README before this governance branch.
- Merged PR #1: `Fix storefront chrome and HVDQ defaults`.
- PR #1 base: `claude/hvdq-commerce-plan-r92qj7`.
- PR #1 head: `agent/shopify-delivery`.
- PR #1 head SHA: `4eef269e59f7dfa5ecc3245592d8b5d8bb15f1f6`.
- PR #1 merge commit: `7e6797f8b0b33dafaaa840e3d42eb2e30ae5f9c0`.
- Storefront CI enforcement: `NOT VERIFIED`.
- Branch protection and rulesets: `NOT VERIFIED`.

### Partner portal

- Repository: `tmh2388/hvdq-partner-portal`.
- Visibility: private.
- Default branch: `main`.
- Open Draft PR #1: `Gate 1–3: Portal foundation, Apps Script intake workflow and responsive operations UI`.
- Base: `main`.
- Head: `codex/gate-1-foundation`.
- Head SHA: `287afa8ae4fe0009bd1ced473980b2b80ce08742`.
- Latest verified GitHub Actions CI for that SHA: success.
- Verified Netlify Deploy Preview status: success.
- Portal PR remains unmerged.
- Shopify mutation is described as disabled and is not verified as active.

## Shopify

- Shopify is the designated authority for products, variants, inventory, collections, customers, orders, payment and fulfillment.
- Store, live theme, theme ID, Shopify-connected branch, Theme Library, publish history and production storefront commit: `BLOCKED — ACCESS REQUIRED`.
- Development or unpublished theme: `BLOCKED — ACCESS REQUIRED`.
- Checkout, payment, shipping and app state: `BLOCKED — ACCESS REQUIRED`.

## Netlify

Verified from repository and commit status:

- Deploy Preview site label: `hvdq-partner-portal-staging`.
- Preview candidate: portal PR #1 head SHA `287afa8ae4fe0009bd1ced473980b2b80ce08742`.
- Build command: `npm run build`.
- Publish directory: `dist`.
- Functions directory: `netlify/functions`.

Not verified:

- Site ID.
- Production branch.
- Production domain and current production deploy.
- UI overrides for base directory, build command or publish directory.
- Environment values and context isolation.
- Build/retry history and duplicate sites.
- Branch deploy policy, ignored builds, production lock and restore target.

## Known architecture conflict

Portal PR #1 describes Google Sheets as the operational source of truth and includes Amazon-oriented AI content generation. The latest Founder direction is Shopify-native and Vietnam-first; AppSheet PIM, Amazon and unnecessary AI generation are outside the current scope. The portal PR must be narrowed before merge.

## Overall status

- GitHub GOV: implemented on `agent/commercial-gov-foundation`, pending review and merge through PR #2.
- Runtime implementation: unchanged.
- Shopify production: protected and not modified.
- Netlify production: protected and not modified.
