import { describe, expect, it } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it.each([
    ['Fiction', 'fiction'],
    ['Science Fiction & Fantasy', 'science-fiction-and-fantasy'],
    ['  Non-Fiction  ', 'non-fiction'],
    ['Café Society', 'cafe-society'],
    ['A / B / C', 'a-b-c'],
  ])('turns %j into %j', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })

  it('returns an empty string when nothing usable is left', () => {
    expect(slugify('***')).toBe('')
  })
})
