import type {
  Book as BookRow,
  Order as OrderRow,
  OrderItem as OrderItemRow,
  OrderEvent,
} from '@prisma/client'
import { fromCents } from '@/lib/money'
import type { Book, Order, OrderItem, OrderItemWithBook, OrderWithItems } from '@/types'

// Database rows hold integer cents. The public API keeps dollars so clients
// do not change when the storage format does.

export function mapBook(row: BookRow): Book {
  const { priceCents, ...rest } = row
  return { ...rest, price: fromCents(priceCents) }
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
  const { totalCents, orderItems, ...rest } = row
  return {
    ...rest,
    totalAmount: fromCents(totalCents),
    ...(orderItems ? { orderItems: orderItems.map((item) => mapOrderItem(item)) } : {}),
  }
}
