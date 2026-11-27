# P05 Work Records decisions

Work history supports tenant-scoped list/detail reads, search by job ID, farmer name or village, filters for farmer ID, date range, village, service ID, equipment ID and status, plus stable date/ID sorting and pagination. Service names on records use the frozen job line snapshots; farmer names use the current directory entry, with a fallback when removed.

Finalized work is not edited in place. An unbilled draft or completed job may be cancelled with a required reason. The API atomically changes status and appends an actor/time/reason revision. Billed jobs cannot be cancelled through this route. To correct an entry, the owner creates replacement work through Add Work. Invoice and payment correction belongs to later phases.

DEMO history starts with two work fixtures for the same farmer and includes page-memory jobs saved by Add Work. New DEMO jobs and cancellation changes reset on reload. The browser test server uses an empty memory read repository until seeded by a test.

