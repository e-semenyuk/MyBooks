import { describe, expect, it } from 'vitest'
import { formatAddress } from './address'

describe('formatAddress', () => {
  it('writes one line per part', () => {
    expect(
      formatAddress({
        fullName: 'Jane Doe',
        street: '1 Main Street',
        city: 'New York',
        postalCode: '10001',
        country: 'USA',
      })
    ).toBe('Jane Doe\n1 Main Street\n10001 New York\nUSA')
  })

  it('skips empty parts and extra spaces', () => {
    expect(
      formatAddress({ fullName: ' Jane ', street: '', city: 'Paris', postalCode: '', country: 'France' })
    ).toBe('Jane\nParis\nFrance')
  })
})
