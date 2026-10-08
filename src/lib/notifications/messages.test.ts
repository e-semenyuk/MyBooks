import { describe, expect, it } from 'vitest'
import { orderMessage, pickLocale, shouldNotify } from './messages'

describe('pickLocale', () => {
  it('defaults to English', () => {
    expect(pickLocale(undefined)).toBe('en')
    expect(pickLocale('')).toBe('en')
    expect(pickLocale('fr-FR,ja;q=0.8')).toBe('en')
  })
  it('takes the best supported language', () => {
    expect(pickLocale('es-MX,es;q=0.9,en;q=0.8')).toBe('es')
    expect(pickLocale('fr;q=0.9,de;q=0.8,en;q=0.5')).toBe('de')
    expect(pickLocale('en;q=0.2,de;q=0.9')).toBe('de')
  })
  it('ignores languages with quality 0', () => {
    expect(pickLocale('de;q=0,es;q=0.1')).toBe('es')
  })
})

describe('shouldNotify', () => {
  it('sends confirmation and cancellation for every method', () => {
    for (const method of ['STANDARD', 'EXPRESS']) {
      expect(shouldNotify('ORDER_CONFIRMED', method)).toBe(true)
      expect(shouldNotify('ORDER_CANCELLED', method)).toBe(true)
    }
  })
  it('sends shipment news for Express only', () => {
    expect(shouldNotify('ORDER_SHIPPED', 'EXPRESS')).toBe(true)
    expect(shouldNotify('ORDER_SHIPPED', 'STANDARD')).toBe(false)
  })
})

describe('orderMessage', () => {
  it('words the confirmation as the story asks', () => {
    const m = orderMessage('ORDER_CONFIRMED', { orderId: 12, totalCents: 4599, locale: 'en' })
    expect(m.title).toBe('Order #12 confirmed')
    expect(m.body).toBe('Your order #12 has been confirmed! Total $45.99.')
  })
  it('translates and formats money for the locale', () => {
    expect(orderMessage('ORDER_CONFIRMED', { orderId: 3, totalCents: 1250, locale: 'es' }).body).toContain('Tu pedido #3')
    const de = orderMessage('ORDER_CANCELLED', { orderId: 3, totalCents: 123456, locale: 'de' })
    expect(de.title).toBe('Bestellung #3 storniert')
    expect(de.body).toMatch(/1\.234,56/)
  })
})
