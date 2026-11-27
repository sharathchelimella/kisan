# P02 farmer directory

FARM-01 owns farmer contact data. All repository operations require a server-resolved business ID. Archived records remain retrievable by ID and visible through an explicit archived filter. Editing archived records is rejected.

The existing DTO remains compatible. Additive contracts include partial updates, duplicate lookup and an archived filter. Name and village searches normalize Unicode, case and whitespace. Optional phones normalize spaces and punctuation for lookup. Duplicate hints match name plus village or a nonempty phone and allow intentional duplicates. A lookup before saving is advisory and does not reserve a unique identity.

The directory has independent repository and browser adapters. P01 authentication supplies context at the route boundary. No job, invoice or payment services are called.
