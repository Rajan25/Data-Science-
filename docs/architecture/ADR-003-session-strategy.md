# ADR-003: Session Strategy (MVP)

## Status

Accepted

## Decision

Use access-token-only JWT sessions for MVP, with short expiry (`15m` default), and defer refresh-token flow.

## Why now

- Lowest build complexity and fastest delivery for MVP.
- Smaller immediate operational surface (no token store/rotation/revocation pipeline yet).

## Risks

- More frequent re-authentication.
- Weaker long-session UX compared to refresh-token architecture.

## Later-B Upgrade Path

Introduce refresh tokens with:

1. Rotation on every refresh
2. Revocation list/store
3. Device/session management UI
4. Incident response token invalidation hooks
