# ADR-006: Validation and Error Handling Strategy

## Status

Accepted

## Decision

Use per-route Zod validation with Fastify default error handling for MVP.

## Why

- Low implementation overhead and rapid iteration.
- Keeps endpoint contracts explicit and close to route logic.

## Risks

- Potential inconsistency in error envelope shape across modules.
- Harder cross-route analytics without a centralized error layer.

## Later-B Upgrade Path

Introduce centralized validation/error framework with:

1. Standard error envelope
2. Shared validation wrappers
3. Error classification and telemetry mapping
4. Module-wide policy enforcement hooks
