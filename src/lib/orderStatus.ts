// Pure module (no server imports) so the admin UI can reuse it.

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
}

// The step an admin takes when moving an order forward (no skipping, no cancel).
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'SHIPPED',
  SHIPPED: 'DELIVERED',
}

export function nextStatus(from: OrderStatus): OrderStatus | null {
  return NEXT[from] ?? null
}

// A delivered order can be returned for this many days after delivery.
export const RETURN_WINDOW_DAYS = 30

export function returnWindowOpen(deliveredAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - deliveredAt.getTime() <= RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value)
}

export function allowedTransitions(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from]
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export class InvalidStatusError extends Error {
  readonly code = 'INVALID_STATUS'
  constructor(value: unknown) {
    super(`Invalid order status: ${String(value)}`)
  }
}

export class InvalidTransitionError extends Error {
  readonly code = 'INVALID_TRANSITION'
  constructor(readonly from: OrderStatus, readonly to: OrderStatus) {
    super(`Cannot change order status from ${from} to ${to}`)
  }
}
