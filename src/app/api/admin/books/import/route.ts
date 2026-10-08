import { BookCsvService } from '@/lib/services/bookCsvService'
import { handle, json } from '@/lib/api/handler'
import { requireAdminUser } from '@/lib/api/guards'

export const dynamic = 'force-dynamic'

// POST /api/admin/books/import?dryRun=true - body is the CSV text (Content-Type text/csv).
// Columns: isbn, title, author, price, stock, categories (names separated by |), description; id is ignored.
// Books are matched by ISBN: a known ISBN is updated, anything else is added. The file is
// all or nothing: any bad row answers 400 CSV_INVALID with the row numbers and nothing changes.
export const POST = handle(async (request) => {
  const admin = await requireAdminUser()
  const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true'
  const text = await request.text()
  return json(await BookCsvService.import(admin.id, text, dryRun))
})
