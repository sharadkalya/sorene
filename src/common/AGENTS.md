# `src/common` — Shared, Environment-Independent Code

Extends the root `AGENTS.md`.

## Rules

- Only code that is safe to import from **both** server and browser belongs here: types, constants, pure helpers.
- `env.ts` is the single access point for environment variables. Server-only callers use it; do not read `process.env` ad hoc elsewhere.
- `themes.ts` is the single source of truth for supported DaisyUI themes (used by Tailwind config, settings validation, and the admin UI). Keep it in sync with the theme tokens in `src/app/globals.css`.
- Do **not** put Next.js, Mongoose, or provider-specific code here, and do not import anything from `@/backend` or `@/frontend` here (avoid circular dependencies).
