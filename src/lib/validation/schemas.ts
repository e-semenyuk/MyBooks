import { z } from 'zod'
import { SHIPPING_METHODS } from '@/lib/pricing'
import { cardExpired, luhnValid, normalizeCardNumber } from '@/lib/payments/card'

const money = z
  .number({ error: 'Price must be a number' })
  .min(0, 'Price must not be negative')
  .max(100000, 'Price is too large')

const stock = z
  .number({ error: 'Stock quantity must be a number' })
  .int('Stock quantity must be a whole number')
  .min(0, 'Stock quantity must not be negative')
  .max(1_000_000, 'Stock quantity is too large')

const text = (label: string, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`)

export const createBookSchema = z.object({
  title: text('Title', 200),
  author: text('Author', 200),
  isbn: z.string().trim().max(30, 'ISBN must be at most 30 characters').nullish().transform((v) => v || undefined),
  price: money,
  description: z.string().max(5000, 'Description must be at most 5000 characters').nullish().transform((v) => v ?? undefined),
  stockQuantity: stock,
  categoryIds: z.array(z.number().int().positive()).max(10, 'At most 10 categories').optional(),
})

export const updateBookSchema = createBookSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Nothing to update')

const quantity = z
  .number({ error: 'Valid quantity is required' })
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(999, 'Quantity must be at most 999')

export const addToCartSchema = z.object({
  bookId: z
    .number({ error: 'Valid book ID is required' })
    .int('Valid book ID is required')
    .positive('Valid book ID is required'),
  quantity,
})

export const updateCartItemSchema = z.object({ quantity })

const shippingMethod = z.enum(SHIPPING_METHODS, { error: 'Shipping method must be STANDARD or EXPRESS' })
const promoCode = z.string().trim().max(40, 'Promo code is too long').optional()

// Card details are checked here and handed to the payment provider; the number
// and security code are never stored.
export const cardSchema = z
  .object({
    number: z
      .string({ error: 'Card number is required' })
      .refine((value) => luhnValid(normalizeCardNumber(value)), 'Card number is not valid'),
    expMonth: z.coerce
      .number({ error: 'Expiry month is required' })
      .int('Expiry month must be 1 to 12')
      .min(1, 'Expiry month must be 1 to 12')
      .max(12, 'Expiry month must be 1 to 12'),
    expYear: z.coerce
      .number({ error: 'Expiry year is required' })
      .int('Expiry year is not valid')
      .min(0, 'Expiry year is not valid')
      .max(2100, 'Expiry year is not valid'),
    cvc: z.string({ error: 'Security code is required' }).regex(/^\d{3,4}$/, 'Security code must be 3 or 4 digits'),
  })
  .refine((card) => !cardExpired(card.expMonth, card.expYear), {
    message: 'Card has expired',
    path: ['expMonth'],
  })

export const quoteSchema = z.object({
  shippingMethod: shippingMethod.default('STANDARD'),
  promoCode,
})

export const createOrderSchema = z.object({
  shippingMethod: shippingMethod.default('STANDARD'),
  promoCode,
  card: cardSchema,
  customerName: text('Customer name', 100),
  customerEmail: z
    .string({ error: 'Customer email is required' })
    .trim()
    .max(254, 'Customer email is too long')
    .pipe(z.email('Customer email is not valid')),
  customerAddress: text('Customer address', 500),
})

// The status value itself is checked by the order service so that the error
// code stays INVALID_STATUS.
export const updateOrderStatusSchema = z.object({
  status: z.string({ error: 'Status is required' }).min(1, 'Status is required'),
})

const passwordRule = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a digit')

const emailRule = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long')
  .pipe(z.email('Email is not valid'))

export const registerSchema = z.object({
  name: text('Name', 100),
  email: emailRule,
  password: passwordRule,
})

const tokenRule = z
  .string({ error: 'Token is required' })
  .trim()
  .min(20, 'Token is not valid')
  .max(200, 'Token is not valid')

export const forgotPasswordSchema = z.object({ email: emailRule })
export const resetPasswordSchema = z.object({ token: tokenRule, password: passwordRule })
export const verifyEmailSchema = z.object({ token: tokenRule })

export const orderFilterSchema = z.object({
  email: z.string().optional(),
  status: z.string().optional(),
  userId: z.coerce.number().int().positive().optional(),
})

export const BOOK_SORTS = ['title', 'price_asc', 'price_desc', 'newest'] as const
export type BookSort = (typeof BOOK_SORTS)[number]

const optionalText = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v ? v : undefined))

// Query string of GET /api/books. Everything is optional; page numbers beyond
// the last page are clamped by the service, not rejected.
export const bookListQuerySchema = z
  .object({
    query: optionalText,
    category: optionalText,
    author: optionalText,
    minPrice: z.coerce.number().min(0, 'Minimum price must not be negative').max(100000).optional(),
    maxPrice: z.coerce.number().min(0, 'Maximum price must not be negative').max(100000).optional(),
    sort: z.enum(BOOK_SORTS).default('title'),
    page: z.coerce.number().int('Page must be a whole number').min(1, 'Page must be at least 1').default(1),
    pageSize: z.coerce
      .number()
      .int('Page size must be a whole number')
      .min(1, 'Page size must be at least 1')
      .max(100, 'Page size must be at most 100')
      .default(12),
  })
  .refine(
    (q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice,
    { message: 'Minimum price must not be above maximum price', path: ['minPrice'] }
  )

export const categorySchema = z.object({
  name: z
    .string({ error: 'Category name is required' })
    .trim()
    .min(1, 'Category name is required')
    .max(60, 'Category name must be at most 60 characters'),
})

export const addressSchema = z.object({
  label: z.string().trim().max(30, 'Label must be at most 30 characters').optional().default(''),
  fullName: text('Full name', 100),
  street: text('Street', 200),
  city: text('City', 100),
  postalCode: text('Postal code', 20),
  country: text('Country', 60),
})
