import { NextResponse } from 'next/server'
import { CartService } from '@/lib/services/cartService'
import { getOrCreateSessionId } from '@/lib/session'

// GET /api/cart/total - Get cart total
export async function GET() {
  try {
    const sessionId = await getOrCreateSessionId()
    const total = await CartService.calculateCartTotal(sessionId)

    return NextResponse.json(total)
  } catch (error) {
    console.error('Error calculating cart total:', error)
    return NextResponse.json(
      { error: 'Failed to calculate cart total' },
      { status: 500 }
    )
  }
}

