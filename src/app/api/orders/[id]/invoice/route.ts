import { NextResponse } from 'next/server'
import { OrderService } from '@/lib/services/orderService'
import { handle, parseId } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'
import { requireUser } from '@/lib/api/guards'
import { buildInvoicePdf, invoiceNumber } from '@/lib/invoice'

export const dynamic = 'force-dynamic'

// GET /api/orders/:id/invoice - the invoice as a PDF, for orders that were paid (owner or admin)
export const GET = handle(async (_request, context) => {
  const user = await requireUser()
  const orderId = await parseId(context, 'order ID')

  const order = await OrderService.getOrderById(orderId)
  // Someone else's order looks like a missing one
  if (!order || (user.role !== 'ADMIN' && order.userId !== user.id)) {
    throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND')
  }
  if (!order.payment) {
    throw ApiError.conflict('This order has no payment, so there is no invoice', 'NOT_PAID')
  }

  const pdf = await buildInvoicePdf(order)
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoiceNumber(order.id)}.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
})
