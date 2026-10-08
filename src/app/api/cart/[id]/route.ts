import { NextRequest, NextResponse } from 'next/server'
import { CartService } from '@/lib/services/cartService'
import { UpdateCartItemRequest } from '@/types'
import { getOrCreateSessionId } from '@/lib/session'

// PUT /api/cart/:id - Update cart item quantity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = await getOrCreateSessionId()
    const { id } = await params
    const itemId = parseInt(id)

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid cart item ID' },
        { status: 400 }
      )
    }

    const body: UpdateCartItemRequest = await request.json()

    if (!body.quantity || body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      )
    }

    const cartItem = await CartService.updateCartItem(sessionId, itemId, body.quantity)

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(cartItem)
  } catch (error) {
    console.error('Error updating cart item:', error)
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

// DELETE /api/cart/:id - Remove cart item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = await getOrCreateSessionId()
    const { id } = await params
    const itemId = parseInt(id)

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid cart item ID' },
        { status: 400 }
      )
    }

    const removed = await CartService.removeCartItem(sessionId, itemId)

    if (!removed) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Item removed from cart' })
  } catch (error) {
    console.error('Error removing cart item:', error)
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}

