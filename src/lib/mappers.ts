import type {
  Book as BookRow,
  Order as OrderRow,
  OrderItem as OrderItemRow,
  OrderEvent,
  Category,
} from '@prisma/client'
import { fromCents } from '@/lib/money'
import type { Book, Order, OrderItem, OrderItemWithBook, OrderWithItems } from '@/types'

// Database rows hold integer cents. The public API keeps dollars so clients
// do not change when the storage format does.

type BookRowWithCategories = BookRow & {
  categories?: { category: Category }[]
  cover?: { updatedAt: Date } | null
}

export function mapBook(row: BookRowWithCategories): Book {
  const { priceCents, categories, cover, ...rest } = row
  return {
    ...rest,
    price: fromCents(priceCents),
    ...(cover !== undefined
      ? { coverUrl: cover ? `/api/books/${row.id}/cover?v=${cover.updatedAt.getTime()}` : null }
      : {}),
    ...(categories ? { categories: categories.map((link) => link.category).sort((a, b) => a.name.localeCompare(b.name)) } : {}),
  }
}

type ItemRow = OrderItemRow & { book?: BookRow }

export function mapOrderItem(row: ItemRow & { book: BookRow }): OrderItemWithBook
export function mapOrderItem(row: ItemRow): OrderItem
export function mapOrderItem(row: ItemRow): OrderItem {
  const { priceCents, book, ...rest } = row
  return {
    ...rest,
    price: fromCents(priceCents),
    ...(book ? { book: mapBook(book) } : {}),
  }
}

type EventRows = { events?: OrderEvent[] }

export function mapOrder(row: OrderRow & EventRows & { orderItems: (ItemRow & { book: BookRow })[] }): OrderWithItems
export function mapOrder(row: OrderRow & EventRows & { orderItems?: ItemRow[] }): Order
export function mapOrder(row: OrderRow & EventRows & { orderItems?: ItemRow[] }): Order {
  const { totalCents, subtotalCents, discountCents, shippingCents, taxCents, orderItems, ...rest } = row
  return {
    ...rest,
    subtotal: fromCents(subtotalCents),
    discount: fromCents(discountCents),
    shipping: fromCents(shippingCents),
    tax: fromCents(taxCents),
    totalAmount: fromCents(totalCents),
    ...(orderItems ? { orderItems: orderItems.map((item) => mapOrderItem(item)) } : {}),
  }
}
