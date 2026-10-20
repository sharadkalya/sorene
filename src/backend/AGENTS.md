# `src/backend` — Services, Data Access, Integrations, Auth

Extends the root `AGENTS.md`. This is the **server-only** business layer.

## Rules

- **Features** live in `src/backend/features/<feature>/` and follow the split:
  - `*.types.ts` — API/response contracts.
  - `*.validation.ts` — Zod schemas + `formatIssues`.
  - `*.repository.ts` — all Mongoose queries/persistence for the feature.
  - `*.service.ts` — business rules/workflows; throws `AppError`.
- **Handlers never call repositories or models directly** — only services.
- **DB access** goes through `integrations/database/connection.ts#getMongoConnection` (the one shared connection). Models live in `integrations/database/models/`. Do not create new pools or per-request connections. Every repository function must `await getMongoConnection()` before querying a model. See `docs/models.md` for the field/index reference.
- **Integrations** (`integrations/*`) own external SDKs (email, R2 storage). Initialize clients lazily; read config from `common/env.ts`; expose small typed functions. Business logic must not import provider SDKs.
- **Errors**: throw `AppError` with the right code; map to responses with `http.ts#jsonError`. Never return raw `error.message` to clients.
- **Auth**: `auth/session.ts` (cookie helpers) + `auth/token.ts` (pure sign/verify) + `auth/requireAdmin.ts` (guards) + `auth/credentials.ts` (env-based credential check) + `auth/rate-limit.ts` (login throttling).
- Keep this layer free of React, `next/navigation` page concerns, and anything that would be bundled to the browser. `next/headers` usage is acceptable only in the auth cookie helpers.
- Add unit tests alongside (`*.test.ts`), especially for services, validation, and auth.
