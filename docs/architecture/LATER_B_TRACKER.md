# Later-B Tracker

This file tracks all decisions where we intentionally start with Option A and upgrade to Option B later.

## Active Deferred Upgrades

## LB-001: LLM Setup
- Current: Option A (single primary model + abstraction layer)
- Later upgrade: Option B (multi-LLM routing by task)
- Why deferred:
  - Lower complexity and faster validation in MVP
- Revisit trigger:
  - After stable quality telemetry and baseline acceptance metrics
- Target phase:
  - P2

## LB-002: Authentication
- Current: Option A (local JWT auth)
- Later upgrade: Option B (managed auth provider)
- Why deferred:
  - Faster and cheaper initial implementation
- Revisit trigger:
  - When user count or compliance/security overhead grows
- Target phase:
  - Post-MVP hardening

## LB-003: Session Strategy
- Current: Option A (access token only)
- Later upgrade: Option B (access + refresh tokens with rotation/revocation)
- Why deferred:
  - Lower implementation complexity in MVP
- Revisit trigger:
  - Need for longer-lived sessions, multi-device continuity, or stricter token revocation requirements
- Target phase:
  - Post-MVP hardening

## LB-004: Audit Logging Pipeline
- Current: Option A (Postgres audit table only)
- Later upgrade: Option B (Postgres + external security log pipeline)
- Why deferred:
  - Lower infrastructure and operations cost in MVP
- Revisit trigger:
  - Need for advanced detection, long-horizon analytics, or SIEM integration
- Target phase:
  - Post-MVP hardening

## LB-005: Validation and Error Standardization
- Current: Option A (per-route Zod validation + Fastify defaults)
- Later upgrade: Option B (central validation/error framework layer)
- Why deferred:
  - Faster delivery with lower complexity in MVP
- Revisit trigger:
  - Growing route count and need for stricter uniform observability across failures
- Target phase:
  - P1/P2 hardening

## LB-006: API Contract Strategy
- Current: Option A (lightweight route docs + in-code schemas)
- Later upgrade: Option B (full OpenAPI-first contract layer)
- Why deferred:
  - Lower upfront maintenance during early feature volatility
- Revisit trigger:
  - External integrations, SDK generation, or partner API onboarding requirements
- Target phase:
  - P1/P2 hardening

## LB-007: Multi-LLM Routing
- Current: Option A (single primary model via abstraction layer)
- Later upgrade: Option B (multi-LLM routing by task and policy)
- Why deferred:
  - Reduce early complexity, cost variance, and debugging surface area
- Revisit trigger:
  - Stable baseline metrics and clear quality/cost gains from model specialization
- Target phase:
  - P2

## LB-008: Read Caching Strategy
- Current: Option A (DB-first reads, no Redis cache layer for read paths)
- Later upgrade: Option B (Redis caching for read-heavy paths)
- Why deferred:
  - Avoid early cache invalidation complexity and consistency risks
- Revisit trigger:
  - Rising read latency, DB pressure, or repeated hot-query patterns
- Target phase:
  - P1/P2 scale hardening

## LB-009: LinkedIn token storage
- Current: Option A (tokens stored as plaintext in Postgres for MVP scaffolding)
- Later upgrade: Option B (encrypt at rest, vault/KMS, rotation)
- Revisit trigger: before production or any multi-tenant paid launch
- Target phase: pre-production hardening

## Review Cadence
- Review all LB items at each Go/No-Go gate and weekly architecture review.
