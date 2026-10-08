# Accounts and sessions

- Sign-in uses NextAuth credentials with JWT sessions. Passwords are hashed with bcrypt.
- Registration (`POST /api/register`): email in a valid format (stored lowercase, matched case-insensitively at sign-in), password of 8 to 72 characters with a letter and a digit, name.
- Roles: `USER` (default) and `ADMIN`. Admins manage books and order status; users see only their own orders.
- There is no default admin account. `npm run db:seed` creates one from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- Private pages (`/profile`, `/orders/*`, `/admin`) are protected by `src/middleware.ts`. Guests go to `/login?callbackUrl=...`; non-admins opening `/admin` go to `/`.
- Guest cart: a `bookstore_session_id` cookie identifies a guest cart. After sign-in the login page calls `POST /api/cart/merge`; the higher quantity wins when both carts hold the same book, capped at stock.
- Limits (per server instance): 20 registrations per hour per address; 10 failed sign-ins in 10 minutes per address and email. Set `RATE_LIMIT_DISABLED=true` in test environments.

## Set a password hash by hand

`scripts/hash-password.ts` prints a bcrypt hash for a password if you need to insert a user directly.
