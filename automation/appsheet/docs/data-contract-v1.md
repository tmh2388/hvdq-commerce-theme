# HVDQ PIM Lite — AppSheet Data Contract v1

Status: proposed remediation contract for Gate 1. No source Sheet column is
renamed, removed, or repurposed by this contract.

## Stable keys and labels

| Table | Key | Text label | Image label |
| --- | --- | --- | --- |
| PRODUCTS | Product ID | Product Name VI | Hero Image Folder |
| COLLECTIONS | Collection ID | Title VI | — |
| VARIANTS | Variant ID | Variant SKU | — |
| MEDIA | Media ID | Filename | — |
| PRICING | Price ID | Price ID | — |
| INVENTORY | Inventory ID | Variant SKU | — |
| TRANSLATIONS | Translation ID | Field | — |
| APPROVAL_QUEUE | Request ID | Request ID | — |
| SYNC_LOG | Log ID | Log ID | — |
| USERS | Email | Full Name | — |
| CATEGORY_FIELDS | Category Field ID | Field Name | — |
| ERROR_QUEUE | Error ID | Error ID | — |
| LOOKUPS | Lookup ID | Label VI | — |
| APP_CONFIG | Key | Key | — |

All generated ID keys use AppSheet initial value `UNIQUEID()` without a leading
equals sign. Existing populated keys must never be recalculated.

## Physical and virtual relationships

`PRODUCTS[Product ID]` remains the stable product key. Existing child tables
store `SKU`, so changing those physical columns to `Ref` would be invalid: a
Ref stores the referenced table key, not its label or SKU.

The v1 relationship contract therefore uses the following virtual columns and
does not modify the Google Sheet structure:

| Table | Virtual column | Type / target | App formula |
| --- | --- | --- | --- |
| VARIANTS | Product Ref | Ref → PRODUCTS | `ANY(SELECT(PRODUCTS[Product ID], [SKU] = [_THISROW].[Product SKU]))` |
| MEDIA | Product Ref | Ref → PRODUCTS | `ANY(SELECT(PRODUCTS[Product ID], [SKU] = [_THISROW].[SKU]))` |
| PRICING | Product Ref | Ref → PRODUCTS | `ANY(SELECT(PRODUCTS[Product ID], [SKU] = [_THISROW].[SKU]))` |
| TRANSLATIONS | Product Ref | Ref → PRODUCTS | `ANY(SELECT(PRODUCTS[Product ID], [SKU] = [_THISROW].[SKU]))` |
| APPROVAL_QUEUE | Product Ref | Ref → PRODUCTS | `ANY(SELECT(PRODUCTS[Product ID], [SKU] = [_THISROW].[SKU]))` |
| SYNC_LOG | Product Ref | Ref → PRODUCTS | `ANY(SELECT(PRODUCTS[Product ID], [SKU] = [_THISROW].[SKU]))` |
| ERROR_QUEUE | Product Ref | Ref → PRODUCTS | `ANY(SELECT(PRODUCTS[Product ID], [SKU] = [_THISROW].[SKU]))` |
| INVENTORY | Variant Ref | Ref → VARIANTS | `ANY(SELECT(VARIANTS[Variant ID], [Variant SKU] = [_THISROW].[Variant SKU]))` |

`PRODUCTS[Collection]` becomes a physical `Ref → COLLECTIONS`. The PIM contains
no launch product rows at this baseline, so the field can safely store
`Collection ID` from the first controlled test onward.

## Required types and system defaults

| Table[column] | Type | Initial value / rule |
| --- | --- | --- |
| PRODUCTS[Product ID] | Text, Key | `UNIQUEID()` |
| PRODUCTS[Workflow Status] | Enum | `DRAFT` |
| PRODUCTS[Product Name VI] | Name | Required |
| PRODUCTS[Product Model] | Enum | Active `LOOKUPS[Code]`, group `PRODUCT_MODEL` |
| PRODUCTS[Category] | Enum | Active `LOOKUPS[Code]`, group `CATEGORY` |
| PRODUCTS[Collection] | Ref → COLLECTIONS | Optional |
| PRODUCTS[Technique] | Enum | Active `LOOKUPS[Code]`, group `TECHNIQUE` |
| PRODUCTS[Weight (g)] | Number | Minimum `0` |
| PRODUCTS[Lead Time (days)] | Number | Minimum `0` |
| PRODUCTS[Hero Image Folder] | Image/File path | Required for validation |
| PRODUCTS[Gallery Folder] | File/URL path | Optional |
| PRODUCTS[Video URL] | URL | Optional |
| PRODUCTS[Submit for Review] | Yes/No | `FALSE` |
| PRODUCTS[Validation Status] | Text, read-only | Source Sheet formula |
| PRODUCTS[Validation Errors] | LongText, read-only | Source Sheet formula |
| PRODUCTS[Shopify Sync Status] | Enum, system-only | `NOT_SYNCED` |
| PRODUCTS[Created At] | DateTime, read-only | `NOW()` |
| PRODUCTS[Created By] | Email, read-only | `USEREMAIL()` |
| PRODUCTS[Last Updated] | ChangeTimestamp, read-only | Track all editable fields |
| PRODUCTS[Updated By] | ChangeUserEmail, read-only | Track all editable fields |
| PRICING[Price] | Price | Non-negative |
| PRICING[Approved By] | Email, read-only | Action/bot only |
| PRICING[Approved At] | DateTime, read-only | Action/bot only |
| APPROVAL_QUEUE[Publish Approved By] | Email, read-only | Founder action only |
| APPROVAL_QUEUE[Publish Approved At] | DateTime, read-only | Founder action only |
| SYNC_LOG[Timestamp] | DateTime, read-only | `NOW()` |
| SYNC_LOG[Initiated By] | Email, read-only | `USEREMAIL()` or automation identity |
| ERROR_QUEUE[Timestamp] | DateTime, read-only | `NOW()` |

## Edit ownership

- `CONTENT`: product content owned by the user while status is `DRAFT` or
  `NEEDS_REVISION`; no price, cost, approval, or Shopify system fields.
- `WAREHOUSE`: inventory fields only.
- `MANAGER`: content approval and revision notes; no publish approval.
- `ADMIN`: configuration, error handling, and Shopify Draft queue controls.
- `FOUNDER`: price approval and final publish approval flag.
- `SYNC_LOG`, Shopify IDs/status/error timestamps, approval audit fields, and
  validation formula columns are never directly editable by content staff.

## Compatibility

Apps Script v1 continues joining operational records by normalized SKU. The
virtual AppSheet Refs are navigation and integrity aids; they do not change the
Shopify Draft payload or the current Apps Script contract.
