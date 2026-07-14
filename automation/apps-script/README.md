# HVDQ Product Operations — Apps Script automation

This module moves approved PIM data into Shopify as **Draft products only**.

## Safety invariants

- `APP_CONFIG[AUTO_PUBLISH]` must remain `FALSE`.
- `APP_CONFIG[SHOPIFY_CREATE_STATUS]` must remain `DRAFT`.
- Script Property `LIVE_SYNC_ENABLED` defaults to false/missing.
- A product must pass content validation, Founder approval, and Vietnam price approval.
- Inventory is never mutated by this module.
- Shopify credentials are stored only in Apps Script Properties.

## Required Script Properties

| Property | Example | Notes |
| --- | --- | --- |
| `PIM_SPREADSHEET_ID` | Google Sheet ID | Keep the real ID in Script Properties, never in Git. |
| `SHOPIFY_SHOP_DOMAIN` | `hvdq.myshopify.com` | Never use the public storefront domain. |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | secret | Do not put this in Sheets or Git. |
| `SHOPIFY_API_VERSION` | `2026-07` | Optional; defaults to the validated version. |
| `LIVE_SYNC_ENABLED` | `false` | Keep false through dry-run QA. |

## Deployment order

1. Create a bound Apps Script project from the PIM spreadsheet.
2. Add all files in `src/` and replace the manifest with `appsscript.json`.
3. Add Script Properties, with `LIVE_SYNC_ENABLED=false`.
4. Run `runHvdqUnitTests()`.
5. Run `inspectSystemSafety()`.
6. Run `dryRunProductBySku('<approved SKU>')` and inspect the payload.
7. Only after Founder approval, set `LIVE_SYNC_ENABLED=true` and sync one approved test product.

## Shopify scopes

The validated operations need product read/write access. Staged media creation also needs Shopify Files access. Grant only the minimum scopes required by the custom app and reauthorize after changing scopes.

## Validated Admin API operations

- `productSet` for idempotent product create/update from an external PIM.
- `stagedUploadsCreate` for private Google Drive image bytes.
- `fileCreate` to create Shopify-hosted files before associating them with the product.

No publish mutation is included.
