import { describe, expect, it } from 'vitest'
import { fitsInStock, mergedQuantity } from './cartRules'

describe('mergedQuantity', () => {
  it('keeps the higher quantity', () => {
    expect(mergedQuantity(3, 1, 10)).toBe(3)
    expect(mergedQuantity(1, 4, 10)).toBe(4)
  })

  it('does not add the two quantities together', () => {
    expect(mergedQuantity(2, 2, 10)).toBe(2)
  })

  it('caps at stock', () => {
    expect(mergedQuantity(8, 3, 5)).toBe(5)
  })

  it('drops the item when nothing is in stock', () => {
    expect(mergedQuantity(2, 0, 0)).toBe(0)
  })
})

describe('fitsInStock', () => {
  it('counts what is already in the cart', () => {
    expect(fitsInStock(0, 5, 5)).toBe(true)
    expect(fitsInStock(3, 3, 5)).toBe(false)
    expect(fitsInStock(2, 3, 5)).toBe(true)
  })
})
