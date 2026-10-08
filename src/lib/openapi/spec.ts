import { z } from 'zod'
import { ORDER_STATUSES } from '@/lib/orderStatus'
import {
  addToCartSchema,
  createBookSchema,
  createOrderSchema,
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
          summary: 'List books, or search by title, author or ISBN',
          parameters: [
            { name: 'query', in: 'query', required: false, schema: { type: 'string' }, description: 'ISBN may be typed with or without hyphens' },
          ],
          responses: { '200': { description: 'Books ordered by title', content: jsonContent({ type: 'array', items: ref('Book') }) } },
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
          summary: 'Turn the current cart into an order (status CONFIRMED) and reduce stock',
          requestBody: { required: true, content: jsonContent(body(createOrderSchema, ['customerEmail'])) },
          responses: { '201': { description: 'Created', content: jsonContent(ref('Order')) }, '400': errorResponse('VALIDATION_ERROR or ORDER_REJECTED (empty cart, missing book, not enough stock)') },
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
      '/api/register': {
        post: {
          tags: ['Accounts'],
          summary: 'Create an account (role USER). Email is stored in lowercase.',
          requestBody: { required: true, content: jsonContent(body(registerSchema, ['email'])) },
          responses: {
            '201': { description: 'Registered', content: jsonContent({ type: 'object', properties: { message: { type: 'string' }, user: ref('User') } }) },
            '400': errorResponse('VALIDATION_ERROR or EMAIL_TAKEN'),
            '429': errorResponse('RATE_LIMITED (Retry-After header)'),
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
          summary: 'Remove all data and load the fixed data set (12 books, admin from ADMIN_EMAIL/ADMIN_PASSWORD, optional USER_EMAIL/USER_PASSWORD)',
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
        OrderStatus: { type: 'string', enum: [...ORDER_STATUSES] },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' }, email: { type: 'string' }, name: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] }, createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Book: {
          type: 'object',
          required: ['id', 'title', 'author', 'price', 'stockQuantity'],
          properties: {
            id: { type: 'integer' }, title: { type: 'string' }, author: { type: 'string' },
            isbn: { type: ['string', 'null'] }, price: { type: 'number', description: 'Dollars, two decimals' },
            description: { type: ['string', 'null'] }, stockQuantity: { type: 'integer', minimum: 0 },
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
            orderDate: { type: 'string', format: 'date-time' }, totalAmount: { type: 'number', description: 'Dollars, two decimals' },
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
  'get /api/cart': 'getCart',
  'post /api/cart': 'addToCart',
  'delete /api/cart': 'clearCart',
  'put /api/cart/{id}': 'updateCartItem',
  'delete /api/cart/{id}': 'removeCartItem',
  'get /api/cart/total': 'getCartTotal',
  'post /api/cart/merge': 'mergeCart',
  'get /api/orders': 'listOrders',
  'post /api/orders': 'createOrder',
  'get /api/orders/{id}': 'getOrder',
  'patch /api/orders/{id}': 'updateOrderStatus',
  'post /api/register': 'register',
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
