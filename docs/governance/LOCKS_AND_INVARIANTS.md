# HVDQ Commercial — Locks and Invariants

These rules may be changed only by an explicit Founder decision recorded in the Decision Register.

## Production protection

1. Do not edit or use the live Shopify theme as a test environment.
2. Do not use Netlify production as a UI or integration test environment.
3. Do not merge, deploy or publish a runtime change without candidate evidence and a rollback target.
4. Merge does not equal Shopify publish or Netlify production deploy.
5. Do not claim production status from a Git branch, PR description or arbitrary preview URL.

## Commerce authority

6. Shopify is authoritative for sellable product, variant, inventory, collection, customer, order, payment and fulfillment state.
7. New products created by integrations default to Draft.
8. Staff or partners may not activate or bulk-publish products outside the approved workflow.
9. Temporary intake data must not overwrite Shopify operational inventory or order state.
10. AppSheet PIM and marketplace automation remain outside the active Commercial scope.

## Security and access

11. Shopify Admin API tokens and private integration secrets must remain server-side and outside Git.
12. Portal previews must not write Shopify production by default.
13. Every production write requires authenticated identity, authorization, audit evidence and least-privilege scope.
14. Retry behavior must be idempotent; a timeout is not proof that Shopify did not accept the write.

## Delivery and evidence

15. Every runtime change belongs to one Active Gate and one accountable repository.
16. Static and targeted checks precede remote preview creation.
17. Founder UAT PASS is required before customer-facing production publication or deployment.
18. A check is PASS only when its command, candidate SHA and result are recorded.
19. Unknown platform state is recorded as `NOT VERIFIED` or `BLOCKED — ACCESS REQUIRED`.
20. No upgrade, subscription or capacity purchase is authorized by governance; unresolved capacity is reported as `CAPACITY_DECISION_REQUIRED`.

## Resource optimization

21. Do not push each minor edit while a candidate is still being assembled.
22. Do not retry a failed build before diagnosing the log.
23. Do not create a new preview when runtime code, dependency and environment are unchanged.
24. Governance-only changes must not trigger runtime builds when safe path filtering or ignored-build controls are available.
25. One Gate has one primary Founder UAT candidate at a time.
