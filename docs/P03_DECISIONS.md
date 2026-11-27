# P03 catalog decisions

CAT-01 owns equipment and service definitions. A service has one default rate and may link several pieces of equipment. Archival changes active to false and preserves the record and its references.

Existing DTOs remain compatible. Additive validation caps names at 120 characters, equipment selections at 50 unique IDs and catalog pages at 100 records. All linked equipment must belong to the authenticated business. Archived equipment can remain linked for historical continuity.

Service updates atomically append the previous rate and unit to an internal rateHistory array when either changes. History is server-owned and includes actor and change time. Jobs and invoices are outside this module. Updates never touch financial snapshots.

The page offers active and archived views with pagination. Lists include equipment labels for the service editor through a paginated lookup. Mock mode uses an isolated DEMO catalog that resets on reload.
