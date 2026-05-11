# ADR-004: API Module Organization

## Status

Accepted

## Decision

Use domain-first module organization (`auth`, `workspace`, `confidentiality`, etc.) in the modular monolith.

## Why

- Scales better with feature growth.
- Makes service extraction easier later.
- Keeps ownership boundaries clear.

## Trade-off

- Slightly more upfront structure than layer-first organization.
