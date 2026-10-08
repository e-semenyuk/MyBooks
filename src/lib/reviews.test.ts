import { describe, expect, it } from 'vitest'
import { publicName, summarizeRatings } from './reviews'

describe('summarizeRatings', () => {
  it('is zero without reviews', () => {
    expect(summarizeRatings([])).toEqual({ average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
  })
  it('averages to one decimal and counts each star', () => {
    const s = summarizeRatings([5, 4, 4])
    expect(s.average).toBe(4.3)
    expect(s.count).toBe(3)
    expect(s.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 2, 5: 1 })
  })
  it('ignores values outside 1 to 5', () => {
    expect(summarizeRatings([0, 6, 2.5, 3]).count).toBe(1)
  })
})

describe('publicName', () => {
  it('shortens the last name', () => {
    expect(publicName('Una User')).toBe('Una U.')
    expect(publicName('  mary  jane watson ')).toBe('mary W.')
    expect(publicName('Cher')).toBe('Cher')
    expect(publicName('   ')).toBe('Reader')
  })
})
