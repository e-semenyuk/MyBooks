import { BookService } from '@/lib/services/bookService'
import { handle, json, parseId } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

// GET /api/books/:id/related - up to 4 books that share a category or the author
export const GET = handle(async (_request, context) => {
  const bookId = await parseId(context, 'book ID')
  const related = await BookService.getRelatedBooks(bookId)
  if (!related) throw ApiError.notFound('Book not found', 'BOOK_NOT_FOUND')
  return json(related)
})
