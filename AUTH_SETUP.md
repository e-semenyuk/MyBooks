# Authentication Setup Guide

## ✅ What's Been Implemented

### 1. User Authentication System
- **NextAuth.js** integration with credentials provider
- **User Registration** - New users can create accounts
- **Login/Logout** - Secure authentication flow
- **Password Hashing** - Using bcryptjs for security
- **Session Management** - JWT-based sessions

### 2. User Roles
- **USER** - Default role for registered users
- **ADMIN** - Administrative access

### 3. Database Schema Updates
- Added `User` model with role support
- Added `UserRole` enum (USER, ADMIN)
- Linked `Order` model to `User` (optional userId field)
- Proper indexes and foreign keys

### 4. UI Components
- **LoginPage** - Modern login interface
- **RegisterPage** - User registration form
- **Navigation** - Shows auth status, login/logout buttons
- **Role-based UI** - Admin button only shown to admins

### 5. API Routes
- `/api/auth/[...nextauth]` - NextAuth authentication
- `/api/register` - User registration endpoint

## 🔧 Setup Required

### Step 1: Update Supabase Database

Run the updated `setup-database.sql` file in your Supabase SQL Editor to add:
- UserRole enum type
- users table
- Updated orders table with userId field
- Default admin user

**Default Admin Credentials:**
- Email: `admin@bookstore.com`
- Password: `admin123`

### Step 2: Add Environment Variable (Optional)

Add to your `.env.local`:
```
NEXTAUTH_SECRET=your-secret-key-here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

**Note:** This is optional for local development but REQUIRED for production.

### Step 3: Test the Authentication

1. **Start the dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Click "Login"** in the navigation

3. **Test Admin Login:**
   - Email: `admin@bookstore.com`
   - Password: `admin123`

4. **Test User Registration:**
   - Click "Register here"
   - Fill in your details
   - Create a new account

## 🎯 Features Available

### For All Users:
- ✅ Browse books
- ✅ Add to cart
- ✅ Place orders (guest or authenticated)
- ✅ User registration
- ✅ Login/Logout

### For Authenticated Users:
- ✅ Orders linked to user account
- 🔜 View order history (coming soon)
- 🔜 Profile management (coming soon)

### For Admins:
- 🔜 Manage books (add, edit, delete) - coming soon
- 🔜 View all orders - coming soon
- 🔜 Mark orders as fulfilled - coming soon
- 🔜 User management - coming soon

## 📋 Next Steps (To Be Implemented)

1. **Admin Dashboard**
   - Book management (CRUD operations)
   - Order management
   - Mark orders as fulfilled

2. **User Profile Page**
   - View order history
   - Update profile details
   - Change password

3. **Role-Based Access Control**
   - Protect admin API routes
   - Middleware for route protection

4. **Enhanced Features**
   - Email verification
   - Password reset
   - OAuth providers (Google, GitHub)

## 🔐 Security Features

- ✅ Password hashing with bcrypt (cost factor 10)
- ✅ HTTP-only cookies for sessions
- ✅ Secure session tokens (JWT)
- ✅ CSRF protection (built into NextAuth)
- ✅ Input validation on registration

## 📝 Database Structure

### users table
```sql
id            SERIAL PRIMARY KEY
email         TEXT UNIQUE NOT NULL
password      TEXT NOT NULL
name          TEXT NOT NULL
role          UserRole DEFAULT 'USER'
createdAt     TIMESTAMP DEFAULT NOW()
updatedAt     TIMESTAMP DEFAULT NOW()
```

### orders table (updated)
```sql
-- Added field:
userId        INTEGER (references users.id)
```

## 🚀 Deployment Notes

For Vercel deployment:

1. Add `NEXTAUTH_SECRET` environment variable in Vercel dashboard
2. Add `NEXTAUTH_URL` pointing to your production URL
3. Re-run database migration in production Supabase instance

```
NEXTAUTH_SECRET=<your-secret-here>
NEXTAUTH_URL=https://your-app.vercel.app
```

## 📚 Resources

- [NextAuth.js Docs](https://next-auth.js.org/)
- [Prisma Docs](https://www.prisma.io/docs)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)

