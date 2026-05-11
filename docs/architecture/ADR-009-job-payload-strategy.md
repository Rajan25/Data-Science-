# ADR-009: Job Payload Strategy

## Status

Accepted

## Decision

Use Postgres-backed job records and enqueue only `jobId` in Redis.

## Why

- Better confidentiality and auditability of payload data.
- Smaller queue messages and clearer retry semantics.
- Easier governance for sensitive content generation inputs.

## Trade-off

- Worker performs one additional DB read per job.

## Scale Path

Add selective caching or payload compaction only after hot-path evidence justifies it.
