import type { OrderStatus } from '@/lib/orderStatus'

// Database Models
export interface Category {
  id: number
  name: string
  slug: string
}

export interface CategoryWithCount extends Category {
  bookCount: number
}

export interface Book {
  id: number
  title: string
  author: string
  isbn: string | null
  price: number
  description: string | null
  stockQuantity: number
  categories?: Category[]
  coverUrl?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface PagedBooks {
  items: Book[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CartItem {
  id: number
  bookId: number
  quantity: number
  sessionId: string | null
  userId: number | null
  createdAt?: Date
  updatedAt?: Date
}

export interface Order {
  id: number
  userId?: number | null
  customerName: string
  customerEmail: string
  customerAddress: string
  orderDate: Date
  subtotal: number
  discount: number
  shipping: number
  tax: number
  totalAmount: number
  shippingMethod: 'STANDARD' | 'EXPRESS'
  promoCode: string | null
  status: OrderStatus
  orderItems?: OrderItem[]
  events?: OrderStatusEvent[]
  createdAt?: Date
  updatedAt?: Date
}

export interface OrderStatusEvent {
  id: number
  orderId: number
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  actorId: number | null
  createdAt: Date
}

export interface OrderItem {
  id: number
  orderId: number
  bookId: number
  quantity: number
  price: number
  book?: Book
}

// API Request/Response Types
export interface CreateBookRequest {
  title: string
  author: string
  isbn?: string
  price: number
  description?: string
  stockQuantity: number
  categoryIds?: number[]
}

export interface UpdateBookRequest {
  title?: string
  author?: string
  isbn?: string
  price?: number
  description?: string
  stockQuantity?: number
  categoryIds?: number[]
}

export interface AddToCartRequest {
  bookId: number
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface CreateOrderRequest {
  shippingMethod?: 'STANDARD' | 'EXPRESS'
  promoCode?: string
  customerName: string
  customerEmail: string
  customerAddress: string
}

// Extended Types for Display
export interface CartItemWithBook extends CartItem {
  book: Book
}

export interface OrderWithItems extends Order {
  orderItems: OrderItemWithBook[]
}

export interface OrderItemWithBook extends OrderItem {
  book: Book
}

// API Error Response
export interface ApiError {
  error: string
  details?: string
}

