import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/services/orderService'
import { getOrCreateSessionId } from '@/lib/session'
import { CreateOrderRequest } from '@/types'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAdmin } from '@/lib/auth-helpers'

// GET /api/orders - Get all orders (admin only) or user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    let orders: any[] = []

    // If user is logged in but not admin, only return their orders
    if (session && (session.user as any).role !== 'ADMIN') {
      const userEmail = session.user?.email
      orders = await OrderService.getOrdersByCustomerEmail(userEmail!)
    } 
    // Admin can query by email, status, userId, or get all
    else if (session && (session.user as any).role === 'ADMIN') {
      if (email) {
        orders = await OrderService.getOrdersByCustomerEmail(email)
      } else if (status) {
        orders = await OrderService.getOrdersByStatus(status)
      } else if (userId) {
        orders = await OrderService.getOrdersByUserId(parseInt(userId))
      } else {
        orders = await OrderService.getAllOrders()
      }
    }
    // Not logged in - no orders
    else {
      orders = []
    }

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionId = await getOrCreateSessionId()
    const body: CreateOrderRequest = await request.json()

    // Validation
    if (!body.customerName || !body.customerEmail || !body.customerAddress) {
      return NextResponse.json(
        { error: 'Customer name, email, and address are required' },
        { status: 400 }
      )
    }

    // Get userId if user is logged in
    const userId = session ? parseInt((session.user as any).id) : null

    const order = await OrderService.createOrder(sessionId, body, userId)

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 400 }
    )
  }
}

