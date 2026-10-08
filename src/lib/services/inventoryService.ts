import { prisma } from '@/lib/prisma'
import { lowStockThreshold } from '@/lib/config'

export class InventoryService {
  // Books at or below the threshold, emptiest first.
  static async lowStock(threshold = lowStockThreshold()) {
    const items = await prisma.book.findMany({
      where: { stockQuantity: { lte: threshold } },
      orderBy: [{ stockQuantity: 'asc' }, { title: 'asc' }],
      select: { id: true, title: true, author: true, stockQuantity: true },
    })
    return { threshold, outOfStock: items.filter((b) => b.stockQuantity === 0).length, items }
  }
}
