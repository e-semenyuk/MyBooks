import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slug'
import { ApiError } from '@/lib/api/errors'
import { Category, CategoryWithCount } from '@/types'

export class CategoryService {
  static async list(): Promise<CategoryWithCount[]> {
    const rows = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { books: true } } },
    })
    return rows.map(({ _count, ...category }) => ({ ...category, bookCount: _count.books }))
  }

  static async create(name: string): Promise<Category> {
    const slug = slugify(name)
    if (!slug) throw ApiError.badRequest('Category name must contain letters or digits', 'INVALID_CATEGORY_NAME')

    const clash = await prisma.category.findFirst({
      where: { OR: [{ slug }, { name: { equals: name, mode: 'insensitive' } }] },
    })
    if (clash) throw ApiError.conflict('A category with this name already exists', 'CATEGORY_EXISTS')

    return await prisma.category.create({ data: { name, slug } })
  }

  static async rename(id: number, name: string): Promise<Category> {
    const slug = slugify(name)
    if (!slug) throw ApiError.badRequest('Category name must contain letters or digits', 'INVALID_CATEGORY_NAME')

    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) throw ApiError.notFound('Category not found', 'CATEGORY_NOT_FOUND')

    const clash = await prisma.category.findFirst({
      where: { id: { not: id }, OR: [{ slug }, { name: { equals: name, mode: 'insensitive' } }] },
    })
    if (clash) throw ApiError.conflict('A category with this name already exists', 'CATEGORY_EXISTS')

    return await prisma.category.update({ where: { id }, data: { name, slug } })
  }

  // A category that still has books is kept; move or remove the books first.
  static async remove(id: number): Promise<void> {
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } },
    })
    if (!existing) throw ApiError.notFound('Category not found', 'CATEGORY_NOT_FOUND')
    if (existing._count.books > 0) {
      throw ApiError.conflict(
        `Category is used by ${existing._count.books} book(s) and cannot be deleted`,
        'CATEGORY_IN_USE'
      )
    }
    await prisma.category.delete({ where: { id } })
  }
}
