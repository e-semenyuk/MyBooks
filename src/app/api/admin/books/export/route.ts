import { BookCsvService } from '@/lib/services/bookCsvService'
import { handle } from '@/lib/api/handler'
import { requireAdminUser } from '@/lib/api/guards'

export const dynamic = 'force-dynamic'

// GET /api/admin/books/export - the whole catalog as a CSV download (admin only)
export const GET = handle(async () => {
  await requireAdminUser()
  const csv = await BookCsvService.export()
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="books.csv"',
      'Cache-Control': 'no-store',
    },
  })
})
