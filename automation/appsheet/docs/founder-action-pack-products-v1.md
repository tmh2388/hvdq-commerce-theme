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

Each action uses table PRODUCTS and type
`Data: set the values of some columns in this row`.

### 1. Submit for Review

- Set: `Submit for Review=TRUE`,
  `Workflow Status="READY_FOR_REVIEW"`, `Last Updated=NOW()`,
  `Updated By=USEREMAIL()`.
- Only if:
  `AND([Validation Status]="VALID", IN([Workflow Status], {"DRAFT", "NEEDS_REVISION"}), IN(LOOKUP(USEREMAIL(), "USERS", "Email", "Role"), {"CONTENT", "MANAGER", "ADMIN", "FOUNDER"}))`

### 2. Return for Revision

- Set: `Submit for Review=FALSE`, `Workflow Status="NEEDS_REVISION"`,
  `Last Updated=NOW()`, `Updated By=USEREMAIL()`.
- Only if:
  `AND([Workflow Status]="READY_FOR_REVIEW", IN(LOOKUP(USEREMAIL(), "USERS", "Email", "Role"), {"MANAGER", "ADMIN", "FOUNDER"}))`

### 3. Approve Content

- Set: `Workflow Status="APPROVED"`, `Content Reviewer=USEREMAIL()`,
  `Last Updated=NOW()`, `Updated By=USEREMAIL()`.
- Only if:
  `AND([Workflow Status]="READY_FOR_REVIEW", [Validation Status]="VALID", IN(LOOKUP(USEREMAIL(), "USERS", "Email", "Role"), {"MANAGER", "ADMIN", "FOUNDER"}))`

### 4. Approve Legal Review

- Set: `Legal Review="APPROVED"`, `Last Updated=NOW()`,
  `Updated By=USEREMAIL()`.
- Only if:
  `IN(LOOKUP(USEREMAIL(), "USERS", "Email", "Role"), {"ADMIN", "FOUNDER"})`

### 5. Approve Product — Founder

- Set: `Founder Approval="APPROVED"`, `Last Updated=NOW()`,
  `Updated By=USEREMAIL()`.
- Only if:
  `AND([Workflow Status]="APPROVED", [Validation Status]="VALID", LOOKUP(USEREMAIL(), "USERS", "Email", "Role")="FOUNDER")`

### 6. Reject Product — Founder

- Set: `Founder Approval="REJECTED"`,
  `Workflow Status="NEEDS_REVISION"`, `Submit for Review=FALSE`,
  `Last Updated=NOW()`, `Updated By=USEREMAIL()`.
- Only if:
  `LOOKUP(USEREMAIL(), "USERS", "Email", "Role")="FOUNDER"`

These actions are the only AppSheet writers for the four locked workflow
fields. The executable source of truth is `AppDefinitionContract.gs`.

## D. Required bot

Create bot `Queue product review`:

- Event: PRODUCTS updates.
- Condition:
  `AND([Workflow Status]="READY_FOR_REVIEW", [_THISROW_BEFORE].[Workflow Status]<>"READY_FOR_REVIEW")`
- Process: add one row to APPROVAL_QUEUE.
- Values: `Request ID=UNIQUEID()`, `SKU=[SKU]`, `Approval Type="CONTENT"`,
  `Validation Status=[Validation Status]`, `Review Status="PENDING"`,
  `Requested At=NOW()`, `Requested By=USEREMAIL()`.

## E. Save and evidence

Save once after completing A–D, then generate fresh App Documentation. Do not
create a test product yet. Gate 1 remains open until automated contract
comparison reports no serious mismatch.
