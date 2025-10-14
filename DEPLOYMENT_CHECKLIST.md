# Deployment Checklist

Use this checklist to deploy your Next.js Bookstore to Vercel + Supabase.

## Phase 1: Supabase Setup (5 minutes)

### Step 1.1: Create Supabase Account
- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Sign up with GitHub account (recommended)

### Step 1.2: Create New Project
- [ ] Click "New Project"
- [ ] Choose/create an organization
- [ ] Fill in project details:
  - [ ] Project name: `bookstore` (or your choice)
  - [ ] Database password: Choose a strong password **SAVE THIS!**
  - [ ] Region: Choose closest to your users
- [ ] Click "Create new project"
- [ ] Wait ~2 minutes for project to initialize

### Step 1.3: Get Database Connection String
- [ ] Go to Settings (⚙️ icon in sidebar)
- [ ] Click "Database"
- [ ] Scroll to "Connection string"
- [ ] Select "Connection pooling" tab
- [ ] Copy the connection string
- [ ] Replace `[YOUR-PASSWORD]` with your actual password
- [ ] Save this for later (e.g., in a password manager)

Example format:
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Phase 2: GitHub Setup (2 minutes)

### Step 2.1: Initialize Git (if not already done)
- [ ] Open terminal in NextBookstore directory
- [ ] Run: `git init`
- [ ] Run: `git add .`
- [ ] Run: `git commit -m "Initial commit - Next.js Bookstore"`

### Step 2.2: Create GitHub Repository
- [ ] Go to [github.com/new](https://github.com/new)
- [ ] Repository name: `nextjs-bookstore` (or your choice)
- [ ] Make it Public or Private
- [ ] **Do NOT** initialize with README (we already have one)
- [ ] Click "Create repository"

### Step 2.3: Push to GitHub
- [ ] Copy the commands from GitHub (should look like):
```bash
git remote add origin https://github.com/YOUR-USERNAME/nextjs-bookstore.git
git branch -M main
git push -u origin main
```
- [ ] Run these commands in your terminal
- [ ] Refresh GitHub page to see your code

## Phase 3: Vercel Deployment (3 minutes)

### Step 3.1: Create Vercel Account
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Click "Sign Up"
- [ ] Choose "Continue with GitHub"
- [ ] Authorize Vercel

### Step 3.2: Import Project
- [ ] Click "Add New..." → "Project"
- [ ] Find your `nextjs-bookstore` repository
- [ ] Click "Import"

### Step 3.3: Configure Project
- [ ] Framework Preset: Should auto-detect "Next.js" ✅
- [ ] Root Directory: `./` (leave as is)
- [ ] Build Command: `prisma generate && next build`
- [ ] Output Directory: `.next` (leave as is)
- [ ] Install Command: `npm install`

### Step 3.4: Add Environment Variables
- [ ] Click "Environment Variables"
- [ ] Add variable:
  - **Name**: `DATABASE_URL`
  - **Value**: (paste your Supabase connection string from Step 1.3)
  - **Environment**: Select all (Production, Preview, Development)
- [ ] Click "Add"

### Step 3.5: Deploy!
- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes for build
- [ ] Click on the preview image to open your deployed site

🎉 Your site is now live at `https://your-project.vercel.app`!

## Phase 4: Database Initialization (3 minutes)

Your app is deployed, but the database is empty. Let's fix that!

### Step 4.1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 4.2: Link Your Project
```bash
cd NextBookstore
vercel link
```
- [ ] Follow prompts to link to your deployed project

### Step 4.3: Pull Environment Variables
```bash
vercel env pull .env.local
```
This downloads your `DATABASE_URL` from Vercel.

### Step 4.4: Initialize Database Schema
```bash
npx prisma db push
```
This creates all tables in your Supabase database.

### Step 4.5: Seed Database with Sample Data
```bash
npm run db:seed
```
This adds 5 sample books.

### Step 4.6: Verify
- [ ] Open your deployed site: `https://your-project.vercel.app`
- [ ] You should see 5 books on the home page
- [ ] Try adding a book to cart
- [ ] Try searching for a book
- [ ] Try placing an order

## Phase 5: Custom Domain (Optional)

### If You Have a Custom Domain
- [ ] Go to your Vercel project → Settings → Domains
- [ ] Add your domain (e.g., `bookstore.yourdomain.com`)
- [ ] Follow Vercel's DNS instructions
- [ ] Wait for DNS propagation (~10 minutes)

## Troubleshooting

### ❌ Build Failed
**Error**: "Cannot find module '@prisma/client'"
- **Fix**: Make sure build command includes `prisma generate`
- Go to Project Settings → General → Build Command
- Set to: `prisma generate && next build`

**Error**: "Database connection failed"
- **Fix**: Check DATABASE_URL environment variable
- Make sure you used the **pooling** connection string (port 6543)
- Verify password is correct

### ❌ No Books Showing
**Problem**: Site loads but no books appear
- **Fix**: You forgot to seed the database
- Run: `npx prisma db push && npm run db:seed`

### ❌ Cart Not Working
**Problem**: Items don't stay in cart
- **Fix**: This is normal - sessions are per-browser
- For production, consider adding user authentication

## Post-Deployment

### Monitor Your App
- [ ] Check Vercel dashboard for build status
- [ ] Monitor Supabase dashboard for database usage
- [ ] Test all features on production

### Optional Enhancements
- [ ] Set up custom domain
- [ ] Add authentication (e.g., with Supabase Auth)
- [ ] Set up analytics (e.g., Vercel Analytics)
- [ ] Add error monitoring (e.g., Sentry)
- [ ] Set up automated backups in Supabase

### Free Tier Limits
**Vercel Free Tier:**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless function executions

**Supabase Free Tier:**
- ✅ 500 MB database space
- ✅ 2 GB bandwidth/month
- ✅ 50,000 monthly active users

These limits are MORE than enough for a demo/portfolio project!

## Maintenance

### Updating Your App
```bash
# 1. Make changes locally
# 2. Test with: npm run dev
# 3. Commit and push
git add .
git commit -m "Your changes"
git push

# 4. Vercel auto-deploys! 🎉
```

### Viewing Logs
- [ ] Vercel Dashboard → Your Project → Deployments → Click deployment → View Logs
- [ ] Supabase Dashboard → Your Project → Database → Logs

### Database Backup
- [ ] Supabase Dashboard → Your Project → Settings → Database → Backups
- [ ] Enable daily backups (available on Pro plan)

## Support

If you run into issues:

1. **Check the logs**:
   - Vercel: Project → Deployments → Logs
   - Supabase: Project → Database → Logs

2. **Common fixes**:
   - Redeploy: Vercel Dashboard → Deployments → ... → Redeploy
   - Reset database: `npx prisma migrate reset` (⚠️ deletes data!)

3. **Documentation**:
   - [Vercel Docs](https://vercel.com/docs)
   - [Supabase Docs](https://supabase.com/docs)
   - [Next.js Docs](https://nextjs.org/docs)
   - [Prisma Docs](https://www.prisma.io/docs)

## Success Checklist

- [ ] ✅ Supabase project created
- [ ] ✅ Database connection string saved
- [ ] ✅ Code pushed to GitHub
- [ ] ✅ Vercel project deployed
- [ ] ✅ Environment variables configured
- [ ] ✅ Database schema created
- [ ] ✅ Sample data seeded
- [ ] ✅ App accessible online
- [ ] ✅ All features tested
- [ ] ✅ Custom domain configured (optional)

## 🎉 Congratulations!

Your Next.js Bookstore is now live on the internet! Share it:
- Portfolio: Add to your portfolio/resume
- LinkedIn: Post about your project
- Twitter: Share your achievement
- GitHub: Add badges to README

**Your deployed app**: `https://your-project.vercel.app`

---

Need help? Check [README.md](./README.md) or [QUICKSTART.md](./QUICKSTART.md)!

