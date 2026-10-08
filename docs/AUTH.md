# Accounts and sessions

- Sign-in uses NextAuth credentials with JWT sessions. Passwords are hashed with bcrypt.
- Registration (`POST /api/register`): email in a valid format (stored lowercase, matched case-insensitively at sign-in), password of 8 to 72 characters with a letter and a digit, name.
- Roles: `USER` (default) and `ADMIN`. Admins manage books and order status; users see only their own orders.
- There is no default admin account. `npm run db:seed` creates one from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- Private pages (`/profile`, `/orders/*`, `/admin`) are protected by `src/middleware.ts`. Guests go to `/login?callbackUrl=...`; non-admins opening `/admin` go to `/`.
- Guest cart: a `bookstore_session_id` cookie identifies a guest cart. After sign-in the login page calls `POST /api/cart/merge`; the higher quantity wins when both carts hold the same book, capped at stock.
- Email verification is enforced only when the app can send email (`SMTP_HOST` is set) or `REQUIRE_EMAIL_VERIFICATION=true`. Otherwise new accounts are verified from the start, so a deployment without a mail server does not lock customers out of checkout. When it is enforced, a new account is unverified. It can browse and fill a cart, but placing an order needs a confirmed address (403 `EMAIL_NOT_VERIFIED`). The link is valid for 24 hours; "Resend email" (profile and checkout) is limited to 3 per hour. Accounts that existed before this feature count as verified.
- Password reset: `/forgot-password` always gives the same answer, so it cannot be used to find out who has an account. The link works once, expires after 30 minutes and is replaced by any newer link. Following it also confirms the email address and lifts a sign-in lock.
- Lockout: 5 wrong passwords within 10 minutes lock the account for 15 minutes. While locked even the correct password is refused. Stored in the database, so it holds across server instances.
- Other limits (per server instance): 20 registrations per hour per address; 5 reset requests per hour per address and client. Set `RATE_LIMIT_DISABLED=true` in test environments (this does not switch off the lockout).
- Checkout needs an account: guests are redirected to sign in and return to checkout.

## Email

Every email is saved in the `email_outbox` table and, when `SMTP_HOST` is set, sent with SMTP (`SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). Without SMTP the message only stays in the table (and is printed outside production). **A deployment without SMTP settings cannot deliver verification or reset links.** For local work, Mailpit from `docker-compose.yml` catches mail on port 1025 (web view on 8025). Tests read the outbox through `GET /api/test/emails`.

## Set a password hash by hand

`scripts/hash-password.ts` prints a bcrypt hash for a password if you need to insert a user directly.

## Deactivated accounts and role changes

Admins can deactivate an account (`PATCH /api/admin/users/{id}` with `active: false`). A deactivated user cannot sign in
(the message "This account is deactivated" is shown only after a correct password, so it does not reveal which emails
have accounts) and a session they already have stops working on the next request. Role changes also apply on the next
request, even though the session token still carries the old role. Admins cannot change or deactivate their own account.
