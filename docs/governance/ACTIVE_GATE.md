# HVDQ Commercial — Active Gate

## Gate ID

`GOV-01 — COMMERCIAL GOVERNANCE FOUNDATION`

## Objective

Create the minimum authoritative governance layer required to coordinate the Shopify storefront and partner portal without changing runtime or production systems.

## Business outcome

- Production boundaries become explicit.
- Shopify remains the commerce source of truth.
- Cross-repository work has one authority and one current state.
- Future implementation can be reviewed and verified without unnecessary builds or deploys.

## Scope

- Project Control Center.
- System Map.
- Locks and Invariants.
- Current State.
- Active Gate.
- Decision Register.
- Machine-readable `project-state.yaml`.
- Repository README navigation.

## Out of scope

- Theme runtime changes.
- Portal runtime changes.
- Shopify Admin, theme publication, product catalog, checkout, payment or shipping changes.
- Netlify settings, environment changes, build retries or production deploys.
- Branch protection, rulesets or CI enforcement.
- Portal architecture correction, Shopify Draft sync and marketplace features.

## Risk classification

`LOW — GOVERNANCE-ONLY`

## Dependencies

- GitHub repository write access: verified.
- Shopify Admin access: not required for this Gate.
- Netlify UI access: not required for this Gate.

## Acceptance criteria

1. Governance authority is explicitly assigned to `tmh2388/hvdq-commerce-theme`.
2. Both repositories and their production boundaries are mapped.
3. Shopify-native authority and production locks are explicit.
4. Unknown state is marked `NOT VERIFIED` or `BLOCKED — ACCESS REQUIRED`.
5. Current State does not present plans as completed work.
6. Decision Register records Founder decisions and superseded approaches.
7. `project-state.yaml` agrees with Current State and Active Gate.
8. No runtime, Shopify or Netlify production change is included.
9. A Draft Pull Request targets `main`.

## Evidence required

- Branch name.
- Pull Request number and URL.
- Head commit SHA.
- Changed-file inventory.
- Verification that runtime files are unchanged.
- Confirmation that no Shopify or Netlify action occurred.

## Gate close condition

The Draft PR is reviewed, governance documents are internally consistent, and Founder approves merge. Merge does not authorize runtime changes or production deployment.

## Next Gate after closure

`GOV-02 — REPOSITORY DELIVERY CONTROLS`, subject to a separate scope and approval record.
