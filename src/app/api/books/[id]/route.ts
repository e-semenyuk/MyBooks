import { BookService } from '@/lib/services/bookService'
import { handle, json, parseBody, parseId } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'
import { AuditService } from '@/lib/services/auditService'
import { requireAdminUser } from '@/lib/api/guards'
import { updateBookSchema } from '@/lib/validation/schemas'

// GET /api/books/:id - Get a book by ID
export const GET = handle(async (_request, context) => {
  const bookId = await parseId(context, 'book ID')
  const book = await BookService.getBookById(bookId)

  if (!book) throw ApiError.notFound('Book not found', 'BOOK_NOT_FOUND')

  return json(book)
})

// PUT /api/books/:id - Update a book (admin only)
export const PUT = handle(async (request, context) => {
  const admin = await requireAdminUser()
  const bookId = await parseId(context, 'book ID')
  const body = await parseBody(request, updateBookSchema)

  const before = await BookService.getBookById(bookId)
  const book = await BookService.updateBook(bookId, body)
  if (before && before.price !== book.price) {
    await AuditService.record(admin.id, 'BOOK_PRICE_CHANGED', 'book', bookId, `"${book.title}" price ${before.price.toFixed(2)} to ${book.price.toFixed(2)}`, { from: before.price, to: book.price })
  }
  if (before && before.stockQuantity !== book.stockQuantity) {
    await AuditService.record(admin.id, 'BOOK_STOCK_CHANGED', 'book', bookId, `"${book.title}" stock ${before.stockQuantity} to ${book.stockQuantity}`, { from: before.stockQuantity, to: book.stockQuantity })
  }
  return json(book)
})

// DELETE /api/books/:id - Delete a book (admin only)
export const DELETE = handle(async (_request, context) => {
  const admin = await requireAdminUser()
  const bookId = await parseId(context, 'book ID')

  const before = await BookService.getBookById(bookId)
  await BookService.deleteBook(bookId)
  await AuditService.record(admin.id, 'BOOK_DELETED', 'book', bookId, `Deleted "${before?.title ?? bookId}"`)
  return json({ message: 'Book deleted successfully' })
})
