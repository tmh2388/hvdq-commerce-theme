# HVDQ PIM Lite — AppSheet Data Contract v1

## Authoritative contract

[`../../apps-script/src/SchemaContract.gs`](../../apps-script/src/SchemaContract.gs)
is the single authoritative AppSheet Schema Contract and Configuration Matrix.
It contains one row for every physical and planned virtual column, with these
fields:

`Table`, `Column`, `Source type`, `AppSheet type`, `Key`, `Label`, `Ref table`,
`IsPartOf`, `Required`, `Editable`, `Initial value`, `App formula`, `Valid If`,
`Show If`, `Search`, `Sensitive`, `Classification`, and `Notes`. Lookup-backed
Enums also include `Base type` and `Allow other values`.

This document is only a guide; it deliberately does not repeat column values.

## Classification values

- `REGENERATE_OK`: expected to be inferred correctly from the source after
  Regenerate; fresh App Documentation is still required for readback.
- `FOUNDER_EDITOR`: an AppSheet-only property that must be set or confirmed in
  the Editor.
- `APPS_SCRIPT_AUDIT`: the source structure or data rule can be checked
  read-only by `SchemaAudit.gs`.
- `INSUFFICIENT_EVIDENCE`: no safe target configuration can be asserted yet.

Classifications may be combined with `|` because source-data auditability and
AppSheet Editor ownership are independent.

## Deliberately unresolved fields

- `INVENTORY[SKU]`: the source does not establish whether it means product SKU
  or variant SKU. It remains Text and is checked against both namespaces.
- `TRANSLATIONS[Resource Type]` and `TRANSLATIONS[SKU / Resource ID]`: the
  target is polymorphic. They remain non-Ref pending controlled data evidence.

No source Sheet column is renamed, removed, added, or repurposed by this
contract. Virtual `Product Ref` columns exist only inside AppSheet.

## Verification boundary

`SchemaAudit.gs` checks source tables/columns, key uniqueness, required values,
SKU uniqueness, physical reference integrity, LOOKUPS, contract structure, and
safety configuration. It cannot verify AppSheet-only properties such as Label,
Editable, Show If, Ref configuration, views, actions, or bots. Those require a
fresh App Documentation export plus controlled AppSheet tests.
