# Security

## Authentication & authorization

- **Admin** uses an HMAC-SHA256-signed, HttpOnly, SameSite=Lax session cookie (`sorvene_admin_session`, 8h TTL). See `src/backend/auth/`.
- Credentials come from `ADMIN_USERNAME` / `ADMIN_PASSWORD`; if either is unset, admin login is **disabled** (fail closed).
- `ADMIN_SESSION_SECRET` signs the token; it must be a long, random value and never shared.
- `POST /api/admin/login` is rate-limited (in-memory, 5/min/IP; production should add an edge/CDN limit).
- Authorization is enforced **server-side** on every protected route (`requireAdminApi`) and page (`requireAdminPage` + the `(protected)` route-group layout).
- Client-side checks (e.g. redirects) are UX only and are not a security boundary.

## Resource ownership & tenant isolation

- No authenticated-customer resources exist yet. When they do: establish the principal server-side, scope every query to that principal, verify ownership per resource, and add negative tests proving cross-user access is denied.
- Never accept user/tenant IDs from the client as the identity.

## Secret management

- Secrets live only in environment variables; `.env*` is gitignored (`.env.example` is the only committed env file, with placeholders).
- Never prefix secrets with `NEXT_PUBLIC_`; that exposes them to the browser.
- All env reads go through `src/common/env.ts`, which fails fast on missing required values.

## API validation

- All untrusted input is validated at the API boundary with Zod (`*.validation.ts`), reused by the service.
- Identifiers, enums (themes), string lengths, and formats (email) are constrained; unknown themes are rejected.
- Server-recalculated values are authoritative; never trust client-supplied prices/totals/roles.

## Storage & files

- Product media is stored in Cloudflare R2 via the S3-compatible API; the client lives in `backend/integrations/storage/` and all credentials stay server-side.
- `GET /api/status/r2` (admin-only) uploads and deletes a test object to verify configuration.
- For browser uploads, generate presigned URLs server-side; validate file type/size/ownership server-side; never let clients choose arbitrary object keys.
- Separate public product media from private customer/admin files; the public media base URL (`R2_PUBLIC_URL`) is configurable per environment.

## Error handling & logging

- Clients receive consistent, non-leaking errors via `jsonError` — no stack traces, DB internals, or provider responses.
- Log useful diagnostics server-side; never log passwords, tokens, secret keys, or unnecessary PII.

## Ecommerce-specific controls (when features arrive)

- Prices/totals/discounts computed server-side; validate availability before confirming an order.
- Verify payment webhook signatures; make webhook processing idempotent; never mark an order paid on browser reports alone.
- Prevent duplicate checkout submissions; keep order/payment states consistent.

## Operations that require authentication

| Operation | Auth |
| --- | --- |
| `GET /api/admin/subscribers` | Admin session |
| `PUT /api/settings` | Admin session |
| `POST /api/admin/logout` | none (clears cookie) |
| `GET /api/settings` | public (theme is not secret) |
| `POST /api/stay-tuned` | public (rate-limit as abuse control) |
| `GET /`, admin pages | `/admin` and `/admin/subscribers` require admin session |

## Dependency & configuration hygiene

- Least-privilege database credentials; TLS via the connection string.
- Keep dependencies minimal; run `yarn lint`/`yarn typecheck`/`yarn test`/`yarn build` in CI.
