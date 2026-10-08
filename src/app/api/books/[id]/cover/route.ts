import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handle, json, parseId } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'
import { requireAdminUser } from '@/lib/api/guards'
import { MAX_COVER_BYTES, detectCoverType } from '@/lib/image'

export const dynamic = 'force-dynamic'

// GET /api/books/:id/cover - the uploaded image, or 404 when the book has none
export const GET = handle(async (request, context) => {
  const bookId = await parseId(context, 'book ID')
  const cover = await prisma.bookCover.findUnique({ where: { bookId } })
  if (!cover) throw ApiError.notFound('This book has no cover image', 'COVER_NOT_FOUND')

  const etag = `"${cover.updatedAt.getTime()}-${cover.size}"`
  const headers = {
    ETag: etag,
    // The URL carries ?v=<timestamp>, so a changed cover gets a new address
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  }
  if (request.headers.get('if-none-match') === etag) return new NextResponse(null, { status: 304, headers })

  return new NextResponse(new Uint8Array(cover.data), { headers: { ...headers, 'Content-Type': cover.contentType, 'Content-Length': String(cover.size) } })
})

// PUT /api/books/:id/cover - upload or replace the cover (admin). multipart/form-data, field "file".
export const PUT = handle(async (request, context) => {
  await requireAdminUser()
  const bookId = await parseId(context, 'book ID')

  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > MAX_COVER_BYTES + 64 * 1024) {
    throw ApiError.badRequest('The image must be 2 MB or smaller', 'FILE_TOO_LARGE')
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    throw ApiError.badRequest('Send the image as multipart/form-data in the field "file"', 'INVALID_UPLOAD')
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    throw ApiError.badRequest('Choose an image file', 'INVALID_UPLOAD')
  }
  if (file.size > MAX_COVER_BYTES) {
    throw ApiError.badRequest('The image must be 2 MB or smaller', 'FILE_TOO_LARGE')
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const contentType = detectCoverType(bytes)
  if (!contentType) {
    throw ApiError.badRequest('Only JPEG and PNG images are accepted', 'UNSUPPORTED_IMAGE')
  }

  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true } })
  if (!book) throw ApiError.notFound('Book not found', 'BOOK_NOT_FOUND')

  const saved = await prisma.bookCover.upsert({
    where: { bookId },
    create: { bookId, contentType, data: bytes, size: bytes.length },
    update: { contentType, data: bytes, size: bytes.length },
    select: { updatedAt: true },
  })

  return json({ coverUrl: `/api/books/${bookId}/cover?v=${saved.updatedAt.getTime()}` })
})

// DELETE /api/books/:id/cover - remove the cover; the generated one is shown again (admin)
export const DELETE = handle(async (_request, context) => {
  await requireAdminUser()
  const bookId = await parseId(context, 'book ID')
  await prisma.bookCover.deleteMany({ where: { bookId } })
  return json({ message: 'Cover removed successfully' })
})
