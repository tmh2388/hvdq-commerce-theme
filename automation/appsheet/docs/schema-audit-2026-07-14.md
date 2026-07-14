# AppSheet Schema Audit — 2026-07-14

## Evidence

- App Documentation PDF: 274 pages, generated `2026-07-14 17:31:40`.
- App version: `1.000028`.
- App reports: 17 tables, 235 columns, 0 slices, 34 views, 53 actions,
  0 workflow rules.
- App is runnable but not deployable.
- PIM source, required table names, and Founder record were independently read
  from Google Drive/Sheets.

## Gate 1 result

`FAIL — remediation required.`

The app points to the correct spreadsheet and contains PRODUCTS, USERS, and
LOOKUPS, but the regenerated schema is not production-safe.

## Verified findings

### Correct

- Required stable keys exist for the operational tables.
- `USERS[Email]` is the Key and `USERS[Full Name]` is the Label.
- `PRODUCTS[Product ID]` is the Key with a generated initial value.
- `PRODUCTS[Product Name VI]` is the text Label.
- `PRODUCTS[Hero Image Folder]` is the image Label.
- The source spreadsheet locale is Vietnamese.

### Blocking defects

1. The documentation contains zero `Ref` columns.
2. `PRODUCTS[Lead Time (days)]` is `DateTime` with initial value `NOW()`;
   required type is non-negative `Number`.
3. `PRODUCTS[Created At]` and `PRODUCTS[Created By]` are `Text`, have no safe
   initial values, and are directly editable.
4. Approval audit timestamps and approver fields are mostly `Text` and directly
   editable.
5. Incorrect labels include:
   - COLLECTIONS: `Last Updated` instead of `Title VI`.
   - INVENTORY: `Last Updated` instead of `Variant SKU`.
   - LOOKUPS: `Lookup ID` instead of `Label VI`.
   - VARIANTS has no useful text Label.
6. AppSheet tables, including USERS, APP_CONFIG, SYNC_LOG, and ERROR_QUEUE,
   report `ALL_CHANGES`; default Add/Edit/Delete actions remain available.
7. No security-filter expression was present in the exported documentation.
8. There are no slices, approval workflow rules, or role-specific views yet.
9. Generated IDs are inconsistent between `UNIQUEID()` and `=UNIQUEID()`.
10. START_HERE and DATA_DICTIONARY are exposed as mutable app tables even
    though they are documentation/support sheets.

## Required remediation order

1. Correct keys, labels, types, initial values, read-only system fields.
2. Add virtual Refs and set `PRODUCTS[Collection]` to Ref.
3. Restrict support/system tables and remove unsafe default actions.
4. Apply authorized-user security filters and role-based edit rules.
5. Create slices, forms, and role-specific views.
6. Create approval actions and bots.
7. Export a fresh App Documentation PDF and re-audit Gate 1 before Gate 2.

## Gate status

| Gate | Status | Evidence |
| --- | --- | --- |
| 1 | FAIL | Correct source; unsafe regenerated schema |
| 2 | NOT TESTED | Founder row verified; runtime role not verified |
| 3 | NOT TESTED | No controlled AppSheet product row |
| 4 | NOT TESTED | No approval slice/bot |
| 5 | NOT TESTED | No approval action test |
| 6 | BLOCKED | Shopify Draft creation forbidden before Gates 1–5 |
| 7 | PARTIAL | Repository and Sheet safety locks verified; runtime property not read |
| 8–10 | UNDEFINED | Must be defined in the final test protocol before execution |
