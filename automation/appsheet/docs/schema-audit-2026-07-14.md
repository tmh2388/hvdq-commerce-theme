# AppSheet Schema Audit — baseline 2026-07-14; source recheck 2026-07-15

## Evidence

- App Documentation PDF: 274 pages, generated `2026-07-14 17:31:40`.
- App version: `1.000028`; 17 tables, 235 columns, 0 slices, 34 views,
  53 actions, and 0 workflow rules.
- PIM headers and current rows were read independently from Google Sheets.
- Contract version `1.2.0`: 210 matrix rows, including 204 physical source
  columns and 6 planned AppSheet virtual columns.
- Repository tests: legacy unit suite `8/8`; contract/audit suite `25/25`;
  cross-source audit suite `7/7`.

## Current Gate result

`Gate 1: OPEN — remediation and fresh App Documentation readback required.`

The 2026-07-15 read-only source audit found zero product/variant/media/price/
inventory/translation/approval/sync/error rows, one Founder user, five category
field rows, sixteen LOOKUPS rows, and seven APP_CONFIG rows. It found no source
structure or data-integrity errors. Required lookup groups are present;
`AUTO_PUBLISH=FALSE` and `SHOPIFY_CREATE_STATUS=DRAFT`.

This clean result verifies the current Sheet only. It does not verify AppSheet
Editor properties.

The live source recheck also verified the exact PRODUCTS validation and error
ARRAYFORMULAs, the INVENTORY available-stock ARRAYFORMULA, strict LOOKUPS,
and APP_CONFIG safety values. Missing Sheet validations for PRODUCTS Category
and Technique were repaired directly from active LOOKUPS; Product Model and
PRICING Market were resynchronized. No product rows were created.

## Founder-reported changes awaiting readback

- `PRODUCTS[Lead Time (days)]`: Number; blank Initial value.
- `PRODUCTS[Created At]`: DateTime; `NOW()`; non-editable.
- `PRODUCTS[Created By]`: Email; `USEREMAIL()`; non-editable.
- Labels: `COLLECTIONS[Title VI]`, `INVENTORY[SKU]`,
  `LOOKUPS[Label VI]`, `VARIANTS[Variant SKU]`, `MEDIA[Filename]`.
- `PRODUCTS[Workflow Status]`: Enum; Initial `DRAFT`; non-editable.
- `PRODUCTS[Submit for Review]`: Yes/No; Initial `FALSE`; non-editable.
- `PRODUCTS[Validation Status]`: Enum; blank Initial/App formula;
  non-editable; source Sheet formula retained.

The review subsequently corrected the target type for `Validation Status` back
to Text because its source formula returns both `VALID` and `MISSING REQUIRED`.
The prior Founder-reported Enum setting therefore appears once in the final
Action Pack as a required correction.

These are reported, not yet independently verified. The authoritative target
for every property is `automation/apps-script/src/SchemaContract.gs`.

## Baseline blockers still requiring AppSheet evidence

1. AppDoc v1.000028 contains zero Ref columns.
2. System and support tables reported `ALL_CHANGES` with unsafe default actions.
3. No security-filter evidence was present.
4. There were no slices, role-specific views, approval workflow rules, or bots.
5. AppSheet-only types, defaults, editability, formulas, and labels require a
   fresh App Documentation readback after remediation.
6. AppDoc v1.000028 contains only generated Add/Edit/Delete/open/email actions;
   no action, bot, workflow rule, or Apps Script bridge updates Submit for
   Review, Workflow Status, Legal Review, or Founder Approval. With those
   columns non-editable, the workflow is locked until the contracted actions
   are created.

## Risk decisions

- `Last Updated` is DateTime, not ChangeTimestamp. AppSheet workflow actions,
  Apps Script writes, and direct Google Sheets edits must all stamp it.
- `Updated By` is Text so it can hold a user email or source actor such as
  `APPS_SCRIPT`/`GOOGLE_SHEETS`.
- Show If is UX only. Authorization comes from sign-in, table security filters,
  table update mode, role conditions, and non-editable system fields.
- Lookup-backed Enums use Base type Text and disallow other values.
- `Product Name VI` is Text. No person-name behavior is required.

## Gate status

| Gate | Status | Evidence / blocker |
| --- | --- | --- |
| 1 | OPEN | Source audit clean; AppSheet readback incomplete |
| 2 | NOT TESTED | Founder row exists; runtime identity/role unverified |
| 3 | NOT TESTED | No controlled AppSheet product row |
| 4 | NOT TESTED | Approval queue/slices/bots unverified |
| 5 | NOT TESTED | Approval actions unverified |
| 6 | BLOCKED | Gates 1–5 must pass first; no Shopify API work authorized |

## Next evidence step

Continue Gate 1 from the first unconfirmed matrix property, requesting exactly
one AppSheet Editor change at a time. After the schema corrections are reported,
export fresh App Documentation and compare it to contract v1.1.0 before Gate 1
can pass.
