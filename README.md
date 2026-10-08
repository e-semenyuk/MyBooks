# NextBookstore

Digital bookstore built with Next.js 14 (App Router), TypeScript, Prisma and PostgreSQL. It is the demo application for an AI-driven software lifecycle: Jira project XPANBFLFA holds the backlog, and the companion `test-automation-framework` repository holds the Playwright tests.

## What it does

- Browse and search books by title, author or ISBN
- Guest cart that follows you into your account at sign-in; stock is checked when you add items
- Checkout creates an order (status flow PENDING → CONFIRMED → SHIPPED → DELIVERED, or CANCELLED) and reduces stock
- Accounts with roles USER and ADMIN; order history and order detail with status history
- Admin page for books and orders
- Every page has its own URL; private pages redirect guests to the login page

## Stack

Next.js 14, React 18, TypeScript, Tailwind CSS, Prisma 5 with PostgreSQL, NextAuth (credentials, JWT sessions), zod, Vitest. Deployed on Vercel with Supabase as the database.

## Run it locally

You need Node.js 18.17 or newer and Docker.

```bash
npm install
cp .env.example .env.local        # then fill in NEXTAUTH_SECRET and ADMIN_PASSWORD
docker compose up -d              # PostgreSQL on port 5433 and Mailpit (mail UI on 8025)
npx prisma migrate deploy         # create the tables
npm run db:seed                   # fixed demo data; wipes everything first
npm run dev                       # http://localhost:3000
```

`.env.example` points at the local Docker database. Never point a local run at the deployed Supabase database, because the seed deletes all data.

### Environment variables

| Name | Purpose |
|------|---------|
| `POSTGRES_PRISMA_URL` | Database connection string |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | NextAuth. The secret is required (`openssl rand -base64 32`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin account created by the seed. No default password exists |
| `USER_EMAIL`, `USER_PASSWORD` | Optional regular user created by the seed (set both or neither) |
| `ENABLE_TEST_ENDPOINTS`, `TEST_SECRET` | Turn on `/api/test/*` for test environments (secret of at least 16 characters) |
| `RATE_LIMIT_DISABLED` | `true` in test environments so repeated sign-ins are not throttled |
| `SMTP_HOST`, `SMTP_PORT` | Mail server (used by later features) |

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | Vitest unit tests |
| `npm run lint`, `npx tsc --noEmit` | Lint and type check |
| `npm run db:seed` | Wipe and load the fixed data set |
| `npm run db:reset` | Recreate the database from migrations |
| `npm run openapi` | Regenerate `docs/openapi.json` after API changes (a test fails when it is stale) |

## API

The REST API is described in [docs/openapi.json](docs/openapi.json) and served at `/api/openapi`. Errors always look like `{ "error": "message", "code": "STABLE_CODE" }`. Prices are dollars with two decimals; the database stores integer cents.

## Test support

For automated tests: `GET /api/health`, and, when `ENABLE_TEST_ENDPOINTS=true` and the header `x-test-secret` matches `TEST_SECRET`, `POST /api/test/reset` and `POST /api/test/seed`. Without the flag and secret these return 404, and they never run on a Vercel production deployment. UI elements carry stable `data-testid` values listed in [TEST_IDS_REFERENCE.md](TEST_IDS_REFERENCE.md).

## More

- [docs/AUTH.md](docs/AUTH.md): accounts, roles, sessions, limits
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Supabase, Vercel and migrations
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md): history of the move from the original Java application

## Project layout

```
prisma/               schema, migrations, seed script
src/app/              pages (routes) and API routes
src/components/       page components, navigation, providers
src/lib/              services, validation, API helpers, money and status rules, test support
src/middleware.ts     redirects guests away from private pages
docs/openapi.json     generated API description
```
