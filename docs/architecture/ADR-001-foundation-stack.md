# ADR-001: Foundation Stack

## Status

Accepted

## Context

The product needs high iteration speed, controlled cost, strong confidentiality posture, and a clear path to scale.

## Decision

1. Use a modular monolith backend in `apps/api`.
2. Use BullMQ + Redis for async jobs in `apps/worker`.
3. Use single Postgres with `tenant_id` + RLS for multi-tenancy.
4. Start with single-model abstraction; add multi-LLM routing after baseline metrics are stable.

## Pros

- Fastest path to Week 1 delivery.
- Lowest early ops cost and complexity.
- Keeps architecture reversible for later extraction.

## Cons

- Future extraction work needed for service split.
- Redis and single DB require careful limits at higher load.

## Revisit Triggers

- Sustained queue latency or backlog growth above target.
- API saturation where module isolation no longer meets SLO.
- Need for regulatory isolation requiring per-tenant infrastructure.
