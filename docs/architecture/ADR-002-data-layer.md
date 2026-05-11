# ADR-002: Data Layer and Migration Strategy

## Status

Accepted

## Context

We need a low-cost, scalable data layer that supports strict tenancy and confidentiality controls while keeping velocity high.

## Decision

1. Use Drizzle ORM for typed query access and schema contracts.
2. Use raw SQL migration files with an internal migration runner.

## Pros

- Strong control over SQL, RLS, and confidentiality-sensitive policies.
- Lower framework overhead and clear migration auditability.
- Easy to review and reason about data changes.

## Cons

- More manual migration discipline required.
- Team must maintain migration conventions carefully.

## Cost and Scale View

- Lower direct tooling cost.
- Predictable scale path with Postgres + RLS and explicit indexing later.
- Good fit for current ROI-first milestone execution.
