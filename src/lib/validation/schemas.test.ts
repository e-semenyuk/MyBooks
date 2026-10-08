import { describe, expect, it } from 'vitest'
import {
  addToCartSchema,
  createBookSchema,
  createOrderSchema,
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

  it('accepts a valid order', () => {
    expect(createOrderSchema.parse(valid)).toEqual(valid)
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
