import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api/errors'
import { CsvError, parseCsv, toCsv, unsafeCell } from '@/lib/csv'
import { slugify } from '@/lib/slug'
import { toCents, fromCents } from '@/lib/money'
import { AuditService } from '@/lib/services/auditService'
import { createBookSchema } from '@/lib/validation/schemas'

export const CSV_COLUMNS = ['id', 'isbn', 'title', 'author', 'price', 'stock', 'categories', 'description'] as const
export const MAX_CSV_CHARS = 1_000_000
export const MAX_CSV_ROWS = 1000

interface RowError {
  row: number
  message: string
}

interface ParsedRow {
  row: number
  isbn: string | null
  title: string
  author: string
  priceCents: number
  stock: number
  description: string | null
  categories: string[] | null
}

const HEADER_ALIASES: Record<string, string> = { stockquantity: 'stock', quantity: 'stock', category: 'categories' }

export class BookCsvService {
  static async export(): Promise<string> {
    const books = await prisma.book.findMany({
      orderBy: { id: 'asc' },
      include: { categories: { include: { category: true } } },
    })
    return toCsv([
      [...CSV_COLUMNS],
      ...books.map((b) => [
        b.id,
        b.isbn,
        b.title,
        b.author,
        fromCents(b.priceCents).toFixed(2),
        b.stockQuantity,
        b.categories.map((c) => c.category.name).sort().join('|'),
        b.description,
      ]),
    ])
  }

  // Reads and checks the whole file. Nothing is written unless every row is valid.
  static parse(text: string): { rows: ParsedRow[]; errors: RowError[] } {
    if (text.length > MAX_CSV_CHARS) throw ApiError.badRequest('The file is too large (1 MB at most)', 'CSV_TOO_LARGE')
    let table: string[][]
    try {
      table = parseCsv(text)
    } catch (error) {
      if (error instanceof CsvError) throw ApiError.badRequest(error.message, 'CSV_INVALID')
      throw error
    }
    if (table.length === 0) throw ApiError.badRequest('The file is empty', 'CSV_INVALID')
    if (table.length - 1 > MAX_CSV_ROWS) {
      throw ApiError.badRequest(`The file has more than ${MAX_CSV_ROWS} books`, 'CSV_TOO_LARGE')
    }

    const header = table[0].map((h) => {
      const key = h.trim().toLowerCase()
      return HEADER_ALIASES[key] ?? key
    })
    const missing = ['title', 'author', 'price', 'stock'].filter((c) => !header.includes(c))
    if (missing.length) {
      throw ApiError.badRequest(`Missing column: ${missing.join(', ')}`, 'CSV_INVALID')
    }
    const col = (cells: string[], name: string) => {
      const i = header.indexOf(name)
      return i === -1 ? undefined : unsafeCell((cells[i] ?? '').trim())
    }

    const rows: ParsedRow[] = []
    const errors: RowError[] = []
    const seenIsbn = new Map<string, number>()

    table.slice(1).forEach((cells, index) => {
      const row = index + 2
      const fail = (message: string) => errors.push({ row, message })
      const priceText = col(cells, 'price') ?? ''
      const stockText = col(cells, 'stock') ?? ''
      if (!/^\d+(\.\d{1,2})?$/.test(priceText)) return fail('Price must be a number like 12.99')
      if (!/^\d+$/.test(stockText)) return fail('Stock must be a whole number')

      const parsed = createBookSchema.safeParse({
        title: col(cells, 'title'),
        author: col(cells, 'author'),
        isbn: col(cells, 'isbn') || undefined,
        price: Number(priceText),
        stockQuantity: Number(stockText),
        description: col(cells, 'description') || undefined,
      })
      if (!parsed.success) return fail(parsed.error.issues[0].message)

      const categoriesText = col(cells, 'categories')
      // An empty cell keeps the categories the book already has
      const names = categoriesText ? categoriesText.split('|').map((c) => c.trim()).filter(Boolean) : []
      const categories = names.length ? names : null
      if (categories) {
        if (categories.length > 10) return fail('At most 10 categories')
        if (categories.some((c) => c.length > 60 || !slugify(c))) return fail('A category name is not valid')
      }

      const isbn = parsed.data.isbn ?? null
      if (isbn) {
        const key = isbn.toLowerCase()
        const first = seenIsbn.get(key)
        if (first) return fail(`ISBN ${isbn} already appears in row ${first}`)
        seenIsbn.set(key, row)
      }

      rows.push({
        row,
        isbn,
        title: parsed.data.title!,
        author: parsed.data.author!,
        priceCents: toCents(parsed.data.price!),
        stock: parsed.data.stockQuantity!,
        description: parsed.data.description ?? null,
        categories,
      })
    })
    return { rows, errors }
  }

  // Books are matched by ISBN: a known ISBN updates the book, anything else is added.
  static async import(actorId: number, text: string, dryRun: boolean) {
    const { rows, errors } = this.parse(text)
    if (errors.length) {
      throw ApiError.badRequest(`${errors.length} row${errors.length === 1 ? '' : 's'} could not be imported. Nothing was changed.`, 'CSV_INVALID', {
        errors: errors.slice(0, 100),
        totalErrors: errors.length,
      })
    }

    const isbns = rows.map((r) => r.isbn).filter((i): i is string => !!i)
    const existing = await prisma.book.findMany({ where: { isbn: { in: isbns } } })
    const byIsbn = new Map(existing.map((b) => [b.isbn!.toLowerCase(), b]))
    const plan = rows.map((r) => ({ ...r, current: r.isbn ? byIsbn.get(r.isbn.toLowerCase()) ?? null : null }))
    const created = plan.filter((p) => !p.current).length
    const updated = plan.length - created
    if (dryRun) return { dryRun: true, created, updated }

    const changes: { id: number; title: string; priceFrom?: number; priceTo?: number; stockFrom?: number; stockTo?: number }[] = []
    await prisma.$transaction(
      async (tx) => {
        const categoryIds = new Map<string, number>()
        const wanted = Array.from(new Set(plan.flatMap((p) => p.categories ?? [])))
        for (const name of wanted) {
          const slug = slugify(name)
          const found =
            (await tx.category.findFirst({ where: { OR: [{ slug }, { name: { equals: name, mode: 'insensitive' } }] } })) ??
            (await tx.category.create({ data: { name, slug } }))
          categoryIds.set(name, found.id)
        }
        for (const p of plan) {
          const links = p.categories ? p.categories.map((c) => ({ categoryId: categoryIds.get(c)! })) : undefined
          const dedupedLinks = links ? Array.from(new Map(links.map((l) => [l.categoryId, l])).values()) : undefined
          const data = {
            title: p.title,
            author: p.author,
            isbn: p.isbn,
            priceCents: p.priceCents,
            stockQuantity: p.stock,
            description: p.description,
          }
          if (p.current) {
            await tx.book.update({
              where: { id: p.current.id },
              data: { ...data, ...(dedupedLinks ? { categories: { deleteMany: {}, create: dedupedLinks } } : {}) },
            })
            changes.push({
              id: p.current.id,
              title: p.title,
              ...(p.current.priceCents !== p.priceCents ? { priceFrom: fromCents(p.current.priceCents), priceTo: fromCents(p.priceCents) } : {}),
              ...(p.current.stockQuantity !== p.stock ? { stockFrom: p.current.stockQuantity, stockTo: p.stock } : {}),
            })
          } else {
            await tx.book.create({ data: { ...data, ...(dedupedLinks ? { categories: { create: dedupedLinks } } : {}) } })
          }
        }
      },
      { timeout: 30_000 }
    )

    for (const c of changes) {
      if (c.priceTo !== undefined) {
        await AuditService.record(actorId, 'BOOK_PRICE_CHANGED', 'book', c.id, `"${c.title}" price ${c.priceFrom!.toFixed(2)} to ${c.priceTo.toFixed(2)} (CSV import)`, { from: c.priceFrom!, to: c.priceTo })
      }
      if (c.stockTo !== undefined) {
        await AuditService.record(actorId, 'BOOK_STOCK_CHANGED', 'book', c.id, `"${c.title}" stock ${c.stockFrom} to ${c.stockTo} (CSV import)`, { from: c.stockFrom!, to: c.stockTo })
      }
    }
    await AuditService.record(actorId, 'BOOKS_IMPORTED', 'book', null, `CSV import: ${created} added, ${updated} updated`, { created, updated })
    return { dryRun: false, created, updated }
  }
}
