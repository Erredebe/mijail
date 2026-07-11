# AGENTS

## Workspace Shape
- This repo has two independent Node apps, not a package-workspace monorepo: `apps/api` and `apps/web` each have their own `package.json` and `package-lock.json`.
- Root `package.json` only wraps a few commands (`start:*`, `build:*`, `test:api`, `test:web`); there is no root `lint`, `typecheck`, or shared install step.

## Setup And Run
- Install dependencies per app: `npm install --prefix apps/api` and `npm install --prefix apps/web`.
- Backend env file is expected at `apps/api/.env`; copy from `apps/api/.env.example` before local API work.
- Generate Prisma client after dependency or schema changes: `npm --prefix apps/api run prisma:generate`.
- Apply DB schema only when using PostgreSQL: `npm --prefix apps/api run prisma:migrate:dev`.
- Start API from repo root with `npm run start:api`.
- Start web from repo root with `npm run start:web`.
- `npm run build` builds `web` first, then `api`.

## Backend Facts That Change Behavior
- Nest global prefix `/api` is applied only in `apps/api/src/main.ts`; tests that instantiate `AppModule` directly do not get that prefix unless they set it themselves.
- The API is intentionally dual-mode. If `DATABASE_URL` is unset, `PrismaService` does not connect and many read endpoints fall back to seed/in-memory data.
- CRUD writes are not dual-mode: services such as providers/models/agents/skills/tools throw `DATABASE_URL is required for write operations` when DB is not configured.
- `DatabaseService` seeds the base roles (`admin`, `builder`, `operator`, `viewer`) on module init, but only when `DATABASE_URL` is present and the roles table is empty.
- Prisma schema and migrations live under `apps/api/prisma/`.

## Frontend Facts That Change Behavior
- The Angular app is standalone-style (`app.config.ts`, `app.routes.ts`), not NgModule-based.
- Frontend API calls are hardcoded to `http://localhost:3000/api` in feature services; if the API runs elsewhere, update those services or proxy accordingly.
- The main routes are `/`, `/catalog`, and `/chat`.

## Verification
- Backend unit tests: `npm --prefix apps/api run test`.
- Backend e2e: `npm --prefix apps/api run test:e2e`.
- Frontend tests for CI/headless use: `npm --prefix apps/web run test -- --watch=false --browsers=ChromeHeadless`.
- Backend lint exists only inside `apps/api`: `npm --prefix apps/api run lint`.
- There is no verified frontend lint script in `apps/web/package.json`.

## Keep In Mind
- Default backend health URL in a real dev run is `http://localhost:3000/api/system/health`.
- The chat runtime supports both normal execution and SSE streaming; the frontend streaming path uses `fetch` directly against `/chat/stream`.
