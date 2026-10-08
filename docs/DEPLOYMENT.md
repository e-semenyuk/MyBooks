# Deployment (Vercel + Supabase)

## First deployment

1. Create a Supabase project and copy the pooled connection string.
2. Import the repository into Vercel. The build command in `vercel.json` runs `prisma generate && next build`.
3. Add environment variables in Vercel: `POSTGRES_PRISMA_URL`, `NEXTAUTH_URL` (the public URL) and `NEXTAUTH_SECRET`. Do not set `ENABLE_TEST_ENDPOINTS` or `RATE_LIMIT_DISABLED`.
4. Create the tables: `npx prisma migrate deploy` with `POSTGRES_PRISMA_URL` pointing at Supabase.
5. Create the first admin. The seed wipes all data, so for a live database insert the admin yourself: generate a hash with `npx tsx scripts/hash-password.ts <password>` and insert a row into `users` with role `ADMIN`.

## Database that was created before migrations existed

The first Supabase database was built from hand-run SQL scripts. Mark the baseline as already applied once, then deploy the rest:

```bash
npx prisma migrate resolve --applied 0_init
npx prisma migrate deploy
```

Later migrations convert prices to cents, make order status an enum, add cart owners and order history, and clean up duplicate or orphan cart rows.

## Every later release

Migrations run automatically. The Vercel build command is `prisma generate && tsx scripts/migrate-deploy.ts && next build`:

- On production deployments it applies pending migrations over a direct database connection (`POSTGRES_URL_NON_POOLING` if set, otherwise your pooled URL on port 5432 without pgbouncer).
- Preview deployments skip migrations so they cannot change the shared database.
- If a migration fails, the build fails and the previous version keeps serving traffic.
- Write migrations so the previous version of the code still works while they run (add tables and columns first; remove old ones in a later release).

After a deploy, check `GET /api/health` and `GET /api/books`.

## Troubleshooting

- Build fails: check that `POSTGRES_PRISMA_URL` is set for the build and run `npm run build` locally.
- Sign-in does not work: `NEXTAUTH_SECRET` and `NEXTAUTH_URL` must be set.
- No books: run the migrations and add data; the seed is for local and test databases only.
