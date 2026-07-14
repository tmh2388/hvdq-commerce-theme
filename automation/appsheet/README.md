# HVDQ AppSheet PIM v1

This directory is the source-controlled contract for the HVDQ Product
Operations AppSheet application. The live app remains configured in AppSheet;
these files record the expected schema, rollout gates, and verified evidence.

## Safety boundary

- Shopify output is Draft only.
- `LIVE_SYNC_ENABLED` stays `false` until the Founder approves a controlled
  Draft test.
- AppSheet must not publish products or themes.
- Source Sheet columns are not renamed or removed in v1.
- Relationships that cannot safely use the existing physical foreign-key
  columns are implemented as AppSheet virtual `Ref` columns.

## Evidence baseline

- App ID: `6c76ee72-7994-4141-876f-13ec295973cb`
- Audited app version: `1.000028`
- App documentation generated: `2026-07-14 17:31:40`
- PIM spreadsheet: `HVDQ Product Operations — PIM Lite v1.0`
- Audit: [`docs/schema-audit-2026-07-14.md`](docs/schema-audit-2026-07-14.md)
- Data contract: [`docs/data-contract-v1.md`](docs/data-contract-v1.md)

## Gate rule

A Gate is `PASS` only when the repository contract, App Documentation, and a
live AppSheet test agree. A reported configuration without readback evidence is
not a pass.
