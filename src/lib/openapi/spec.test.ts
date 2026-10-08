import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { buildOpenApi } from './spec'

describe('OpenAPI document', () => {
  it('matches docs/openapi.json (run "npm run openapi" after API changes)', () => {
    const committed = JSON.parse(readFileSync(resolve(__dirname, '../../../docs/openapi.json'), 'utf8'))
    expect(committed).toEqual(JSON.parse(JSON.stringify(buildOpenApi())))
  })

  it('describes every API route folder', () => {
    const paths = Object.keys(buildOpenApi().paths)
    for (const path of [
      '/api/health', '/api/books', '/api/books/{id}', '/api/books/{id}/cover', '/api/cart', '/api/cart/{id}', '/api/cart/total',
      '/api/cart/merge', '/api/categories', '/api/categories/{id}', '/api/addresses', '/api/addresses/{id}', '/api/checkout/quote', '/api/shipping-methods', '/api/orders', '/api/orders/{id}', '/api/orders/{id}/cancel', '/api/orders/{id}/invoice', '/api/register', '/api/account/me', '/api/account/forgot-password', '/api/account/reset-password', '/api/account/verify-email', '/api/account/resend-verification', '/api/test/emails', '/api/test/reset', '/api/test/seed',
    ]) {
      expect(paths).toContain(path)
    }
  })

  it('takes request bodies from the validators', () => {
    const doc = buildOpenApi()
    const book = doc.paths['/api/books'].post.requestBody.content['application/json'].schema
    expect(book.required).toEqual(['title', 'author', 'price', 'stockQuantity'])
    expect(book.properties.price.minimum).toBe(0)
    const order = doc.paths['/api/orders'].post.requestBody.content['application/json'].schema
    expect(order.properties.customerEmail.format).toBe('email')
  })
})
