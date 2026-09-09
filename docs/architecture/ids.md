# Public identifiers

Source: `packages/core/src/ids`.

- **Primary keys** are UUIDs and never leave the API surface as the "ID" a human sees.
- **12-digit numeric public IDs** (`randomNumericId`) identify users, events, applications and competitions.
  First digit is never `0`, values are random (not sequential), so record volumes cannot be inferred.
- **Prefixed refs** (`randomPublicRef("PAY" | "ORD" | "TKT" | ...)`) identify payments, orders and tickets.
- `generateUniquePublicId(exists)` retries on collision; callers pass a DB `exists` check and store the value in a
  unique `publicId` column.
- `isValidPublicId` is used on login (email **or** User ID) and on tracking lookups.
