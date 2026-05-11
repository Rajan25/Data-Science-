# LinkedIn Automation

This repository contains the execution baseline for a confidentiality-first LinkedIn post and carousel assistant.

## Selected Architecture (Approved)

- Backend: modular monolith (service extraction later)
- Queue: BullMQ + Redis
- Tenancy: single Postgres + `tenant_id` with RLS
- LLM strategy: single primary model abstraction first, multi-LLM routing after baseline validation

## Workspace Layout

- `apps/web` - user interface
- `apps/api` - application backend (modular monolith)
- `apps/worker` - async jobs (generation, freshness, analytics)
- `packages/shared` - shared schemas, types, and contracts
- `docs/architecture` - ADRs and architecture records

## Next Execution Target

Week 1 foundation:

1. Auth/workspace boundaries
2. Confidentiality core controls
3. Access audit logging baseline

## Current API Surface (MVP foundation)

- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `GET /workspace/me`
- `GET /workspace/me/members`
- `POST /confidentiality/events`
- `GET /confidentiality/events`
- `POST /jobs`
- `GET /jobs`
- `GET /admin/audit-logs`
- `GET /admin/migrations/status`
- `GET /integrations/linkedin/start`
- `GET /integrations/linkedin/callback` (OAuth redirect; public)
- `GET /integrations/linkedin/connection`
- `GET /health`
- `GET /health/db`

## Database setup

Postgres must have the **application database** (default: `linkedin_automation`) before migrations or `/health/db` will work.

- **Create DB if missing:** `npm --workspace @lia/api run db:ensure`  
  Connects to the admin database `postgres` on the same host and runs `CREATE DATABASE` when needed.  
  Or from root: `npm run db:ensure:api`

If you use Docker Compose here, `POSTGRES_DB` should match the name in `DATABASE_URL`. If you changed compose env or reused an old volume without that database, run `db:ensure` or `docker compose down -v` then `up -d` (this wipes local DB data).

**If `db:ensure` says the DB exists but `/health/db` returns “database does not exist”:** you often have **two PostgreSQL instances** (for example Docker on `127.0.0.1:5432` and a local Windows install). `db:ensure` may be talking to one server and the API to another. Fix by stopping the extra service, or point `DATABASE_URL` at the correct host/port (see API startup log: `API database target from DATABASE_URL`).

## Database Migrations

- Run API migrations: `npm --workspace @lia/api run db:migrate`
- Or from root: `npm run db:migrate:api`

Set `DATABASE_URL` if it differs from the default in `apps/api/src/db/client.ts`.

## Local dependencies (Postgres + Redis)

Docker Compose is provided for development. **Docker Desktop must be running** (the engine must accept connections).

```powershell
docker compose up -d
```

Defaults: Postgres `127.0.0.1:5432`, Redis `127.0.0.1:6379`, database `linkedin_automation`, user/password `postgres`/`postgres`.

## End-to-end validation (local)

After Postgres and Redis are up:

```powershell
.\scripts\validate-local.ps1
```

The script runs migrations, starts the API briefly, registers a user, calls workspace/confidentiality/jobs/admin routes, and stops the API. If migrations fail with `ECONNREFUSED`, Postgres is not reachable.

## RLS Context Enforcement

- API data-access services use request-scoped DB context (`app.current_workspace_id`, `app.current_user_id`) before executing queries.
