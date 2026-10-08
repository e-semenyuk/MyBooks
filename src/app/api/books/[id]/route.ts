import { BookService } from '@/lib/services/bookService'
import { handle, json, parseBody, parseId } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'
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
  await requireAdminUser()
  const bookId = await parseId(context, 'book ID')
  const body = await parseBody(request, updateBookSchema)

  const book = await BookService.updateBook(bookId, body)
  return json(book)
})

// DELETE /api/books/:id - Delete a book (admin only)
export const DELETE = handle(async (_request, context) => {
  await requireAdminUser()
  const bookId = await parseId(context, 'book ID')

  await BookService.deleteBook(bookId)
  return json({ message: 'Book deleted successfully' })
})
