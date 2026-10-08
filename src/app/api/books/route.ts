import { BookService } from '@/lib/services/bookService'
import { handle, json, parseBody } from '@/lib/api/handler'
import { requireAdminUser } from '@/lib/api/guards'
import { createBookSchema } from '@/lib/validation/schemas'

// GET /api/books - Get all books or search books
export const GET = handle(async (request) => {
  const query = request.nextUrl.searchParams.get('query')

  const books = query
    ? await BookService.searchBooks(query)
    : await BookService.getAllBooks()

  return json(books)
})

// POST /api/books - Create a new book (admin only)
export const POST = handle(async (request) => {
  await requireAdminUser()
  const body = await parseBody(request, createBookSchema)

  const book = await BookService.createBook(body)
  return json(book, 201)
})
