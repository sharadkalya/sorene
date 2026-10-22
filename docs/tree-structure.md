# Tree Structure

This tree reflects what is actually implemented. Generated/build folders (`.next`, `node_modules`) and env files are omitted.

```
sorene/
├── AGENTS.md                     # Root engineering contract for AI agents
├── CLAUDE.md                     # Points to AGENTS.md
├── DEPLOYMENT.md                 # Deployment + environment variable guide
├── MONGODB_SETUP.md              # MongoDB setup notes
├── README.md
├── docs/
│   ├── architecture.md           # Layering, dependency direction, lifecycle
│   ├── tree-structure.md         # This file
│   ├── testing.md                # Test strategy + commands
│   ├── security.md               # Security policy
│   └── models.md                 # Mongoose model field/index reference
├── eslint.config.mjs
├── next.config.ts                # Turbopack root pinned to repo
├── tailwind.config.ts            # Imports THEMES from src/common/themes
├── tsconfig.json
├── vitest.config.ts              # Vitest + coverage config, '@' alias
├── public/
├── resources/
└── src/
    ├── app/                      # Next.js routing only
    │   ├── globals.css           # Tailwind + sorvene theme tokens
    │   ├── layout.tsx            # Root layout; applies theme via service
    │   ├── page.tsx              # Renders BrandPage
    │   ├── (storefront)/         # Customer storefront (route group)
    │   │   ├── layout.tsx        # StoreHeader chrome
    │   │   ├── shop/
    │   │   │   ├── page.tsx              # Faceted listing (shop all)
    │   │   │   ├── collections/          # Collections index + [slug] listing
    │   │   │   ├── categories/           # Categories index + [slug] listing
    │   │   │   └── products/[slug]/      # Product detail
    │   │   └── cart/page.tsx     # Full cart page
    │   ├── admin/
    │   │   ├── login/page.tsx    # Client login form → /api/admin/login
    │   │   └── (protected)/      # Route group guarded server-side
    │   │       ├── layout.tsx    # requireAdminPage() guard + AdminShell
    │   │       ├── page.tsx      # Server: getTheme → AdminDashboard
    │   │       ├── subscribers/page.tsx  # Server: getSubscribers → table
    │   │       └── catalog/      # Categories/collections/products CRUD
    │   └── api/
    │       ├── stay-tuned/route.ts       # Public interest form
    │       ├── settings/route.ts         # GET public / PUT admin
    │       ├── status/r2/route.ts        # Admin R2 health check (upload/delete)
    │       ├── status/whatsapp/route.ts  # Admin WhatsApp test send (hello_world template)
    │       ├── webhooks/whatsapp/route.ts # Meta webhook (verify + signed status updates)
    │       └── admin/
    │           ├── login/route.ts        # Credential check + session
    │           ├── logout/route.ts
    │           ├── subscribers/route.ts  # requireAdminApi guard
    │           ├── media/route.ts        # Admin multi-image upload → R2
    │           └── catalog/              # Admin catalog CRUD (categories/collections/products)
    ├── backend/                  # Business + data + integrations (server-only)
    │   ├── auth/                 # token, session, credentials, requireAdmin, rate-limit
    │   ├── errors.ts             # AppError + HTTP status mapping
    │   ├── http.ts               # jsonError (non-leaking error responses)
    │   ├── features/
    │   │   ├── subscribers/      # types, validation, repository, service
    │   │   ├── settings/         # validation, repository, service
    │   │   ├── catalog/          # types, validation, repository, service, slug
    │   │   └── whatsapp/         # types, validation, service (test send, webhook)
    │   └── integrations/
    │       ├── database/
    │       │   ├── connection.ts         # Shared Mongoose connection
    │       │   └── models/               # Subscriber, SiteSettings, Category, Collection, Product
    │       ├── email/            # email-client + stay-tuned-template
    │       ├── whatsapp/         # Cloud API client + webhook signature check
    │       └── storage/
    │           ├── r2-client.ts          # S3 client for Cloudflare R2
    │           └── r2-storage.ts         # Put/Delete/upload + health check
    ├── common/
    │   ├── env.ts                # Typed env access, fail-fast
    │   └── themes.ts             # Single source of truth for themes
    ├── frontend/
    │   ├── components/           # BrandPage, StayTunedForm, ThemeProvider
    │   ├── features/
    │   │   ├── admin/            # AdminShell, AdminDashboard, SubscribersTable, catalog/*
    │   │   └── storefront/       # StoreHeader, ProductCard, ProductListing, ProductDetail, CartView, TaxonomyGrid
    │   └── store/                # Redux Toolkit (store, hooks, provider, cart slice)
    └── types/
        └── daisyui.d.ts          # Ambient type for daisyui (ships no types)
```

## Notes

- Tests live next to their modules (`*.test.ts` / `*.test.tsx`).
- `src/app/components/`, `src/lib/`, `src/models/`, the `users` CRUD API, and the `test-mongoconnection` page were removed as part of the architectural cleanup (see the migration history / commit).
