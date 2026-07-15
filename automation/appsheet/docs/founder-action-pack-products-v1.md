# Founder Action Pack — PRODUCTS v1

Status: one final AppSheet Editor configuration session. This pack contains
only properties that the source Sheet and Apps Script cannot set in AppSheet.
Properties already confirmed correct are omitted.

## A. App and table controls

1. Require user sign-in: ON.
2. PRODUCTS security filter:

   `IN(USEREMAIL(), SELECT(USERS[Email], [Active] = TRUE))`

3. PRODUCTS Are updates allowed: Adds and updates; do not allow Delete.

Show If is not a security boundary.

## B. Remaining PRODUCTS column changes

Apply in physical column order.

| Column | Change only these properties |
| --- | --- |
| Product ID | Required ON; Editable OFF; Initial value `UNIQUEID()` |
| SKU | Required ON; Valid If `NOT(IN([_THIS], SELECT(PRODUCTS[SKU], [Product ID] <> [_THISROW].[Product ID])))` |
| Workflow Status | Required ON |
| Product Name VI | Type Text; Required ON |
| Product Model | Required ON; Valid If `SELECT(LOOKUPS[Code], AND([Group]="PRODUCT_MODEL", [Active]=TRUE))` |
| Category | Type Enum; Base type Text; Allow other values OFF; Required ON; Valid If `SELECT(LOOKUPS[Code], AND([Group]="CATEGORY", [Active]=TRUE))` |
| Collection | Type Ref; Source table COLLECTIONS; IsPartOf OFF |
| Technique | Type Enum; Base type Text; Allow other values OFF; Valid If `SELECT(LOOKUPS[Code], AND([Group]="TECHNIQUE", [Active]=TRUE))` |
| Material | Type LongText |
| Weight (g) | Valid If `[_THIS] >= 0` |
| Personalization | Type LongText |
| Story VI | Type LongText; Required ON |
| Care VI | Type LongText |
| Warranty VI | Type LongText |
| Lead Time (days) | Required ON; Valid If `[_THIS] >= 0` |
| Hero Image Folder | Type URL; Required ON; unset image Label |
| Gallery Folder | Type URL |
| Alt Text VI | Type LongText |
| Legal Review | Editable OFF |
| Content Reviewer | Type Email; Editable OFF |
| Founder Approval | Editable OFF |
| Validation Status | Type Text |
| Validation Errors | Type LongText |
| Shopify Product GID | Editable OFF |
| Shopify Handle | Editable OFF |
| Shopify Sync Status | Initial value `NOT_SYNCED`; Editable OFF |
| Shopify Sync Error | Editable OFF |
| Shopify Updated At | Type DateTime; Editable OFF |
| Last Updated | Type DateTime; Editable OFF |
| Updated By | Type Text; Editable OFF |

For Validation Status and Validation Errors, keep Initial value and App formula
blank. Their ARRAYFORMULAs stay in Google Sheets.

## C. Required actions

Create the six actions exactly as defined in
`automation/apps-script/src/AppDefinitionContract.gs`:

1. Submit for Review.
2. Return for Revision.
3. Approve Content.
4. Approve Legal Review.
5. Approve Product — Founder.
6. Reject Product — Founder.

Each action is `Data: set the values of some columns in this row`. Copy its
column assignments and Only if expression from the executable contract. These
actions are the only AppSheet writers for the four locked workflow fields.

## D. Required bot

Create `Queue product review` from the bot specification in
`AppDefinitionContract.gs`. Trigger only when Workflow Status becomes
READY_FOR_REVIEW and add one CONTENT/PENDING row to APPROVAL_QUEUE.

## E. Save and evidence

Save once after completing A–D, then generate fresh App Documentation. Do not
create a test product yet. Gate 1 remains open until automated contract
comparison reports no serious mismatch.
