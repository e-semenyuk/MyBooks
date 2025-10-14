# Next.js Digital Bookstore

A modern, full-stack digital bookstore application built with Next.js 14, TypeScript, Prisma, and designed for deployment on Vercel with Supabase PostgreSQL.

## 🚀 Features

- **Browse Books**: Search and filter through a catalog of books
- **Shopping Cart**: Add books to cart with session-based persistence
- **Checkout**: Complete orders with customer information
- **Admin Panel**: Add new books to the catalog
- **Responsive Design**: Beautiful UI built with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **Database ORM**: Prisma for type-safe database access
- **API Routes**: RESTful API built with Next.js API routes

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Vercel
- **Session Management**: Cookie-based sessions with UUID

## 📋 Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn
- A Supabase account (free tier works)
- A Vercel account (free tier works)

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
cd /path/to/AISDLC/NextBookstore
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

For local development with a local PostgreSQL:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/bookstore"
```

Or use Supabase connection string (see Supabase setup below).

### 4. Set Up the Database

Generate Prisma client:
```bash
npx prisma generate
```

Run migrations:
```bash
npx prisma migrate dev --name init
```

Seed the database with sample data:
```bash
npm run db:seed
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Create a new project
   - Choose a name
   - Set a strong database password (save this!)
   - Select a region close to your users

### 2. Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** → **Connection pooling**
3. Copy the connection string (it looks like this):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual database password

### 3. Configure Environment Variable

Add to your `.env.local`:
```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 4. Push Database Schema to Supabase

```bash
npx prisma db push
```

### 5. Seed the Database

```bash
npm run db:seed
```

## 🚀 Deployment to Vercel

### 1. Push to GitHub

Make sure your code is in a GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Import Project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure your project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or `NextBookstore` if not at root)
   - **Build Command**: Leave default or use `prisma generate && next build`
   - **Output Directory**: `.next`

### 3. Add Environment Variables

In Vercel project settings → Environment Variables, add:

```
DATABASE_URL = postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Important**: Make sure to add this to all environments (Production, Preview, Development)

### 4. Deploy

Click **"Deploy"** and Vercel will:
1. Install dependencies
2. Generate Prisma client
3. Build your Next.js application
4. Deploy it to a global CDN

### 5. Set Up Database (First Deployment)

After the first deployment, you need to initialize your database:

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Link your project:
   ```bash
   vercel link
   ```

3. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

4. Run migrations and seed:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

Your app should now be live at `https://your-app-name.vercel.app`!

## 📁 Project Structure

```
NextBookstore/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seed data
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── books/
│   │   │   ├── cart/
│   │   │   └── orders/
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   │   ├── pages/         # Page components
│   │   ├── BookCard.tsx
│   │   ├── Navigation.tsx
│   │   └── Toast.tsx
│   ├── lib/
│   │   ├── prisma.ts      # Prisma client
│   │   ├── session.ts     # Session management
│   │   └── services/      # Business logic
│   └── types/
│       └── index.ts       # TypeScript types
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run Prisma migrations (development)
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio (database GUI)

## 🌐 API Endpoints

### Books
- `GET /api/books` - Get all books
- `GET /api/books?query=searchterm` - Search books
- `GET /api/books/[id]` - Get book by ID
- `POST /api/books` - Create new book
- `PUT /api/books/[id]` - Update book
- `DELETE /api/books/[id]` - Delete book

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/[id]` - Update cart item quantity
- `DELETE /api/cart/[id]` - Remove item from cart
- `DELETE /api/cart` - Clear cart
- `GET /api/cart/total` - Get cart total

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders?email=user@example.com` - Get orders by email
- `GET /api/orders?status=CONFIRMED` - Get orders by status
- `GET /api/orders/[id]` - Get order by ID
- `POST /api/orders` - Create new order

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |

## 🐛 Troubleshooting

### Database Connection Issues

If you see "Can't reach database server" errors:
1. Check your `DATABASE_URL` is correct
2. Make sure you're using the **connection pooling** URL from Supabase (port 6543, not 5432)
3. Verify your database password is correct
4. Check if your IP is allowed in Supabase (usually all IPs are allowed by default)

### Prisma Migration Errors

If migrations fail:
```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Or push schema directly
npx prisma db push
```

### Vercel Build Failures

If build fails on Vercel:
1. Check that `DATABASE_URL` is set in environment variables
2. Make sure the build command includes `prisma generate`
3. Check build logs for specific errors

## 📝 Migration from Java Spring Boot

This application is a modern rewrite of a Java Spring Boot bookstore. Key differences:

- **Frontend**: Vanilla JavaScript → React with TypeScript
- **Backend**: Spring Boot → Next.js API Routes
- **Database**: H2 (in-memory) → PostgreSQL (Supabase)
- **ORM**: JPA/Hibernate → Prisma
- **Deployment**: Traditional server → Serverless (Vercel)
- **Session**: HTTP Session → Cookie-based UUID sessions

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📄 License

This project is created for educational purposes.

## 🤝 Contributing

This is a demonstration project, but feel free to fork and modify for your own use!

---

**Happy Coding! 🎉**

