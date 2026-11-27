# P04 Add Work decisions

P04 stores a job with frozen service name, equipment IDs, unit, default rate and agreed line amounts. The API derives every line from a tenant-scoped active service and farmer. It rejects a stale or cross-business service reference, mismatched equipment package, fixed-price quantity other than one and fractional trips.

The client reviews estimated totals with the shared exact arithmetic helpers. The server independently recalculates those totals and persists the authoritative result. It rounds at each line as documented in P00. A completed job receives completedAt; a draft keeps the same price snapshot at its initial save. Editing and finalizing drafts belong to P05's correction workflow.

The standalone DEMO adapter uses the existing DEMO farmer and services. It stores saved DEMO jobs in page memory. Real jobs require the configured MongoDB database. Farmer and service picker reads are limited to 100 records per request in this phase; larger catalogs need search pagination before production use.
