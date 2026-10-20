# MongoDB Setup Instructions

The application uses **Mongoose** with a single shared connection managed by
`src/backend/integrations/database/connection.ts`.

## 1. Get your connection string

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Click your cluster's **"Connect"** button → **"Connect your application"** → **"Node.js"**.
3. Copy the connection string and add a database name before the query string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sorvene?retryWrites=true&w=majority
   ```

## 2. Configure `.env.local`

Copy `.env.example` to `.env.local` and set `MONGODB_URI` (plus the other
variables listed in `.env.example`). Then restart the dev server.

## 3. Verify the connection

```bash
yarn dev
```

- The storefront `/` reads the active theme from the `SiteSettings` collection.
- Submitting the stay-tuned form (`POST /api/stay-tuned`) writes a `Subscriber`
  document; admins can review them at `/admin/subscribers`.

## Collections & models

| Collection | Model | Purpose |
| --- | --- | --- |
| `subscribers` | `backend/integrations/database/models/Subscriber.ts` | Stay-tuned interest + discount codes |
| `sitesettings` | `backend/integrations/database/models/SiteSettings.ts` | Active theme |

## Troubleshooting

- **"MONGODB_URI not defined"**: create `.env.local`, set the variable, restart.
- **Connection refused**: check Atlas network access (allow your IP, or `0.0.0.0/0` for serverless).
- **Theme falls back to `sorvene`**: check the connection string and Vercel/Atlas logs; the app deliberately falls back to the default theme instead of crashing.

See `DEPLOYMENT.md` and `docs/security.md` for production guidance.

