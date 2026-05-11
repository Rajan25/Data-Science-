# ADR-008: Caching Strategy

## Status

Accepted

## Decision

Use DB-first reads for MVP and defer Redis-backed read caching.

## Why

- Lowest implementation and operational overhead now.
- Avoids early cache invalidation complexity and stale data risks.
- Keeps Week 1 delivery focused on security, tenancy, and core workflows.

## Risks

- Higher database load as traffic increases.
- Potential read-latency pressure on hot endpoints later.

## Later-B Upgrade Path

Introduce Redis caching for high-read endpoints with:

1. Explicit TTL per key class
2. Invalidation on write paths
3. Cache hit/miss instrumentation
4. Fallback-to-DB resilience behavior
