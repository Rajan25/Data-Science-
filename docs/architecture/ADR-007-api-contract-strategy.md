# ADR-007: API Contract Strategy

## Status

Accepted

## Decision

Start with lightweight route-level contracts (Zod + module docs), and defer full OpenAPI-first contract management.

## Why

- Faster iteration during MVP feature changes.
- Lower overhead while endpoint surfaces are still evolving.

## Risks

- Slower external integration onboarding until OpenAPI is introduced.
- Potential drift in error/response envelopes across modules.

## Later-B Upgrade Path

Adopt full OpenAPI with:

1. Single canonical spec source
2. Generated SDK/client bindings
3. Contract test enforcement in CI
