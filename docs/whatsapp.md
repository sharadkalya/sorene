# WhatsApp Cloud API

Sorvene sends WhatsApp messages through Meta's official Cloud API (Graph API). Everything is server-only.

## Layout

| Layer | File |
| --- | --- |
| Config (lazy, validated) | `src/common/env.ts` (`getWhatsApp*`) |
| Provider adapter (HTTP, timeout, error mapping) | `src/backend/integrations/whatsapp/whatsapp-client.ts` |
| Webhook signature / token compare | `src/backend/integrations/whatsapp/whatsapp-signature.ts` |
| Business rules (validation, rate limits, webhook handling) | `src/backend/features/whatsapp/` |
| Admin test endpoint | `GET /api/status/whatsapp` |
| Meta webhook | `GET` / `POST /api/webhooks/whatsapp` |

The Graph host (`https://graph.facebook.com`) is hard-coded; the path is built only from `WHATSAPP_API_VERSION` and
`WHATSAPP_PHONE_NUMBER_ID`. Callers can never supply a URL, token, or sender ID.

## Environment variables

See `.env.example`. `WHATSAPP_API_VERSION` must look like `v23.0` (anything else fails with a 503 and a
server-side log line). `WHATSAPP_PHONE_NUMBER_ID` must be numeric. `WHATSAPP_BUSINESS_ACCOUNT_ID` is documented
for template management but is not used when sending.

## Testing the endpoint

`GET /api/status/whatsapp?to=<number>` — admin-only. It sends Meta's pre-approved `hello_world` template
(`en_US`) to the recipient.

Why a template: free-form text can only be sent within 24 hours of the recipient's last message to you, which a
fresh test recipient never has. A template is the only message type that can start a conversation, and
`hello_world` exists on every new app.

### Prerequisites (Meta test number)

While the app uses Meta's **test phone number**, Meta only delivers to **permitted recipients**:

1. Open **developers.facebook.com → your app → WhatsApp → API Setup**.
2. Under **Send and receive messages → To**, choose **Manage phone number list** and add the recipient's number
   (up to 5). Meta sends a verification code to that WhatsApp account; enter it to verify.
3. Make sure `WHATSAPP_ACCESS_TOKEN` is current (the temporary token on that page expires after ~24h) and that
   `WHATSAPP_PHONE_NUMBER_ID` is the test number's ID shown on the same page.

Sending to a number that is not on the list returns **400** with a message explaining this (Meta error 131030).

### Steps

1. Run `yarn dev` and sign in at `/admin/login`.
2. In the same browser, open
   `http://localhost:3000/api/status/whatsapp?to=919876543210`
   (digits with country code; `+`, spaces, `-`, and parentheses are tolerated; a `+` typed in a URL should be
   written `%2B`). Or with curl, reusing the session cookie:
   `curl -b "sorvene_admin_session=<cookie>" "http://localhost:3000/api/status/whatsapp?to=919876543210"`
3. Success:
   ```json
   {
     "success": true,
     "message": "Test WhatsApp message accepted by Meta. Delivery status is reported asynchronously.",
     "delivery": { "status": "accepted", "messageId": "wamid...", "template": "hello_world", "recipient": "********3210" }
   }
   ```
   `accepted` means Meta queued it, not that it reached the phone. Delivery results arrive via the webhook.

### Responses

| Status | Meaning |
| --- | --- |
| 200 | Accepted by Meta |
| 400 | Invalid number, recipient not on the test allow-list, or not a WhatsApp user |
| 401 | No valid admin session |
| 403 | Browser reported a cross-site request (`Sec-Fetch-Site`) |
| 429 | Rate limited (ours or Meta's) |
| 502 | Meta rejected the credentials/template or returned an error |
| 503 | WhatsApp env configuration missing or invalid |
| 504 | Meta did not answer within 10s |

Errors use the standard `{ success: false, error: { code, message } }` shape. Provider details (codes,
`fbtrace_id`, messages) are logged server-side only, never returned.

### Abuse controls

- Admin session required (`requireAdminApi`); cross-site browser requests are refused because the endpoint has
  a side effect and the session cookie is `SameSite=Lax`.
- Rate limits (in-memory, per server instance): 5 messages/minute overall and 3 per recipient per 10 minutes.
  Add an edge/CDN limit for multi-instance deployments.
- Meta's own allow-list restricts test-number recipients; there is no application-level allow-list.

## Webhook

Configure in **Meta app → WhatsApp → Configuration → Webhook**:

- Callback URL: `https://<your-domain>/api/webhooks/whatsapp` (HTTPS and publicly reachable; use a tunnel such
  as ngrok in development)
- Verify token: the value of `WHATSAPP_VERIFY_TOKEN` (use a long random string; Meta sends it verbatim)
- Subscribe to the `messages` field

`GET` answers the `hub.challenge` handshake only when `hub.verify_token` matches (constant-time compare).
`POST` requires a valid `X-Hub-Signature-256` (HMAC-SHA256 of the raw body, keyed with `WHATSAPP_APP_SECRET`);
anything else gets 401 before the body is parsed. Message status updates (`sent`, `delivered`, `read`,
`failed` + error codes) are logged with masked recipients. They are not persisted because the app has no
messaging model yet; add a repository when order notifications need delivery tracking.

## Moving beyond the test number

Production requires a verified business, a real phone number, a permanent system-user token, and approved
templates for business-initiated messages. Add new message types as functions in the feature service that call
`sendWhatsAppMessage`; keep the adapter free of business rules.
