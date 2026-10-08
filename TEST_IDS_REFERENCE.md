# Test IDs Reference

This document provides a comprehensive list of all `data-testid` attributes used in the application for automated testing.

## Navigation Component

| Test ID | Element | Description |
|---------|---------|-------------|
| `main-navigation` | `<nav>` | Main navigation bar |
| `nav-logo-button` | `<button>` | Logo/home link button |
| `nav-home-button` | `<button>` | Home navigation button |
| `nav-cart-button` | `<button>` | Cart navigation button |
| `cart-count-badge` | `<span>` | Cart item count badge |
| `nav-admin-button` | `<button>` | Admin panel button (admins only) |
| `nav-profile-button` | `<button>` | Profile button (logged in users) |
| `nav-logout-button` | `<button>` | Logout button (logged in users) |
| `nav-login-button` | `<button>` | Login button (guests) |
| `nav-loading` | `<div>` | Loading indicator for auth status |

## BookCard Component

| Test ID | Element | Description |
|---------|---------|-------------|
| `book-card-{id}` | `<div>` | Book card container (dynamic ID) |
| `book-stock-badge-{id}` | `<div>` | Stock status badge (dynamic ID) |
| `book-title-{id}` | `<h3>` | Book title (dynamic ID) |
| `book-author-{id}` | `<p>` | Book author (dynamic ID) |
| `book-price-{id}` | `<p>` | Book price (dynamic ID) |
| `book-stock-{id}` | `<p>` | Stock quantity (dynamic ID) |
| `add-to-cart-button-{id}` | `<button>` | Add to cart button (dynamic ID) |

## HomePage

| Test ID | Element | Description |
|---------|---------|-------------|
| `home-page` | `<div>` | Home page container |
| `search-section` | `<div>` | Hero search section |
| `search-form` | `<form>` | Search form |
| `search-input` | `<input>` | Search text input |
| `search-submit-button` | `<button>` | Search submit button |
| `books-loading` | `<div>` | Books loading state |
| `no-books-message` | `<div>` | No books found message |
| `view-all-books-button` | `<button>` | View all books button |
| `books-count` | `<h3>` | Books count header |
| `clear-search-button` | `<button>` | Clear search button |
| `books-grid` | `<div>` | Books grid container |

## CartPage

| Test ID | Element | Description |
|---------|---------|-------------|
| `cart-page` | `<div>` | Cart page container |
| `cart-loading` | `<div>` | Cart loading state |
| `empty-cart-message` | `<div>` | Empty cart message |
| `browse-books-button` | `<button>` | Browse books button (empty cart) |
| `cart-items-list` | `<div>` | Cart items container |
| `cart-item-{id}` | `<div>` | Individual cart item (dynamic ID) |
| `cart-item-quantity-{id}` | `<input>` | Quantity input (dynamic ID) |
| `cart-item-subtotal-{id}` | `<div>` | Item subtotal (dynamic ID) |
| `remove-cart-item-{id}` | `<button>` | Remove item button (dynamic ID) |
| `order-summary` | `<div>` | Order summary panel |
| `cart-total` | `<span>` | Cart total amount |
| `proceed-to-checkout-button` | `<button>` | Proceed to checkout button |
| `continue-shopping-button` | `<button>` | Continue shopping button |

## CheckoutPage

Checkout needs an account: guests who open `/checkout` are sent to `/login?callbackUrl=/checkout`.

| Test ID | Element | Description |
|---------|---------|-------------|
| `checkout-page` | `<div>` | Page container |
| `checkout-form` | `<form>` | Whole form including the summary |
| `checkout-name-input` | `<input>` | Full name (prefilled from the account) |
| `checkout-email-input` | `<input>` | Email (prefilled) |
| `checkout-address-input` | `<textarea>` | Delivery address |
| `shipping-options` | `<fieldset>` | Shipping choices |
| `shipping-standard` | `<input radio>` | Standard: $4.99, free from $50.00 after discount |
| `shipping-express` | `<input radio>` | Express: $14.99, never free |
| `promo-input` | `<input>` | Promo code (case-insensitive) |
| `promo-apply-button` | `<button>` | Check and apply the code |
| `promo-error` | `<p>` | "not valid", "has expired" or "has been used up" |
| `promo-applied` | `<div>` | Shown while a code is applied |
| `promo-remove-button` | `<button>` | Remove the applied code |
| `checkout-summary` | `<aside>` | Totals panel |
| `summary-subtotal` | `<dd>` | Items total |
| `summary-discount` | `<dd>` | Shown only when a code gives a discount, as `-$x.xx` |
| `summary-shipping` | `<dd>` | Amount, or "Free" |
| `summary-tax` | `<dd>` | 8% of the discounted subtotal (`TAX_RATE`) |
| `summary-total` | `<dd>` | subtotal - discount + shipping + tax |
| `checkout-empty` | `<p>` | Shown when the cart is empty; Place Order is disabled |
| `back-to-cart-button` | `<button>` | Back to the cart |
| `place-order-button` | `<button>` | Place the order |

Seeded promo codes: `WELCOME10` (10% off), `SAVE5` ($5 off), `HALFOFF` (50% off), `ONCEONLY` (20% off, one use), `EXPIRED10` (expired), `DISABLED5` (inactive).

Order detail also shows `order-detail-breakdown`, `order-detail-subtotal`, `order-detail-discount`, `order-detail-shipping` and `order-detail-tax`.

## LoginPage

| Test ID | Element | Description |
|---------|---------|-------------|
| `login-page` | `<div>` | Login page container |
| `login-form` | `<form>` | Login form |
| `login-email-input` | `<input>` | Email input |
| `login-password-input` | `<input>` | Password input |
| `login-submit-button` | `<button>` | Login submit button |
| `switch-to-register-button` | `<button>` | Switch to register link |

## RegisterPage

| Test ID | Element | Description |
|---------|---------|-------------|
| `register-page` | `<div>` | Register page container |
| `register-form` | `<form>` | Registration form |
| `register-name-input` | `<input>` | Full name input |
| `register-email-input` | `<input>` | Email input |
| `register-password-input` | `<input>` | Password input |
| `register-confirm-password-input` | `<input>` | Confirm password input |
| `register-submit-button` | `<button>` | Register submit button |
| `switch-to-login-button` | `<button>` | Switch to login link |

## AdminPage

| Test ID | Element | Description |
|---------|---------|-------------|
| `admin-page` | `<div>` | Admin page container |
| `admin-access-denied` | `<div>` | Shown to signed-in users who are not admins |
| `admin-books-tab` | `<button>` | Books tab button |
| `admin-orders-tab` | `<button>` | Orders tab button |
| `admin-book-form` | `<form>` | Book add/edit form |
| `admin-book-title-input` | `<input>` | Book title input |
| `admin-book-author-input` | `<input>` | Book author input |
| `admin-book-isbn-input` | `<input>` | Book ISBN input |
| `admin-book-price-input` | `<input>` | Book price input |
| `admin-book-stock-input` | `<input>` | Book stock input |
| `admin-book-description-input` | `<textarea>` | Book description input |
| `admin-save-book-button` | `<button>` | Save/update book button |
| `admin-cancel-edit-button` | `<button>` | Cancel edit button |
| `admin-books-list` | `<div>` | Books list container |
| `admin-book-item-{id}` | `<div>` | Book item in list (dynamic ID) |
| `admin-edit-book-{id}` | `<button>` | Edit book button (dynamic ID) |
| `admin-delete-book-{id}` | `<button>` | Delete book button (dynamic ID) |
| `admin-orders-section` | `<div>` | Orders section container |
| `admin-orders-loading` | `<div>` | Orders loading state |
| `admin-no-orders` | `<div>` | No orders message |
| `admin-orders-list` | `<div>` | Orders list container |
| `admin-order-item-{id}` | `<div>` | Order item in list (dynamic ID) |
| `admin-order-status-{id}` | `<select>` | Order status dropdown (dynamic ID) |

## ProfilePage

| Test ID | Element | Description |
|---------|---------|-------------|
| `profile-page` | `<div>` | Profile page container |
| `profile-login-required` | `<div>` | Shown instead of the profile when nobody is signed in |
| `profile-header` | `<div>` | Profile header section |
| `order-history-section` | `<div>` | Order history section |
| `profile-orders-loading` | `<div>` | Orders loading state |
| `profile-no-orders` | `<div>` | No orders message |
| `profile-orders-list` | `<div>` | Orders list container |
| `profile-order-item-{id}` | `<div>` | Order item (dynamic ID) |
| `profile-order-view-{id}` | `<a>` | Link from the order list to `/orders/{id}` |

## OrderDetailPage (`/orders/{id}`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `order-detail-page` | `<div>` | Page container |
| `order-detail-loading` | `<div>` | Loading state |
| `order-detail-not-found` | `<div>` | Shown for unknown orders and orders of other users |
| `order-detail-back-button` | `<a>` | Back to the profile |
| `order-detail-title` | `<h2>` | "Order #id" |
| `order-detail-status` | `<span>` | Current status (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED) |
| `order-detail-customer` | `<p>` | Customer name and email |
| `order-detail-address` | `<p>` | Delivery address |
| `order-detail-items` | `<div>` | Items container |
| `order-detail-item-{bookId}` | `<div>` | One order line |
| `order-detail-history` | `<div>` | Status history container |
| `order-detail-history-{eventId}` | `<li>` | One status change |
| `order-detail-total` | `<span>` | Order total |

## Error and not-found pages

| Test ID | Element | Description |
|---------|---------|-------------|
| `not-found-page` | `<div>` | Unknown URL |
| `not-found-home-link` | `<a>` | Link back to the store |
| `error-page` | `<div>` | Unexpected error screen |
| `error-retry-button` | `<button>` | Try again |
| `page-loading` | `<div>` | Route loading state |

## Routes

| Path | Page | Access |
|------|------|--------|
| `/` | HomePage | public |
| `/cart` | CartPage | public |
| `/checkout` | CheckoutPage | public |
| `/login` (`?callbackUrl=/path`) | LoginPage | public |
| `/register` | RegisterPage | public |
| `/profile` | ProfilePage | signed in |
| `/orders/{id}` | OrderDetailPage | signed in, owner or admin |
| `/admin` | AdminPage | admin (others are sent to `/`) |

Guests opening a private page are redirected to `/login?callbackUrl=<page>` and return there after signing in.

## Catalog filters and pagination (home page)

State is kept in the URL: `?query=&category=&author=&minPrice=&maxPrice=&sort=&page=`.

| Test ID | Element | Description |
|---------|---------|-------------|
| `filters-panel` | `<section>` | Filters container |
| `category-chips` | `<div>` | Category chip row |
| `category-chip-all` | `<button>` | Show every category |
| `category-chip-{slug}` | `<button>` | One category, for example `category-chip-science-fiction`; text includes the book count |
| `filter-author-input` | `<input>` | Author contains (applied with the Apply button) |
| `filter-min-price-input` | `<input>` | Minimum price in dollars |
| `filter-max-price-input` | `<input>` | Maximum price in dollars |
| `sort-select` | `<select>` | `title`, `price_asc`, `price_desc`, `newest`; applies immediately |
| `filters-apply-button` | `<button>` | Apply author and price filters |
| `filters-clear-button` | `<button>` | Remove every filter (shown only when one is active) |
| `pagination` | `<nav>` | Hidden when there is one page only |
| `pagination-info` | `<p>` | "Page 2 of 4" |
| `pagination-prev-button` / `pagination-next-button` | `<button>` | Previous and next page |
| `pagination-page-{n}` | `<button>` | Jump to page n |
| `book-link-{id}` | `<a>` | Book title link to `/books/{id}` |

## BookDetailPage (`/books/{id}`)

| Test ID | Element | Description |
|---------|---------|-------------|
| `book-detail-page` | `<div>` | Page container |
| `book-detail-loading` | `<div>` | Loading state |
| `book-detail-back-link` | `<a>` | Back to the catalog |
| `book-detail-categories` | `<div>` | Category links container |
| `book-detail-category-{slug}` | `<a>` | Link to the catalog filtered by that category |
| `book-detail-title` | `<h2>` | Title |
| `book-detail-author` | `<p>` | Author |
| `book-detail-description` | `<p>` | Description |
| `book-detail-isbn` | `<span>` | ISBN |
| `book-detail-price` | `<p>` | Price |
| `book-detail-stock` | `<div>` | Stock badge: In Stock, Only N left, Out of Stock |
| `book-detail-quantity-input` | `<input>` | Copies to add |
| `book-detail-add-to-cart-button` | `<button>` | Add to cart |

An unknown or non-numeric id shows the not-found page (`not-found-page`).

## Admin categories

| Test ID | Element | Description |
|---------|---------|-------------|
| `admin-categories-tab` | `<button>` | Categories tab |
| `admin-categories-section` | `<div>` | Tab content |
| `admin-category-form` | `<form>` | Add category form |
| `admin-category-name-input` | `<input>` | New category name |
| `admin-category-add-button` | `<button>` | Add category |
| `admin-categories-list` | `<div>` | List container |
| `admin-category-item-{id}` | `<div>` | One category row (shows slug and book count) |
| `admin-category-rename-{id}` | `<button>` | Start renaming |
| `admin-category-rename-input-{id}` | `<input>` | New name |
| `admin-category-save-{id}` | `<button>` | Save the new name |
| `admin-category-delete-{id}` | `<button>` | Delete; refused with a message while books use it |
| `admin-book-categories` | `<fieldset>` | Category checkboxes on the book form |
| `admin-book-category-{slug}` | `<input>` | Category checkbox |

## Saved addresses (profile page and checkout)

| Test ID | Element | Description |
|---------|---------|-------------|
| `addresses-section` | `<section>` | Profile section |
| `address-add-button` | `<button>` | Open the form |
| `address-form` | `<form>` | Add or edit form |
| `address-label-input` | `<input>` | Label such as Home (optional) |
| `address-fullname-input` | `<input>` | Full name |
| `address-street-input` | `<input>` | Street |
| `address-city-input` | `<input>` | City |
| `address-postal-input` | `<input>` | Postal code |
| `address-country-input` | `<input>` | Country |
| `address-save-button` | `<button>` | Save (text is "Save address" or "Update address") |
| `address-cancel-button` | `<button>` | Close the form |
| `addresses-empty` | `<p>` | No saved addresses |
| `addresses-list` | `<div>` | List container |
| `address-item-{id}` | `<div>` | One saved address |
| `address-edit-{id}` / `address-delete-{id}` | `<button>` | Edit or delete (delete asks for confirmation) |
| `saved-address-select` | `<select>` | Checkout: pick a saved address; fills name and address. Shown only when the user has one |

At most 10 addresses per user. Another user's address answers 404.

## Account security pages

Emails (verification and reset links) are readable in tests through `GET /api/test/emails?to=<address>` with the `x-test-secret` header. The token is the `token` query parameter of the link in the body.

| Test ID | Element | Description |
|---------|---------|-------------|
| `forgot-password-link` | `<a>` | On the login page |
| `forgot-password-page` | `<div>` | `/forgot-password` |
| `forgot-password-form` | `<form>` | Request form |
| `forgot-password-email-input` | `<input>` | Email |
| `forgot-password-submit-button` | `<button>` | Send reset link |
| `forgot-password-success` | `<div>` | Same message for known and unknown addresses |
| `forgot-password-back-button` | `<button>` | Back to sign in |
| `reset-password-page` | `<div>` | `/reset-password?token=...` |
| `reset-password-form` | `<form>` | New password form |
| `reset-password-input` / `reset-password-confirm-input` | `<input>` | New password twice |
| `reset-password-submit-button` | `<button>` | Change password |
| `reset-password-error` | `<div>` | Link not valid, already used or expired |
| `reset-password-request-new-button` | `<button>` | Go to `/forgot-password` |
| `verify-email-page` | `<div>` | `/verify-email?token=...` |
| `verify-email-status` | `<div>` | Checking, verified or failed message |
| `verify-email-continue-button` | `<button>` | Go home |
| `verify-email-banner` | `<div>` | On checkout and profile while the address is not verified |
| `resend-verification-button` | `<button>` | Send the email again |

Rules: a new account is unverified and cannot place orders (API answers 403 `EMAIL_NOT_VERIFIED`); a reset link works once and expires after 30 minutes; a verification link expires after 24 hours; a new link replaces the previous one; five wrong passwords within ten minutes lock the account for 15 minutes (the right password is refused too), and a successful reset lifts the lock. Seeded users are already verified.

## Book covers

| Test ID | Element | Description |
|---------|---------|-------------|
| `book-cover-image-{id}` | `<img>` | Present only for books with an uploaded cover; other books show a generated cover (no image element) |
| `admin-book-cover-input` | `<input file>` | JPEG or PNG up to 2 MB, chosen on the add or edit form and uploaded after the book is saved |
| `admin-book-cover-remove-button` | `<button>` | Edit mode, only when the book has a cover |

API: `PUT /api/books/{id}/cover` (multipart field `file`, admin), `GET` (public, 404 when none, supports `If-None-Match`), `DELETE` (admin). The image type is checked from the file contents, not the name or the declared type.

## Usage Examples

### Cypress/Playwright Tests

```javascript
// Navigate to cart
cy.get('[data-testid="nav-cart-button"]').click()

// Add book to cart
cy.get('[data-testid="add-to-cart-button-1"]').click()

// Search for books
cy.get('[data-testid="search-input"]').type('Gatsby')
cy.get('[data-testid="search-submit-button"]').click()

// Login
cy.get('[data-testid="nav-login-button"]').click()
cy.get('[data-testid="login-email-input"]').type(Cypress.env('ADMIN_EMAIL'))
cy.get('[data-testid="login-password-input"]').type(Cypress.env('ADMIN_PASSWORD'))
cy.get('[data-testid="login-submit-button"]').click()

// Admin - Add book
cy.get('[data-testid="nav-admin-button"]').click()
cy.get('[data-testid="admin-book-title-input"]').type('New Book')
cy.get('[data-testid="admin-book-author-input"]').type('Author Name')
cy.get('[data-testid="admin-save-book-button"]').click()

// Update cart quantity
cy.get('[data-testid="cart-item-quantity-1"]').clear().type('5')

// Place order
cy.get('[data-testid="proceed-to-checkout-button"]').click()
cy.get('[data-testid="checkout-name-input"]').type('John Doe')
cy.get('[data-testid="place-order-button"]').click()
```

### React Testing Library

```javascript
import { render, screen } from '@testing-library/react'

// Find elements
const cartButton = screen.getByTestId('nav-cart-button')
const searchInput = screen.getByTestId('search-input')
const bookCard = screen.getByTestId('book-card-1')

// Assertions
expect(screen.getByTestId('cart-count-badge')).toHaveTextContent('3')
expect(screen.getByTestId('books-count')).toContainHTML('All Books (5)')
```

## Naming Convention

Test IDs follow this pattern:

1. **Static elements**: `{component}-{element}-{action}`
   - Example: `nav-cart-button`, `search-input`

2. **Dynamic elements**: `{component}-{element}-{id}`
   - Example: `book-card-1`, `cart-item-5`

3. **Actions**: Use descriptive verbs
   - `add-to-cart-button`, `proceed-to-checkout-button`

4. **States**: Indicate the state
   - `cart-loading`, `empty-cart-message`, `no-books-message`

## Notes

- All test IDs use kebab-case
- Dynamic IDs include the database record ID for uniqueness
- Test IDs are consistent across related components
- Every interactive element (buttons, inputs, forms) has a test ID
- Loading states and empty states have test IDs for better test coverage

## Testing Tips

1. **Use specific selectors**: Prefer `data-testid={`cart-item-${id}`}` over class-based selectors
2. **Test user flows**: Combine multiple test IDs to test complete user journeys
3. **Wait for loading states**: Check for loading/empty state test IDs before assertions
4. **Dynamic content**: Use template literals for dynamic IDs
5. **Accessibility**: Test IDs complement (don't replace) aria labels and semantic HTML


