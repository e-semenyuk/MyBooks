import type {
  Book as BookRow,
  Order as OrderRow,
  OrderItem as OrderItemRow,
  OrderEvent,
  Category,
  Payment,
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
  const { priceCents, categories, cover, imageUrl, ...rest } = row
  return {
    ...rest,
    price: fromCents(priceCents),
    // An uploaded cover wins over a linked picture
    ...(cover !== undefined
      ? { coverUrl: cover ? `/api/books/${row.id}/cover?v=${cover.updatedAt.getTime()}` : imageUrl }
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

type EventRows = { events?: OrderEvent[]; payments?: Payment[] }

export function mapOrder(row: OrderRow & EventRows & { orderItems: (ItemRow & { book: BookRow })[] }): OrderWithItems
export function mapOrder(row: OrderRow & EventRows & { orderItems?: ItemRow[] }): Order
export function mapOrder(row: OrderRow & EventRows & { orderItems?: ItemRow[] }): Order {
  const { totalCents, subtotalCents, discountCents, shippingCents, taxCents, orderItems, payments, ...rest } = row
  // The payment that belongs to the order: the newest one that took money
  const paid = payments?.find((p) => p.status === 'PAID' || p.status === 'REFUNDED')
  return {
    ...rest,
    ...(payments !== undefined
      ? { payment: paid ? { status: paid.status, cardBrand: paid.cardBrand, cardLast4: paid.cardLast4 } : null }
      : {}),
    subtotal: fromCents(subtotalCents),
    discount: fromCents(discountCents),
    shipping: fromCents(shippingCents),
    tax: fromCents(taxCents),
    totalAmount: fromCents(totalCents),
    ...(orderItems ? { orderItems: orderItems.map((item) => mapOrderItem(item)) } : {}),
  }
}
