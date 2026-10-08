import { describe, expect, it } from 'vitest'
import {
  addToCartSchema,
  bookListQuerySchema,
  categorySchema,
  createBookSchema,
  createOrderSchema,
  quoteSchema,
  registerSchema,
  updateBookSchema,
  updateCartItemSchema,
} from './schemas'

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message

describe('createBookSchema', () => {
  const valid = { title: ' Dune ', author: 'Frank Herbert', price: 9.99, stockQuantity: 3 }

  it('accepts a valid book and trims text', () => {
    const parsed = createBookSchema.parse(valid)
    expect(parsed.title).toBe('Dune')
  })

  it('treats an empty ISBN as missing', () => {
    expect(createBookSchema.parse({ ...valid, isbn: '' }).isbn).toBeUndefined()
  })

  it.each([
    [{ ...valid, title: '  ' }, 'Title is required'],
    [{ ...valid, price: -1 }, 'Price must not be negative'],
    [{ ...valid, price: '9.99' }, 'Price must be a number'],
    [{ ...valid, stockQuantity: 1.5 }, 'Stock quantity must be a whole number'],
    [{ ...valid, stockQuantity: -1 }, 'Stock quantity must not be negative'],
    [{ author: 'x', price: 1, stockQuantity: 1 }, 'Title is required'],
  ])('rejects %j', (input, message) => {
    const result = createBookSchema.safeParse(input)
    expect(result.success).toBe(false)
    expect(firstMessage(result)).toBe(message)
  })
})

describe('updateBookSchema', () => {
  it('accepts a partial update', () => {
    expect(updateBookSchema.parse({ price: 5 })).toEqual({ price: 5 })
  })

  it('rejects an empty update', () => {
    expect(updateBookSchema.safeParse({}).success).toBe(false)
  })
})

describe('cart schemas', () => {
  it('accepts whole quantities from 1 to 999', () => {
    expect(addToCartSchema.parse({ bookId: 1, quantity: 3 })).toEqual({ bookId: 1, quantity: 3 })
    expect(updateCartItemSchema.parse({ quantity: 999 })).toEqual({ quantity: 999 })
  })

  it.each([0, -1, 1.5, 1000, '2', null])('rejects quantity %j', (quantity) => {
    expect(updateCartItemSchema.safeParse({ quantity }).success).toBe(false)
  })

  it.each([0, -3, 1.2, '1'])('rejects book id %j', (bookId) => {
    expect(addToCartSchema.safeParse({ bookId, quantity: 1 }).success).toBe(false)
  })
})

describe('createOrderSchema', () => {
  const valid = { customerName: 'Ann', customerEmail: 'ann@example.com', customerAddress: '1 Main St' }

  it('accepts a valid order and defaults to standard shipping', () => {
    expect(createOrderSchema.parse(valid)).toEqual({ ...valid, shippingMethod: 'STANDARD' })
  })

  it('accepts express shipping and a trimmed promo code', () => {
    const parsed = createOrderSchema.parse({ ...valid, shippingMethod: 'EXPRESS', promoCode: ' WELCOME10 ' })
    expect(parsed.shippingMethod).toBe('EXPRESS')
    expect(parsed.promoCode).toBe('WELCOME10')
  })

  it('rejects unknown shipping methods and overlong promo codes', () => {
    expect(createOrderSchema.safeParse({ ...valid, shippingMethod: 'DRONE' }).success).toBe(false)
    expect(createOrderSchema.safeParse({ ...valid, promoCode: 'x'.repeat(41) }).success).toBe(false)
  })

  it('rejects a bad email and missing fields', () => {
    expect(firstMessage(createOrderSchema.safeParse({ ...valid, customerEmail: 'nope' }))).toBe(
      'Customer email is not valid'
    )
    expect(firstMessage(createOrderSchema.safeParse({ ...valid, customerName: '' }))).toBe(
      'Customer name is required'
    )
    expect(createOrderSchema.safeParse({}).success).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = { name: 'Ann', email: 'Ann@Example.com', password: 'abcdef12' }

  it('lowercases the email', () => {
    expect(registerSchema.parse(valid).email).toBe('ann@example.com')
  })

  it.each([
    ['short1', 'Password must be at least 8 characters'],
    ['abcdefgh', 'Password must contain a digit'],
    ['12345678', 'Password must contain a letter'],
  ])('rejects password %s', (password, message) => {
    expect(firstMessage(registerSchema.safeParse({ ...valid, password }))).toBe(message)
  })

  it('rejects an invalid email', () => {
    expect(firstMessage(registerSchema.safeParse({ ...valid, email: 'not-an-email' }))).toBe(
      'Email is not valid'
    )
  })
})

describe('bookListQuerySchema', () => {
  it('fills in defaults', () => {
    expect(bookListQuerySchema.parse({})).toEqual({ sort: 'title', page: 1, pageSize: 12 })
  })

  it('reads numbers from the query string and drops empty text', () => {
    const parsed = bookListQuerySchema.parse({
      query: '  dune ',
      category: '',
      minPrice: '10',
      maxPrice: '20.5',
      sort: 'price_desc',
      page: '3',
      pageSize: '24',
    })
    expect(parsed).toEqual({
      query: 'dune',
      category: undefined,
      author: undefined,
      minPrice: 10,
      maxPrice: 20.5,
      sort: 'price_desc',
      page: 3,
      pageSize: 24,
    })
  })

  it.each([
    [{ sort: 'cheapest' }, 'sort'],
    [{ page: '0' }, 'Page must be at least 1'],
    [{ page: '1.5' }, 'Page must be a whole number'],
    [{ pageSize: '101' }, 'Page size must be at most 100'],
    [{ minPrice: '-1' }, 'Minimum price must not be negative'],
    [{ minPrice: '20', maxPrice: '5' }, 'Minimum price must not be above maximum price'],
  ])('rejects %j', (input, fragment) => {
    const result = bookListQuerySchema.safeParse(input)
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain(fragment)
  })
})

describe('categorySchema', () => {
  it('trims the name', () => {
    expect(categorySchema.parse({ name: '  Poetry ' })).toEqual({ name: 'Poetry' })
  })

  it('rejects empty and overlong names', () => {
    expect(categorySchema.safeParse({ name: '   ' }).success).toBe(false)
    expect(categorySchema.safeParse({ name: 'x'.repeat(61) }).success).toBe(false)
    expect(categorySchema.safeParse({}).success).toBe(false)
  })
})

describe('createBookSchema categories', () => {
  const base = { title: 'T', author: 'A', price: 1, stockQuantity: 1 }

  it('accepts a list of category ids', () => {
    expect(createBookSchema.parse({ ...base, categoryIds: [1, 2] }).categoryIds).toEqual([1, 2])
  })

  it('rejects bad ids and too many categories', () => {
    expect(createBookSchema.safeParse({ ...base, categoryIds: [0] }).success).toBe(false)
    expect(createBookSchema.safeParse({ ...base, categoryIds: [1.5] }).success).toBe(false)
    expect(createBookSchema.safeParse({ ...base, categoryIds: Array.from({ length: 11 }, (_, i) => i + 1) }).success).toBe(false)
  })
})

describe('quoteSchema', () => {
  it('defaults to standard shipping with no promo', () => {
    expect(quoteSchema.parse({})).toEqual({ shippingMethod: 'STANDARD' })
  })
})
