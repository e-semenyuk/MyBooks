import { z } from 'zod'
import { ORDER_STATUSES } from '@/lib/orderStatus'
import {
  BOOK_SORTS,
  addToCartSchema,
  addressSchema,
  categorySchema,
  createBookSchema,
  createOrderSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  quoteSchema,
  registerSchema,
  updateBookSchema,
  updateCartItemSchema,
  updateOrderStatusSchema,
} from '@/lib/validation/schemas'

type Json = Record<string, any>

// Request bodies come straight from the validators so the document cannot drift from them.
function body(schema: z.ZodType, emailFields: string[] = []): Json {
  const { $schema, ...json } = z.toJSONSchema(schema, { io: 'input', target: 'draft-2020-12' }) as Json
  for (const field of emailFields) json.properties[field].format = 'email'
  return json
}

const ref = (name: string): Json => ({ $ref: `#/components/schemas/${name}` })
const jsonContent = (schema: Json): Json => ({ 'application/json': { schema } })

const errorResponse = (description: string): Json => ({
  description,
  content: jsonContent(ref('Error')),
})

const idParam = (name: string): Json => ({
  name: 'id',
  in: 'path',
  required: true,
  description: name,
  schema: { type: 'integer', minimum: 1 },
})

const standardErrors = {
  '400': errorResponse('Validation failed (code VALIDATION_ERROR, INVALID_JSON or INVALID_ID)'),
}
const authErrors = {
  '401': errorResponse('Not signed in (code UNAUTHORIZED)'),
  '403': errorResponse('Not allowed for this role (code FORBIDDEN)'),
}

function buildDocument(): Json {
  return {
    openapi: '3.1.0',
    info: {
      title: 'NextBookstore API',
      version: '1.0.0',
      description:
        'REST API of the bookstore. Prices are in dollars with two decimals. Errors always have the shape { error, code }. ' +
        'Authentication uses NextAuth session cookies: GET /api/auth/csrf, then POST /api/auth/callback/credentials ' +
        '(form fields csrfToken, email, password, json=true). The guest cart uses the bookstore_session_id cookie.',
    },
    servers: [{ url: 'http://localhost:3000' }],
    tags: [
      { name: 'Books' },
      { name: 'Categories' },
      { name: 'Addresses' },
      { name: 'Cart' },
      { name: 'Orders' },
      { name: 'Accounts' },
      { name: 'Operations' },
      { name: 'Test support', description: 'Only available when ENABLE_TEST_ENDPOINTS=true; otherwise 404.' },
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['Operations'],
          summary: 'Check that the app can reach its database',
          responses: {
            '200': { description: 'Healthy', content: jsonContent({ type: 'object', properties: { status: { const: 'ok' }, db: { const: 'up' } } }) },
            '503': { description: 'Database unreachable', content: jsonContent({ type: 'object', properties: { status: { const: 'degraded' }, db: { const: 'down' } } }) },
          },
        },
      },
      '/api/books': {
        get: {
          tags: ['Books'],
          summary: 'Filtered, sorted and paged catalog',
          description:
            'All parameters are optional and combine. A page past the last page returns the last page; read `page` in the response.',
          parameters: [
            { name: 'query', in: 'query', required: false, schema: { type: 'string' }, description: 'Matches title, author or ISBN (with or without hyphens)' },
            { name: 'category', in: 'query', required: false, schema: { type: 'string' }, description: 'Category slug, for example science-fiction' },
            { name: 'author', in: 'query', required: false, schema: { type: 'string' }, description: 'Part of the author name' },
            { name: 'minPrice', in: 'query', required: false, schema: { type: 'number', minimum: 0 }, description: 'Dollars' },
            { name: 'maxPrice', in: 'query', required: false, schema: { type: 'number', minimum: 0 }, description: 'Dollars; must not be below minPrice' },
            { name: 'sort', in: 'query', required: false, schema: { type: 'string', enum: [...BOOK_SORTS], default: 'title' } },
            { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1, default: 1 } },
            { name: 'pageSize', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 12 } },
          ],
          responses: {
            '200': { description: 'One page of books', content: jsonContent(ref('PagedBooks')) },
            '400': errorResponse('VALIDATION_ERROR'),
          },
        },
        post: {
          tags: ['Books'],
          summary: 'Create a book (admin)',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: jsonContent(body(createBookSchema)) },
          responses: { '201': { description: 'Created', content: jsonContent(ref('Book')) }, ...standardErrors, ...authErrors },
        },
      },
      '/api/books/{id}': {
        parameters: [idParam('Book id')],
        get: {
          tags: ['Books'],
          summary: 'Get one book',
          responses: { '200': { description: 'The book', content: jsonContent(ref('Book')) }, '400': standardErrors['400'], '404': errorResponse('BOOK_NOT_FOUND') },
        },
        put: {
          tags: ['Books'],
          summary: 'Update a book (admin). Send only the fields to change.',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: jsonContent(body(updateBookSchema)) },
          responses: { '200': { description: 'Updated', content: jsonContent(ref('Book')) }, ...standardErrors, ...authErrors, '404': errorResponse('NOT_FOUND') },
        },
        delete: {
          tags: ['Books'],
          summary: 'Delete a book (admin). Its cart items are removed too.',
          security: [{ sessionCookie: [] }],
          responses: { '200': { description: 'Deleted', content: jsonContent({ type: 'object', properties: { message: { type: 'string' } } }) }, '400': standardErrors['400'], ...authErrors, '404': errorResponse('NOT_FOUND') },
        },
      },
      '/api/categories': {
        get: {
          tags: ['Categories'],
          summary: 'All categories with the number of books in each',
          responses: { '200': { description: 'Categories ordered by name', content: jsonContent({ type: 'array', items: ref('CategoryWithCount') }) } },
        },
        post: {
          tags: ['Categories'],
          summary: 'Create a category (admin). The slug is made from the name.',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: jsonContent(body(categorySchema)) },
          responses: {
            '201': { description: 'Created', content: jsonContent(ref('Category')) },
            '400': errorResponse('VALIDATION_ERROR or INVALID_CATEGORY_NAME'),
            ...authErrors,
            '409': errorResponse('CATEGORY_EXISTS'),
          },
        },
      },
      '/api/categories/{id}': {
        parameters: [idParam('Category id')],
        put: {
          tags: ['Categories'],
          summary: 'Rename a category (admin)',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: jsonContent(body(categorySchema)) },
          responses: {
            '200': { description: 'Renamed', content: jsonContent(ref('Category')) },
            '400': errorResponse('VALIDATION_ERROR, INVALID_ID or INVALID_CATEGORY_NAME'),
            ...authErrors,
            '404': errorResponse('CATEGORY_NOT_FOUND'),
            '409': errorResponse('CATEGORY_EXISTS'),
          },
        },
        delete: {
          tags: ['Categories'],
          summary: 'Delete a category (admin). Refused while any book uses it.',
          security: [{ sessionCookie: [] }],
          responses: {
            '200': { description: 'Deleted', content: jsonContent({ type: 'object', properties: { message: { type: 'string' } } }) },
            '400': standardErrors['400'],
            ...authErrors,
            '404': errorResponse('CATEGORY_NOT_FOUND'),
            '409': errorResponse('CATEGORY_IN_USE'),
          },
        },
      },
      '/api/addresses': {
        get: {
          tags: ['Addresses'],
          summary: 'Saved addresses of the signed-in user, oldest first',
          security: [{ sessionCookie: [] }],
          responses: { '200': { description: 'Addresses', content: jsonContent({ type: 'array', items: ref('Address') }) }, '401': authErrors['401'] },
        },
        post: {
          tags: ['Addresses'],
          summary: 'Save an address (at most 10 per user)',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: jsonContent(body(addressSchema)) },
          responses: {
            '201': { description: 'Saved', content: jsonContent(ref('Address')) },
            '400': errorResponse('VALIDATION_ERROR'),
            '401': authErrors['401'],
            '409': errorResponse('ADDRESS_LIMIT'),
          },
        },
      },
      '/api/addresses/{id}': {
        parameters: [idParam('Address id')],
        put: {
          tags: ['Addresses'],
          summary: 'Replace an address. Another user\'s address answers 404.',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: jsonContent(body(addressSchema)) },
          responses: {
            '200': { description: 'Updated', content: jsonContent(ref('Address')) },
            '400': errorResponse('VALIDATION_ERROR or INVALID_ID'),
            '401': authErrors['401'],
            '404': errorResponse('ADDRESS_NOT_FOUND'),
          },
        },
        delete: {
          tags: ['Addresses'],
          summary: 'Delete an address. Another user\'s address answers 404.',
          security: [{ sessionCookie: [] }],
          responses: {
            '200': { description: 'Deleted', content: jsonContent({ type: 'object', properties: { message: { type: 'string' } } }) },
            '400': standardErrors['400'],
            '401': authErrors['401'],
            '404': errorResponse('ADDRESS_NOT_FOUND'),
          },
        },
      },
      '/api/cart': {
        get: {
          tags: ['Cart'],
          summary: 'Items in the current cart (signed-in user cart, or guest cart from the cookie)',
          responses: { '200': { description: 'Cart items', content: jsonContent({ type: 'array', items: ref('CartItem') }) } },
        },
        post: {
          tags: ['Cart'],
          summary: 'Add a book. Quantity is added to what is already in the cart.',
          requestBody: { required: true, content: jsonContent(body(addToCartSchema)) },
          responses: {
            '201': { description: 'Cart item with the new quantity', content: jsonContent(ref('CartItem')) },
            '400': errorResponse('VALIDATION_ERROR, OUT_OF_STOCK or INSUFFICIENT_STOCK'),
            '404': errorResponse('BOOK_NOT_FOUND'),
          },
        },
        delete: {
          tags: ['Cart'],
          summary: 'Empty the cart',
          responses: { '200': { description: 'Cleared', content: jsonContent({ type: 'object', properties: { message: { type: 'string' } } }) } },
        },
      },
      '/api/cart/{id}': {
        parameters: [idParam('Cart item id')],
        put: {
          tags: ['Cart'],
          summary: 'Set the quantity of a cart item (must not exceed stock)',
          requestBody: { required: true, content: jsonContent(body(updateCartItemSchema)) },
          responses: {
            '200': { description: 'Updated item', content: jsonContent(ref('CartItem')) },
            '400': errorResponse('VALIDATION_ERROR, INVALID_ID or INSUFFICIENT_STOCK'),
            '404': errorResponse('CART_ITEM_NOT_FOUND'),
          },
        },
        delete: {
          tags: ['Cart'],
          summary: 'Remove an item from the cart',
          responses: { '200': { description: 'Removed', content: jsonContent({ type: 'object', properties: { message: { type: 'string' } } }) }, '400': standardErrors['400'], '404': errorResponse('CART_ITEM_NOT_FOUND') },
        },
      },
      '/api/cart/total': {
        get: {
          tags: ['Cart'],
          summary: 'Cart total in dollars',
          responses: { '200': { description: 'Total', content: jsonContent({ type: 'number', examples: [59.97] }) } },
        },
      },
      '/api/cart/merge': {
        post: {
          tags: ['Cart'],
          summary: 'Move the guest cart into the signed-in user cart. The higher quantity wins, capped at stock.',
          security: [{ sessionCookie: [] }],
          responses: { '200': { description: 'Number of guest items processed', content: jsonContent({ type: 'object', properties: { merged: { type: 'integer' } } }) }, '401': authErrors['401'] },
        },
      },
      '/api/orders': {
        get: {
          tags: ['Orders'],
          summary: 'Orders of the signed-in user. Admins see all orders and can filter. Guests get an empty list.',
          security: [{ sessionCookie: [] }],
          parameters: [
            { name: 'email', in: 'query', schema: { type: 'string' }, description: 'Admin only' },
            { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/OrderStatus' }, description: 'Admin only' },
            { name: 'userId', in: 'query', schema: { type: 'integer' }, description: 'Admin only' },
          ],
          responses: { '200': { description: 'Orders, newest first', content: jsonContent({ type: 'array', items: ref('Order') }) }, '400': errorResponse('VALIDATION_ERROR or INVALID_STATUS') },
        },
        post: {
          tags: ['Orders'],
          summary: 'Turn the signed-in user cart into an order (status CONFIRMED), reduce stock and count the promo code',
          description: 'Signing in is required. Prices are recomputed on the server; the client never sends amounts.',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: jsonContent(body(createOrderSchema, ['customerEmail'])) },
          responses: {
            '201': { description: 'Created', content: jsonContent(ref('Order')) },
            '400': errorResponse('VALIDATION_ERROR, ORDER_REJECTED (empty cart, missing book, not enough stock), INVALID_PROMO, PROMO_EXPIRED or PROMO_EXHAUSTED'),
            '401': authErrors['401'],
            '403': errorResponse('EMAIL_NOT_VERIFIED: confirm the email address first'),
          },
        },
      },
      '/api/orders/{id}': {
        parameters: [idParam('Order id')],
        get: {
          tags: ['Orders'],
          summary: 'One order with items and status history. Owner or admin only; other users get 404.',
          security: [{ sessionCookie: [] }],
          responses: { '200': { description: 'The order', content: jsonContent(ref('Order')) }, '400': standardErrors['400'], '401': authErrors['401'], '404': errorResponse('ORDER_NOT_FOUND') },
        },
        patch: {
          tags: ['Orders'],
          summary: 'Change the status (admin). Allowed: PENDING→CONFIRMED|CANCELLED, CONFIRMED→SHIPPED|CANCELLED, SHIPPED→DELIVERED. Cancelling restores stock.',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: jsonContent(body(updateOrderStatusSchema)) },
          responses: {
            '200': { description: 'Updated order', content: jsonContent(ref('Order')) },
            '400': errorResponse('INVALID_STATUS, VALIDATION_ERROR or INVALID_ID'),
            ...authErrors,
            '404': errorResponse('ORDER_NOT_FOUND'),
            '409': errorResponse('INVALID_TRANSITION'),
          },
        },
      },
      '/api/checkout/quote': {
        post: {
          tags: ['Orders'],
          summary: 'Price the signed-in user cart with a shipping method and optional promo code',
          description:
            'Standard shipping is free from 50.00 after discount; Express is never free. Tax is charged on the discounted subtotal.',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: jsonContent(body(quoteSchema)) },
          responses: {
            '200': { description: 'Breakdown in dollars', content: jsonContent(ref('Quote')) },
            '400': errorResponse('VALIDATION_ERROR, ORDER_REJECTED (empty cart), INVALID_PROMO, PROMO_EXPIRED or PROMO_EXHAUSTED'),
            '401': authErrors['401'],
          },
        },
      },
      '/api/shipping-methods': {
        get: {
          tags: ['Orders'],
          summary: 'Shipping options with price and delivery estimate',
          responses: {
            '200': {
              description: 'Options',
              content: jsonContent({
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    method: { type: 'string', enum: ['STANDARD', 'EXPRESS'] },
                    label: { type: 'string' },
                    price: { type: 'number' },
                    freeOver: { type: ['number', 'null'] },
                    estimate: { type: 'string' },
                  },
                },
              }),
            },
          },
        },
      },
      '/api/register': {
        post: {
          tags: ['Accounts'],
          summary: 'Create an account (role USER). Email is stored in lowercase. A verification email is sent; ordering needs the address to be confirmed.',
          requestBody: { required: true, content: jsonContent(body(registerSchema, ['email'])) },
          responses: {
            '201': { description: 'Registered', content: jsonContent({ type: 'object', properties: { message: { type: 'string' }, user: ref('User') } }) },
            '400': errorResponse('VALIDATION_ERROR or EMAIL_TAKEN'),
            '429': errorResponse('RATE_LIMITED (Retry-After header)'),
          },
        },
      },
      '/api/account/me': {
        get: {
          tags: ['Accounts'],
          summary: 'The signed-in user and whether the email address is verified',
          security: [{ sessionCookie: [] }],
          responses: {
            '200': {
              description: 'Account',
              content: jsonContent({
                type: 'object',
                properties: {
                  id: { type: 'integer' }, email: { type: 'string' }, name: { type: 'string' },
                  role: { type: 'string', enum: ['USER', 'ADMIN'] }, emailVerified: { type: 'boolean' },
                },
              }),
            },
            '401': authErrors['401'],
          },
        },
      },
      '/api/account/forgot-password': {
        post: {
          tags: ['Accounts'],
          summary: 'Email a password reset link. The answer is the same whether or not the address has an account.',
          description: 'The link works once and expires after 30 minutes. A new request replaces the previous link. Limited to 5 requests per hour per address and client.',
          requestBody: { required: true, content: jsonContent(body(forgotPasswordSchema, ['email'])) },
          responses: {
            '200': { description: 'Always the same message', content: jsonContent({ type: 'object', properties: { message: { type: 'string' } } }) },
            '400': errorResponse('VALIDATION_ERROR'),
            '429': errorResponse('RATE_LIMITED (Retry-After header)'),
          },
        },
      },
      '/api/account/reset-password': {
        post: {
          tags: ['Accounts'],
          summary: 'Set a new password with the emailed token. Also clears a login lock and confirms the email address.',
          requestBody: { required: true, content: jsonContent(body(resetPasswordSchema)) },
          responses: {
            '200': { description: 'Password changed', content: jsonContent({ type: 'object', properties: { message: { type: 'string' } } }) },
            '400': errorResponse('VALIDATION_ERROR, TOKEN_INVALID (unknown or already used) or TOKEN_EXPIRED'),
          },
        },
      },
      '/api/account/verify-email': {
        post: {
          tags: ['Accounts'],
          summary: 'Confirm the email address with the emailed token (valid for 24 hours)',
          requestBody: { required: true, content: jsonContent(body(verifyEmailSchema)) },
          responses: {
            '200': { description: 'Verified', content: jsonContent({ type: 'object', properties: { message: { type: 'string' } } }) },
            '400': errorResponse('VALIDATION_ERROR, TOKEN_INVALID or TOKEN_EXPIRED'),
          },
        },
      },
      '/api/account/resend-verification': {
        post: {
          tags: ['Accounts'],
          summary: 'Send the verification email again (3 per hour)',
          security: [{ sessionCookie: [] }],
          responses: {
            '200': { description: 'Sent', content: jsonContent({ type: 'object', properties: { message: { type: 'string' } } }) },
            '401': authErrors['401'],
            '409': errorResponse('ALREADY_VERIFIED'),
            '429': errorResponse('RATE_LIMITED (Retry-After header)'),
          },
        },
      },
      '/api/test/emails': {
        get: {
          tags: ['Test support'],
          summary: 'The latest emails the app sent, newest first (reset and verification links are in the body)',
          parameters: [
            { name: 'x-test-secret', in: 'header', required: true, schema: { type: 'string' } },
            { name: 'to', in: 'query', required: false, schema: { type: 'string' }, description: 'Only emails to this address' },
          ],
          responses: {
            '200': {
              description: 'Up to 20 emails',
              content: jsonContent({
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' }, to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' }, sentAt: { type: ['string', 'null'] }, error: { type: ['string', 'null'] },
                  },
                },
              }),
            },
            '404': errorResponse('Disabled or wrong secret'),
          },
        },
      },
      '/api/test/reset': {
        post: {
          tags: ['Test support'],
          summary: 'Remove all data',
          parameters: [{ name: 'x-test-secret', in: 'header', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Done', content: jsonContent({ type: 'object', properties: { message: { type: 'string' } } }) }, '404': errorResponse('Disabled or wrong secret') },
        },
      },
      '/api/test/seed': {
        post: {
          tags: ['Test support'],
          summary: 'Remove all data and load the fixed data set (38 books in 8 categories, 6 promo codes, admin from ADMIN_EMAIL/ADMIN_PASSWORD, optional USER_EMAIL/USER_PASSWORD)',
          parameters: [{ name: 'x-test-secret', in: 'header', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Counts', content: jsonContent({ type: 'object', properties: { books: { type: 'integer' }, users: { type: 'integer' } } }) }, '400': errorResponse('SEED_CONFIG'), '404': errorResponse('Disabled or wrong secret') },
        },
      },
    },
    components: {
      securitySchemes: {
        sessionCookie: { type: 'apiKey', in: 'cookie', name: 'next-auth.session-token' },
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error', 'code'],
          properties: {
            error: { type: 'string', description: 'Message safe to show to a person' },
            code: { type: 'string', description: 'Stable machine-readable code' },
            details: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, message: { type: 'string' } } } },
          },
        },
        Address: {
          type: 'object',
          required: ['id', 'fullName', 'street', 'city', 'postalCode', 'country'],
          properties: {
            id: { type: 'integer' }, label: { type: 'string' }, fullName: { type: 'string' }, street: { type: 'string' },
            city: { type: 'string' }, postalCode: { type: 'string' }, country: { type: 'string' },
          },
        },
        Quote: {
          type: 'object',
          required: ['shippingMethod', 'subtotal', 'discount', 'shipping', 'tax', 'total'],
          properties: {
            shippingMethod: { type: 'string', enum: ['STANDARD', 'EXPRESS'] },
            promoCode: { type: ['string', 'null'] },
            subtotal: { type: 'number' }, discount: { type: 'number' }, shipping: { type: 'number' },
            tax: { type: 'number' }, total: { type: 'number', description: 'subtotal - discount + shipping + tax' },
          },
        },
        OrderStatus: { type: 'string', enum: [...ORDER_STATUSES] },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' }, email: { type: 'string' }, name: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] }, createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          required: ['id', 'name', 'slug'],
          properties: { id: { type: 'integer' }, name: { type: 'string' }, slug: { type: 'string' } },
        },
        CategoryWithCount: {
          allOf: [ref('Category'), { type: 'object', properties: { bookCount: { type: 'integer', minimum: 0 } } }],
        },
        PagedBooks: {
          type: 'object',
          required: ['items', 'total', 'page', 'pageSize', 'totalPages'],
          properties: {
            items: { type: 'array', items: ref('Book') },
            total: { type: 'integer', description: 'Books matching the filters, across all pages' },
            page: { type: 'integer', description: 'The page returned (clamped to the last page)' },
            pageSize: { type: 'integer' },
            totalPages: { type: 'integer', minimum: 1 },
          },
        },
        Book: {
          type: 'object',
          required: ['id', 'title', 'author', 'price', 'stockQuantity'],
          properties: {
            id: { type: 'integer' }, title: { type: 'string' }, author: { type: 'string' },
            isbn: { type: ['string', 'null'] }, price: { type: 'number', description: 'Dollars, two decimals' },
            description: { type: ['string', 'null'] }, stockQuantity: { type: 'integer', minimum: 0 },
            categories: { type: 'array', items: ref('Category') },
            createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CartItem: {
          type: 'object',
          required: ['id', 'bookId', 'quantity'],
          properties: {
            id: { type: 'integer' }, bookId: { type: 'integer' }, quantity: { type: 'integer', minimum: 1 },
            sessionId: { type: ['string', 'null'] }, userId: { type: ['integer', 'null'] },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' }, orderId: { type: 'integer' }, bookId: { type: 'integer' },
            quantity: { type: 'integer' }, price: { type: 'number', description: 'Unit price when ordered' }, book: ref('Book'),
          },
        },
        OrderEvent: {
          type: 'object',
          properties: {
            id: { type: 'integer' }, orderId: { type: 'integer' },
            fromStatus: { oneOf: [ref('OrderStatus'), { type: 'null' }] }, toStatus: ref('OrderStatus'),
            actorId: { type: ['integer', 'null'] }, createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Order: {
          type: 'object',
          required: ['id', 'customerName', 'customerEmail', 'customerAddress', 'totalAmount', 'status'],
          properties: {
            id: { type: 'integer' }, userId: { type: ['integer', 'null'] },
            customerName: { type: 'string' }, customerEmail: { type: 'string' }, customerAddress: { type: 'string' },
            orderDate: { type: 'string', format: 'date-time' },
            subtotal: { type: 'number' }, discount: { type: 'number' }, shipping: { type: 'number' }, tax: { type: 'number' },
            totalAmount: { type: 'number', description: 'Dollars, two decimals: subtotal - discount + shipping + tax' },
            shippingMethod: { type: 'string', enum: ['STANDARD', 'EXPRESS'] },
            promoCode: { type: ['string', 'null'] },
            status: ref('OrderStatus'),
            orderItems: { type: 'array', items: ref('OrderItem') },
            events: { type: 'array', items: ref('OrderEvent'), description: 'Only on GET /api/orders/{id} and after a status change' },
          },
        },
      },
    },
  }
}

const OPERATION_IDS: Record<string, string> = {
  'get /api/health': 'getHealth',
  'get /api/books': 'listBooks',
  'post /api/books': 'createBook',
  'get /api/books/{id}': 'getBook',
  'put /api/books/{id}': 'updateBook',
  'delete /api/books/{id}': 'deleteBook',
  'get /api/categories': 'listCategories',
  'post /api/categories': 'createCategory',
  'put /api/categories/{id}': 'renameCategory',
  'delete /api/categories/{id}': 'deleteCategory',
  'get /api/addresses': 'listAddresses',
  'post /api/addresses': 'createAddress',
  'put /api/addresses/{id}': 'updateAddress',
  'delete /api/addresses/{id}': 'deleteAddress',
  'get /api/cart': 'getCart',
  'post /api/cart': 'addToCart',
  'delete /api/cart': 'clearCart',
  'put /api/cart/{id}': 'updateCartItem',
  'delete /api/cart/{id}': 'removeCartItem',
  'get /api/cart/total': 'getCartTotal',
  'post /api/cart/merge': 'mergeCart',
  'get /api/orders': 'listOrders',
  'post /api/orders': 'createOrder',
  'post /api/checkout/quote': 'quoteCheckout',
  'get /api/shipping-methods': 'listShippingMethods',
  'get /api/orders/{id}': 'getOrder',
  'patch /api/orders/{id}': 'updateOrderStatus',
  'post /api/register': 'register',
  'get /api/account/me': 'getAccount',
  'post /api/account/forgot-password': 'forgotPassword',
  'post /api/account/reset-password': 'resetPassword',
  'post /api/account/verify-email': 'verifyEmail',
  'post /api/account/resend-verification': 'resendVerification',
  'get /api/test/emails': 'listTestEmails',
  'post /api/test/reset': 'resetTestData',
  'post /api/test/seed': 'seedTestData',
}

const METHODS = ['get', 'put', 'post', 'delete', 'patch']

export function buildOpenApi(): Json {
  const doc = buildDocument()
  for (const [path, item] of Object.entries<Json>(doc.paths)) {
    for (const method of METHODS) {
      const operation = item[method]
      if (!operation) continue
      const key = `${method} ${path}`
      operation.operationId = OPERATION_IDS[key] ?? (() => { throw new Error(`No operationId for ${key}`) })()
      // Operations without a security requirement are public on purpose
      operation.security ??= []
    }
  }
  return doc
}
