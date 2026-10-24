# Security

## Authentication & authorization

- **Admin** uses an HMAC-SHA256-signed, HttpOnly, SameSite=Lax session cookie (`sorvene_admin_session`, 8h TTL). See `src/backend/auth/`.
- Credentials come from `ADMIN_USERNAME` / `ADMIN_PASSWORD`; if either is unset, admin login is **disabled** (fail closed).
- `ADMIN_SESSION_SECRET` signs the token; it must be a long, random value and never shared.
- `POST /api/admin/login` is rate-limited (in-memory, 5/min/IP; production should add an edge/CDN limit).
- Authorization is enforced **server-side** on every protected route (`requireAdminApi`) and page (`requireAdminPage` + the `(protected)` route-group layout).
- Client-side checks (e.g. redirects) are UX only and are not a security boundary.

**Customers** authenticate with a WhatsApp-delivered OTP. `POST /api/customer/otp/request`
generates a 6-digit code, stores only its HMAC hash (keyed by `CUSTOMER_SESSION_SECRET`), and
sends it via a Meta `authentication` template; `POST /api/customer/otp/verify` checks it in
constant time (5-minute TTL, 30s resend cooldown, 5 attempts, one active code per phone) and
mints an HMAC-SHA256-signed, HttpOnly, SameSite=Lax session cookie (`sorvene_customer_session`,
30-day TTL). The Firebase integration (`backend/integrations/firebase/admin.ts`) is kept but
currently unused. Customer-only endpoints use `requireCustomerApi`; the client never chooses
its own identity.

## Resource ownership & tenant isolation

- Customer resources (addresses) are scoped to the authenticated principal: handlers resolve the
  customer from the session cookie (`requireCustomerApi`) and pass that `customerId` to the
  service — never a client-supplied id.
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

## WhatsApp (Meta Cloud API)

- Credentials (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`) are server-only env vars read via `common/env.ts`. The Graph host is fixed in code; callers cannot supply URLs, tokens, or sender IDs.
- `GET /api/status/whatsapp?to=` is admin-only, rate-limited (5/min overall, 3 per recipient/10 min), refuses cross-site browser requests (`Sec-Fetch-Site`), and only ever sends the `hello_world` template. Recipients are validated/normalized to E.164 digits.
- `POST /api/webhooks/whatsapp` verifies `X-Hub-Signature-256` (HMAC-SHA256, raw body, `WHATSAPP_APP_SECRET`, constant-time) before parsing; `GET` verifies `WHATSAPP_VERIFY_TOKEN` in constant time. Both fail closed when unconfigured.
- Provider error bodies are logged server-side only; phone numbers are masked in logs and responses. See `docs/whatsapp.md`.

## Payments (Razorpay)

- Credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are server-only env vars read via `common/env.ts`. The key id (public) is returned in the create-order response; the secret never leaves the server. `PAYMENT_PROVIDER` selects the provider and fails closed on unknown values.
- `POST /api/payments/create-order` requires a customer session and is rate-limited; the amount is derived from the server-side order total (never client input) and the payment is scoped to the authenticated customer. No internal order is created at this point.
- `POST /api/payments/verify` verifies the provider signature (HMAC-SHA256 of `orderId|paymentId`, constant-time) and, only on success, places the order and marks the payment paid. A mismatch returns 400 and never marks paid; unknown or cross-customer payments return 404. Repeated verification is idempotent.
- `POST /api/customer/orders/[id]/cancel` lets a customer mark their own not-yet-dispatched order (`pending`/`processing`) `cancellation_requested`; the order is cancelled only when an admin confirms (never by the customer alone).
- `POST /api/customer/orders/[id]/return` lets a customer request a return for their own `delivered` order, only within `RETURN_WINDOW_DAYS` of `deliveredAt`; an admin approves/rejects it (with an optional customer-visible note) and then progresses the return via `PATCH /api/admin/orders/[id]/return`.
- The provider abstraction lives in `backend/integrations/payments/`; provider error bodies are logged server-side only and normalized into non-leaking `AppError`s. This mirrors the webhook-signature requirement: payments are confirmed cryptographically, never on browser reports alone. (A webhook for async confirmation is future work; see the ecommerce controls below.)

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
| `POST /api/customer/otp/request` | public (rate-limited) |
| `POST /api/customer/otp/verify` | public (rate-limited + attempt-limited) |
| `DELETE /api/customer/session` | none (clears cookie) |
| `GET /api/status/whatsapp` | Admin session (+ rate limit) |
| `GET`/`POST /api/webhooks/whatsapp` | public; verify token (GET) / Meta HMAC signature (POST) |
| `GET /api/customer/me` | Customer session |
| `POST /api/customer/addresses` | Customer session |
| `POST /api/payments/create-order` | Customer session (+ rate limit) |
| `POST /api/payments/verify` | Customer session |
| `POST /api/customer/orders/[id]/cancel` | Customer session |
| `GET /`, admin pages | `/admin` and `/admin/subscribers` require admin session |

## Dependency & configuration hygiene

- Least-privilege database credentials; TLS via the connection string.
- Keep dependencies minimal; run `yarn lint`/`yarn typecheck`/`yarn test`/`yarn build` in CI.
