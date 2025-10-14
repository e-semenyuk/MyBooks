import { NextRequest, NextResponse } from 'next/server'
import { CartService } from '@/lib/services/cartService'
import { getOrCreateSessionId } from '@/lib/session'
import { AddToCartRequest } from '@/types'

// GET /api/cart - Get cart items for current session
export async function GET() {
  try {
    const sessionId = await getOrCreateSessionId()
    const cartItems = await CartService.getCartItems(sessionId)

    return NextResponse.json(cartItems)
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const sessionId = await getOrCreateSessionId()
    const body: AddToCartRequest = await request.json()

    // Validation
    if (!body.bookId || !body.quantity || body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Valid book ID and quantity are required' },
        { status: 400 }
      )
    }

    const cartItem = await CartService.addToCart(
      sessionId,
      body.bookId,
      body.quantity
    )

    return NextResponse.json(cartItem, { status: 201 })
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE() {
  try {
    const sessionId = await getOrCreateSessionId()
    await CartService.clearCart(sessionId)

    return NextResponse.json({ message: 'Cart cleared successfully' })
  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}

