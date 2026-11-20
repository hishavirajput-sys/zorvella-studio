# Migration roadmap

- [x] Recreate the ZORVELLAE storefront, customer account pages, and Cloud-backed store-management screens in TanStack Start; keep checkout unavailable because the source has no persistent payment flow.
- [x] Migrate the store data schema, customer-only records, separate manager roles, and protected management operations to Lovable Cloud.
- [ ] Import and verify original MongoDB records and customer identities; no export is bundled.
- [ ] Verify manager-only pages and controls for shavi@tsmnexus.com after a verified sign-in account exists; no role has been assigned yet.
- [x] Run typecheck, project tests, public route checks, responsive-width checks, and a signed-in address create/read/delete flow; retain remaining blockers in the migration ledger.
- [ ] Review and accept the preview cutover after original data and manager access are addressed.
