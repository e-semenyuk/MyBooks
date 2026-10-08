import { describe, expect, it } from 'vitest'
import { cardBrand, cardExpired, formatCardNumberInput, luhnValid, normalizeCardNumber, normalizeYear } from './card'
import { TEST_CARDS, mockProvider } from './mockProvider'

describe('luhnValid', () => {
  it('accepts well-known test numbers', () => {
    for (const number of Object.values(TEST_CARDS)) expect(luhnValid(number)).toBe(true)
    expect(luhnValid('5555555555554444')).toBe(true)
    expect(luhnValid('378282246310005')).toBe(true)
  })

  it('rejects mistyped numbers and junk', () => {
    expect(luhnValid('4242424242424241')).toBe(false)
    expect(luhnValid('1234')).toBe(false)
    expect(luhnValid('abcdabcdabcdabcd')).toBe(false)
    expect(luhnValid('')).toBe(false)
  })
})

describe('card helpers', () => {
  it('strips spaces and dashes', () => {
    expect(normalizeCardNumber('4242 4242-4242 4242')).toBe('4242424242424242')
  })

  it('names the brand from the first digits', () => {
    expect(cardBrand('4242424242424242')).toBe('Visa')
    expect(cardBrand('5555555555554444')).toBe('Mastercard')
    expect(cardBrand('2221000000000009')).toBe('Mastercard')
    expect(cardBrand('378282246310005')).toBe('Amex')
    expect(cardBrand('6011111111111117')).toBe('Card')
  })

  it('treats two-digit years as 20xx', () => {
    expect(normalizeYear(29)).toBe(2029)
    expect(normalizeYear(2031)).toBe(2031)
  })

  it('keeps a card valid through the last day of its month', () => {
    const now = new Date('2026-10-15T12:00:00')
    expect(cardExpired(10, 2026, now)).toBe(false)
    expect(cardExpired(9, 2026, now)).toBe(true)
    expect(cardExpired(1, 2027, now)).toBe(false)
    expect(cardExpired(12, 25, now)).toBe(true)
  })

  it('groups digits as the shopper types', () => {
    expect(formatCardNumberInput('4242424242424242')).toBe('4242 4242 4242 4242')
    expect(formatCardNumberInput('42a4')).toBe('424')
    expect(formatCardNumberInput('42424242424242424242424')).toBe('4242 4242 4242 4242 424')
  })
})

describe('mockProvider', () => {
  it('approves most cards with a reference', async () => {
    const result = await mockProvider.charge({ amountCents: 1000, cardNumber: TEST_CARDS.SUCCESS })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.ref).toMatch(/^mock_[0-9a-f]{18}$/)
  })

  it.each([
    [TEST_CARDS.DECLINED, 'CARD_DECLINED'],
    [TEST_CARDS.INSUFFICIENT_FUNDS, 'INSUFFICIENT_FUNDS'],
    [TEST_CARDS.PROCESSING_ERROR, 'PROCESSING_ERROR'],
    [TEST_CARDS.TIMEOUT, 'PAYMENT_TIMEOUT'],
  ])('fails card %s with %s', async (cardNumber, code) => {
    const result = await mockProvider.charge({ amountCents: 1000, cardNumber })
    expect(result).toMatchObject({ ok: false, code })
  })

  it('refuses to charge nothing', async () => {
    await expect(mockProvider.charge({ amountCents: 0, cardNumber: TEST_CARDS.SUCCESS })).rejects.toThrow()
  })

  it('gives every success its own reference', async () => {
    const a = await mockProvider.charge({ amountCents: 100, cardNumber: TEST_CARDS.SUCCESS })
    const b = await mockProvider.charge({ amountCents: 100, cardNumber: TEST_CARDS.SUCCESS })
    expect(a.ok && b.ok && a.ref !== b.ref).toBe(true)
  })
})
