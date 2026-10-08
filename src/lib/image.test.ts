import { describe, expect, it } from 'vitest'
import { MAX_COVER_BYTES, detectCoverType } from './image'

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0x10]

describe('detectCoverType', () => {
  it('recognises PNG and JPEG by their first bytes', () => {
    expect(detectCoverType(new Uint8Array(PNG))).toBe('image/png')
    expect(detectCoverType(new Uint8Array(JPEG))).toBe('image/jpeg')
  })

  it('rejects other formats and disguised files', () => {
    expect(detectCoverType(new TextEncoder().encode('GIF89a......'))).toBeNull()
    expect(detectCoverType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull()
    expect(detectCoverType(new TextEncoder().encode('<html><script>alert(1)</script>'))).toBeNull()
    expect(detectCoverType(new Uint8Array([0x89, 0x50, 0x4e]))).toBeNull()
    expect(detectCoverType(new Uint8Array([]))).toBeNull()
  })

  it('keeps the size limit at 2 MB', () => {
    expect(MAX_COVER_BYTES).toBe(2097152)
  })
})
