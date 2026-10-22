# Architecture

## Directory structure

```
src/
├── app/          Next.js routing only (pages, layouts, route.ts). No business logic.
├── backend/      Services, repositories, auth, integrations, typed errors.
├── common/       Environment-independent shared code (env, themes).
├── frontend/     Client UI: components, feature UI, styling.
└── types/        Ambient module declarations.
```

See `docs/tree-structure.md` for the full tree.

## Module responsibilities

| Layer | Location | Responsibility |
| --- | --- | --- |
| Routing / API entry | `src/app` | HTTP concerns, auth guard, validation entry, service invocation, error → HTTP mapping. |
| Auth | `src/backend/auth` | Admin session cookie, credential check, authorization guards, login rate limiting. |
| Features | `src/backend/features/<name>` | Business capability: validation, service (rules), repository (persistence), response types. |
| Integrations | `src/backend/integrations` | External SDKs (Mongoose connection, Resend email) behind small typed modules. |
| Shared | `src/common` | Env access, constants/theme list. |
| UI | `src/frontend` | Components and feature UI; receives data via props. |

## Dependency direction

```
UI (frontend)
  ↓
API / app (route handlers, server components)
  ↓
auth + validation (backend/auth, *.validation.ts)
  ↓
service (backend/features/*/*.service.ts)
  ↓
repository / integration interface
  ↓
database / external services
```

Rules enforced by this direction:

- `frontend` never imports `backend` integrations, models, or secrets.
- `common` never imports `backend` or `frontend`.
- `app` imports services from `backend`, never repositories/models directly.
- Services import repositories + integrations, never Next.js HTTP types.

## Request lifecycle

**API route** (`route.ts`): parse body → run `requireAdminApi()` (if protected) → call one service → `jsonError` on throw.

**Server component page**: auth-guarding layout (admin) runs first → page calls a service → passes plain data to a client component.

**Public storefront** (`/api/stay-tuned`, `GET /api/settings`): validation → service → consistent response. `PUT /api/settings` is admin-only.

## Authentication & authorization flow

1. `POST /api/admin/login` verifies `ADMIN_USERNAME`/`ADMIN_PASSWORD` (env), throttled by an in-memory rate limiter.
2. On success it sets `sorvene_admin_session`, an HMAC-SHA256-signed, HttpOnly, SameSite=Lax cookie (8h TTL).
3. `requireAdminApi()` / `requireAdminPage()` verify the cookie signature + expiry server-side.
4. Pages under `src/app/admin/(protected)/` are guarded by the route-group layout; the login page is outside it.

Client-side checks are UX only — they can never grant access.

## Database connection lifecycle

- One shared Mongoose connection, cached on `globalThis` in `backend/integrations/database/connection.ts`.
- Reused across requests, dev hot reloads, and warm serverless instances; never disconnected per request.
- Configured with `bufferCommands: false`, `serverSelectionTimeoutMS`/`connectTimeoutMS` of 10s, `maxPoolSize` 10.
- A rejected connection promise is cleared so a later request can retry.
- Theme lookup (`settings.service#getTheme`) tolerates build phase and missing/unreachable DB by falling back to `sorvene`.

## Integration architecture

- Each provider (email, R2 storage; payments later) is a module in `backend/integrations/`.
- Provider clients are initialized lazily; config comes from `common/env.ts`; errors are normalized.
- Business code calls small typed functions (`sendStayTunedEmail`, `checkStorageHealth`) — never the SDK directly.
- R2 is accessed through the S3-compatible API; see `integrations/storage/`.
- WhatsApp (Meta Cloud API) lives in `integrations/whatsapp/` + `features/whatsapp/`; see `docs/whatsapp.md`.

## State management

- Server components + backend services are the source of truth for server data.
- React state for local UI; URL params for navigation.
- Redux Toolkit is the standard for shared client state (cart/checkout). Boilerplate lives in `src/frontend/store/` (store factory, typed hooks, `StoreProvider`, example slice); use it when a feature needs shared state.

## Environment configuration

- `src/common/env.ts` is the only reader of `process.env`; required values fail fast with a clear message.
- `.env.example` lists every variable with a placeholder; see `docs/security.md`.

## Introducing a new feature

1. Create `src/backend/features/<name>/` with `types`, `validation`, `repository`, `service` (only the files the feature needs).
2. Add tests alongside (`*.test.ts`) covering edge cases and authorization.
3. Add thin route handler(s) under `src/app/api/...` that call the service.
4. Add server-component page(s) that call the service and render a client component from `src/frontend`.
5. If new env vars or external SDKs are needed: add to `common/env.ts`, `.env.example`, and a dedicated integration module.
