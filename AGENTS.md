<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Notable in this repo (Next.js 16): `middleware` is renamed to `proxy`; dynamic route `params` is a `Promise`; `cookies()`/`headers()` are async; route handlers use `route.ts`; the ESLint config enforces strict React hooks rules (`react-hooks/immutability`, `react-hooks/set-state-in-effect`).
<!-- END:nextjs-agent-rules -->

# Sorvene — Engineering Contract for AI Agents

This file is the canonical engineering standard for this repository. Every agent must follow it. Scoped instructions in `src/**/AGENTS.md` extend these rules; detailed rationale lives in `docs/`.

## 1. Core principles

- **Layering is strict.** UI → route handlers → services → repositories/integrations → infrastructure. Never skip a layer.
- **Route handlers are thin.** They parse/validate input, authenticate/authorize, call one service, and map errors to HTTP. No business logic, no direct model access.
- **React components never touch the database** and never import server-only SDKs or secrets.
- **Repositories own persistence.** Services own business rules. Integrations own external SDKs.
- **Business logic is independent** of Next.js, Mongoose, and third-party SDKs where practical, so it is unit-testable without real infrastructure.
- **Validate at trust boundaries.** Never trust the client. Reuse Zod schemas in the backend feature module.
- **Don't over-abstract.** Add an interface or layer when it earns its keep, not to satisfy a pattern.

Read `docs/architecture.md` before making structural changes.

## 2. Mandatory security

- Authorization is enforced **server-side** for every protected operation. Client-side checks are UX only.
- Admin endpoints go through `backend/auth/requireAdmin`; admin pages go through the `(protected)` route-group layout. Never re-implement role checks inline.
- Never read a user/tenant ID from the client as the identity. Scope queries to the authenticated principal.
- Secrets only via environment variables. Never commit `.env*`; never use `NEXT_PUBLIC_` for secrets.
- Validate all untrusted input at the API boundary with Zod.
- Return consistent, non-leaking errors via `backend/http.ts#jsonError`. No stack traces, DB internals, or provider responses to clients.
- Log useful diagnostics server-side without logging secrets, tokens, or PII.
- Fail closed: when auth/authorization cannot be established, deny.

See `docs/security.md` for the full policy.

## 3. Architecture map

```
src/app        Next.js routing only (pages, layouts, route.ts). No business logic.
src/backend    Services, repositories, auth, integrations, typed errors.
src/common     Environment-independent shared code (env, constants, themes).
src/frontend   Client UI: components, feature UI, state, styling.
```

Dependency direction:

```
UI → API/app → auth + validation → service → repository/integration → DB/external
```

Feature modules are organized by business capability under `src/backend/features/<name>/` (`*.types.ts`, `*.validation.ts`, `*.repository.ts`, `*.service.ts`). See `docs/tree-structure.md`.

## 4. Frontend

- **DaisyUI first.** Prefer DaisyUI components/utilities over custom CSS. No second component library.
- **Theme-aware styling only.** Never hardcode `#fff`, `red`, `bg-white`, `text-black`, `border-gray-200`, etc. Use DaisyUI semantic tokens (`bg-base-100`, `text-base-content`, `border-primary`, …). The custom `sorvene` theme lives in `src/app/globals.css`; theme list is `src/common/themes.ts`.
- **Reuse before rebuilding.** Check `src/frontend/components` and `src/frontend/features` first.
- **Identifiable class names.** Give every custom component/section a unique, meaningful class (BEM-style where a custom stylesheet is needed, e.g. `product-card`, `product-card__price`). CSS Modules are acceptable for component-local styles; their source names must be descriptive.
- **State:** Redux Toolkit is the standard for *shared client state* (installed with boilerplate in `src/frontend/store/`). Use React state for local UI state, URL params for navigational state, and server components/data fetching as the source of truth for server data. Do not mirror server responses into a client store without a clear need.
- **Data fetching:** Server Components fetch by default; client components receive data via props. Avoid `useEffect` + `fetch` on mount (the repo's ESLint forbids sync `setState` in effects).
- **Spacing:** containers use `gap`, buttons/form controls are padded, labels sit above controls with spacing — one spacing mechanism per axis, no double-spacing. See the Spacing section in `src/frontend/AGENTS.md`.
- Prefer Server Components; add `'use client'` only when interactivity/browser APIs require it.

See `src/frontend/AGENTS.md`.

## 5. Backend

- **One shared DB connection.** Use `backend/integrations/database/connection.ts#getMongoConnection`. Never create per-request connections or per-repository pools.
- **Models.** See `docs/models.md` for the authoritative field/index/constraint reference for every Mongoose model. Update it whenever a model changes.
- **Repositories** wrap Mongoose models in `backend/integrations/database/models/`. Handlers/services never import models directly.
- **Integrations** (email, R2 storage, future payments) are isolated behind small, replaceable modules in `backend/integrations/`. Centralize provider init; read config from `common/env.ts`.
- **Errors:** throw `AppError` from services; map with `jsonError` in handlers. Distinguish validation/auth/not-found/conflict/rate-limit/internal.
- **Auth:** admin session is an HMAC-signed HttpOnly cookie (`backend/auth/session.ts`). Login is rate-limited; credentials come from env (`ADMIN_USERNAME`, `ADMIN_PASSWORD`).

See `src/backend/AGENTS.md`.

## 6. Testing

Tests are mandatory for business logic, validation, auth, and error handling. Use Vitest. Run:

```bash
yarn test            # run once
yarn test:watch      # watch mode
yarn test:coverage   # coverage report
yarn typecheck       # TypeScript
yarn lint            # ESLint
yarn build           # production build
```

Cover edge cases (invalid/missing input, wrong-identity access, conflicts, failures), not just the happy path. Mock external boundaries; never connect to real services in unit tests. See `docs/testing.md`.

## 7. Dependencies & environment

- Adding a dependency requires a concrete need. No competing libraries for the same job (already: Zod for validation, Vitest for testing, Resend for email, Mongoose for data access).
- New env vars must be added to `.env.example` with a placeholder and a one-line description, and documented in `docs/security.md` / `DEPLOYMENT.md` as appropriate.
- Required config is read through `src/common/env.ts` and fails fast with a clear message at first use.
- Node 22+; package manager is Yarn 1 (`yarn.lock`).

## 8. Refactoring & review

- Fix architectural violations when you touch a file; don't leave two competing patterns.
- Preserve user-facing behavior unless a change is necessary and documented.
- Don't suppress TS/lint errors to make a build pass; don't weaken security to make tests pass.
- After changes run `typecheck`, `lint`, `test`, and `build`. Report actual results.

Scoped rules: `src/app/AGENTS.md`, `src/backend/AGENTS.md`, `src/frontend/AGENTS.md`, `src/common/AGENTS.md`. Detailed docs: `docs/architecture.md`, `docs/tree-structure.md`, `docs/testing.md`, `docs/security.md`, `docs/models.md`.

