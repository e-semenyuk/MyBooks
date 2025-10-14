# Quick Start Guide

Get your Next.js bookstore running in 5 minutes!

## Option 1: Local Development (Fastest)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment (for local PostgreSQL)
echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/bookstore"' > .env.local

# 3. Initialize database
npx prisma migrate dev --name init
npm run db:seed

# 4. Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Note**: Requires PostgreSQL running locally. If you don't have it, use Option 2 (Supabase).

## Option 2: With Supabase (Recommended for Production)

```bash
# 1. Install dependencies
npm install

# 2. Create a Supabase project at https://supabase.com
#    - Note your project URL and database password

# 3. Get connection string from Supabase Dashboard
#    Settings → Database → Connection string (Connection pooling)
#    It looks like: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...

# 4. Create .env.local with your Supabase URL
echo 'DATABASE_URL="your-supabase-connection-string"' > .env.local

# 5. Push schema to Supabase
npx prisma db push

# 6. Seed the database
npm run db:seed

# 7. Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel (2 minutes)

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push

# 2. Go to https://vercel.com
#    - Click "New Project"
#    - Import your GitHub repo
#    - Add DATABASE_URL environment variable
#    - Deploy!

# 3. After first deployment, initialize database
vercel env pull .env.local
npx prisma db push
npm run db:seed
```

Your app is now live! 🎉

## Troubleshooting

### "Can't reach database server"
- Check `DATABASE_URL` in `.env.local`
- For Supabase, use the **pooling** connection string (port 6543)

### "Table does not exist"
```bash
npx prisma db push
npm run db:seed
```

### TypeScript errors
```bash
npx prisma generate
```

### Start fresh
```bash
rm -rf node_modules .next
npm install
npx prisma generate
```

## What's Next?

1. Browse books at [http://localhost:3000](http://localhost:3000)
2. Add books to cart
3. Go to Admin panel to add new books
4. Complete a checkout to test orders

Check out the [README.md](./README.md) for full documentation!

