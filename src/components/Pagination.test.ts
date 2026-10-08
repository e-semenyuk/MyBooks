import { describe, expect, it } from 'vitest'
import { pageWindow } from './Pagination'

describe('pageWindow', () => {
  it('lists every page when there are few', () => {
    expect(pageWindow(1, 1)).toEqual([1])
    expect(pageWindow(3, 4)).toEqual([1, 2, 3, 4])
    expect(pageWindow(5, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('collapses the middle of a long list', () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, 3, 4, 'gap', 20])
    expect(pageWindow(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20])
    expect(pageWindow(20, 20)).toEqual([1, 'gap', 17, 18, 19, 20])
  })

  it('does not add a gap between neighbours', () => {
    expect(pageWindow(4, 20)).toEqual([1, 2, 3, 4, 5, 'gap', 20])
  })
})
