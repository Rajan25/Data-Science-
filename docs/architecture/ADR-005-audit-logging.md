# ADR-005: Audit Logging Strategy

## Status

Accepted

## Decision

Use Postgres-native audit logging for MVP, and defer external log pipeline integration.

## Why

- Lowest cost and fastest to ship.
- Satisfies Week 1 baseline for confidentiality and access auditability.
- Keeps schema-level control for tenant context.

## Deferred Upgrade (Later-B)

Add external pipeline (OpenSearch/Datadog/SIEM) when:

- security monitoring depth is required,
- query latency for audit analysis grows,
- compliance workflows demand centralized security tooling.
