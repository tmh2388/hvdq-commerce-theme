# HVDQ AppSheet PIM v1

This directory records the AppSheet rollout evidence. The executable and
authoritative column-level contract lives with the audit code at
[`../apps-script/src/SchemaContract.gs`](../apps-script/src/SchemaContract.gs).

## Safety boundary

- Shopify output is Draft only.
- `LIVE_SYNC_ENABLED` remains `false` through Gates 1–6.
- AppSheet does not publish products or themes.
- Source Sheet columns are not renamed, removed, or repurposed in v1.
- Unresolved relationships stay non-Ref until supported by source evidence.

## Evidence baseline

- App ID: `6c76ee72-7994-4141-876f-13ec295973cb`
- Last audited App Documentation: version `1.000028`, generated
  `2026-07-14 17:31:40`
- PIM spreadsheet: `HVDQ Product Operations — PIM Lite v1.0`
- Baseline audit: [`docs/schema-audit-2026-07-14.md`](docs/schema-audit-2026-07-14.md)
- Contract guide: [`docs/data-contract-v1.md`](docs/data-contract-v1.md)

## Gate rule

A Gate is `PASS` only when the repository contract, fresh App Documentation,
and a controlled live AppSheet test agree. A Founder-reported editor change is
tracked as reported until App Documentation readback verifies it.
