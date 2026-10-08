export const MAX_COVER_BYTES = 2 * 1024 * 1024

export type CoverType = 'image/jpeg' | 'image/png'

// The browser's file type is only a claim; the first bytes say what the file is.
export function detectCoverType(bytes: Uint8Array): CoverType | null {
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) {
    return 'image/png'
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  return null
}
