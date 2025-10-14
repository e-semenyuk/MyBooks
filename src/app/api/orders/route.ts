import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/services/orderService'
import { getOrCreateSessionId } from '@/lib/session'
import { CreateOrderRequest } from '@/types'

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const status = searchParams.get('status')

    let orders

    if (email) {
      orders = await OrderService.getOrdersByCustomerEmail(email)
    } else if (status) {
      orders = await OrderService.getOrdersByStatus(status)
    } else {
      orders = await OrderService.getAllOrders()
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
    const sessionId = await getOrCreateSessionId()
    const body: CreateOrderRequest = await request.json()

    // Validation
    if (!body.customerName || !body.customerEmail || !body.customerAddress) {
      return NextResponse.json(
        { error: 'Customer name, email, and address are required' },
        { status: 400 }
      )
    }

    const order = await OrderService.createOrder(sessionId, body)

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 400 }
    )
  }
}

