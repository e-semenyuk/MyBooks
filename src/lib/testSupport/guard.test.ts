import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { assertTestEndpointsAllowed } from './guard'

const SECRET = 'a-test-secret-of-16+'
const request = (secret?: string) =>
  new NextRequest('http://localhost/api/test/reset', {
    method: 'POST',
    headers: secret ? { 'x-test-secret': secret } : {},
  })

describe('assertTestEndpointsAllowed', () => {
  const original = { ...process.env }

  beforeEach(() => {
    process.env.ENABLE_TEST_ENDPOINTS = 'true'
    process.env.TEST_SECRET = SECRET
    delete process.env.VERCEL_ENV
  })
  afterEach(() => {
    process.env = { ...original }
  })

  it('allows the call with the flag and the right secret', () => {
    expect(() => assertTestEndpointsAllowed(request(SECRET))).not.toThrow()
  })

  it.each([
    ['no secret header', undefined],
    ['wrong secret', 'x'.repeat(SECRET.length)],
    ['secret of other length', 'short'],
  ])('answers 404 for %s', (_name, secret) => {
    expect(() => assertTestEndpointsAllowed(request(secret))).toThrowError(
      expect.objectContaining({ status: 404 })
    )
  })

  it('answers 404 when the flag is off', () => {
    process.env.ENABLE_TEST_ENDPOINTS = 'false'
    expect(() => assertTestEndpointsAllowed(request(SECRET))).toThrowError(
      expect.objectContaining({ status: 404 })
    )
  })

  it('answers 404 when the secret is too short to be safe', () => {
    process.env.TEST_SECRET = 'short'
    expect(() => assertTestEndpointsAllowed(request('short'))).toThrowError(
      expect.objectContaining({ status: 404 })
    )
  })

  it('never serves a Vercel production deployment', () => {
    process.env.VERCEL_ENV = 'production'
    expect(() => assertTestEndpointsAllowed(request(SECRET))).toThrowError(
      expect.objectContaining({ status: 404 })
    )
  })
})
