# sorene

E-commerce fashion repo built with Next.js.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Prerequisites

This project requires **Node.js >= 20**. Use [nvm](https://github.com/nvm-sh/nvm) to manage your Node.js version:

```bash
nvm use
```

The `.nvmrc` file pins the project to the correct Node.js version. Node version is also enforced when running `npm install` via the `engines` field in `package.json` and `engine-strict=true` in `.npmrc`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

```bash
yarn dev            # start the dev server
yarn build          # production build
yarn start          # serve the production build
yarn lint           # ESLint
yarn typecheck      # TypeScript (tsc --noEmit)
yarn test           # Vitest (run once)
yarn test:watch     # Vitest watch mode
yarn test:coverage  # Vitest coverage report
```

## Engineering standards

AI coding agents must follow `AGENTS.md`. Architecture and conventions are
documented in `docs/architecture.md`, `docs/tree-structure.md`,
`docs/testing.md`, and `docs/security.md`.

## Stack

- **Next.js 16** (App Router, Turbopack), React 19, TypeScript
- **DaisyUI 5 + Tailwind CSS 3** for the UI
- **Mongoose + MongoDB Atlas** for persistence
- **Resend** for transactional email
- **Zod** for validation, **Vitest** for testing

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
