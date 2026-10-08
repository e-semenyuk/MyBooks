import { z } from 'zod'
import { SHIPPING_METHODS } from '@/lib/pricing'

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

export const quoteSchema = z.object({
  shippingMethod: shippingMethod.default('STANDARD'),
  promoCode,
})

export const createOrderSchema = z.object({
  shippingMethod: shippingMethod.default('STANDARD'),
  promoCode,
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

export const registerSchema = z.object({
  name: text('Name', 100),
  email: z
    .string({ error: 'Email is required' })
    .trim()
    .toLowerCase()
    .max(254, 'Email is too long')
    .pipe(z.email('Email is not valid')),
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a digit'),
})

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
