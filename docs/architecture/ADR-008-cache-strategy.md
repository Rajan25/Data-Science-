# ADR-008: Caching Strategy (MVP)

## Status

Accepted

## Decision

Use DB-first reads for MVP and defer Redis read caching.

## Why

- Lowest implementation and operational complexity.
- Avoids early invalidation bugs while domain behavior is still evolving.
- Keeps confidentiality and consistency handling straightforward.

## Risks

- Higher database load under growth.
- Potentially higher tail latency on repeated reads.

## Later-B Upgrade Path

Introduce Redis caching for read-heavy routes with:

1. Route-level cache eligibility rules
2. Tenant-scoped cache keys
3. Explicit invalidation events on writes
4. Cache hit/miss observability and rollback switch
