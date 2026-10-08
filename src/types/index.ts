// Database Models
export interface Book {
  id: number
  title: string
  author: string
  isbn: string | null
  price: number
  description: string | null
  stockQuantity: number
  createdAt?: Date
  updatedAt?: Date
}

export interface CartItem {
  id: number
  bookId: number
  quantity: number
  sessionId: string
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
  totalAmount: number
  status: string
  orderItems?: OrderItem[]
  createdAt?: Date
  updatedAt?: Date
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
}

export interface UpdateBookRequest {
  title?: string
  author?: string
  isbn?: string
  price?: number
  description?: string
  stockQuantity?: number
}

export interface AddToCartRequest {
  bookId: number
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface CreateOrderRequest {
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

