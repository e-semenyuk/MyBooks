import { BookService } from '@/lib/services/bookService'
import { handle, json, parseBody } from '@/lib/api/handler'
import { requireAdminUser } from '@/lib/api/guards'
import { bookListQuerySchema, createBookSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// GET /api/books - filtered, sorted, paged catalog
export const GET = handle(async (request) => {
  const filters = bookListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  return json(await BookService.listBooks(filters))
})

// POST /api/books - Create a new book (admin only)
export const POST = handle(async (request) => {
  await requireAdminUser()
  const body = await parseBody(request, createBookSchema)

  const book = await BookService.createBook(body)
  return json(book, 201)
})
