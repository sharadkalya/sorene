# `src/app` — Routing Layer

Extends the root `AGENTS.md`. This directory is **Next.js routing only**.

## Rules

- Files here are `page.tsx`, `layout.tsx`, and `route.ts` plus global styles. No business logic.
- **Route handlers** (`route.ts`): parse + validate input, run the auth guard, call one service from `@/backend/features/*`, return `jsonError(error)` on failure. See `src/app/api/stay-tuned/route.ts` for the canonical shape.
- **Pages** are Server Components by default. They fetch via backend services and pass data to client components in `@/frontend`. See `src/app/admin/(protected)/page.tsx`.
- **Admin protection**: anything sensitive lives under `src/app/admin/(protected)/` whose `layout.tsx` calls `requireAdminPage()`. `src/app/admin/login` is intentionally outside the guard.
- Dynamic route `params` is a `Promise` — `await` it. There is no `middleware.ts` in Next 16; it is `proxy.ts` (not currently needed here).
- `cookies()` and `headers()` are async.
- Do not import Mongoose models, repositories, or server-only SDKs into client components.
