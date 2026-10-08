import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/mailer'
import { appUrl } from '@/lib/emails'
import { deliverPush } from './push'
import { isLocale, orderMessage, shouldNotify, DEFAULT_LOCALE, type NotificationKind } from './messages'

// Tells the customer about an order event by email and, when they allowed it,
// by push. Never throws: a notification problem must not undo an order.
export async function notifyOrderEvent(
  orderId: number,
  kind: NotificationKind,
  transport: typeof deliverPush = deliverPush
): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { include: { pushSubscriptions: true } } },
    })
    const user = order?.user
    if (!order || !user || !shouldNotify(kind, order.shippingMethod)) return

    const locale = isLocale(user.locale) ? user.locale : DEFAULT_LOCALE
    const { title, body } = orderMessage(kind, { orderId, totalCents: order.totalCents, locale })
    const url = `${appUrl()}/orders/${orderId}`

    await sendEmail({
      to: user.email,
      subject: title,
      text: [`${user.name},`, '', body, '', url].join('\n'),
    })

    if (user.pushSubscriptions.length === 0) return
    const message = await prisma.pushMessage.create({
      data: { userId: user.id, kind, orderId, title, body, url: `/orders/${orderId}` },
    })
    let delivered = false
    let failure: string | null = null
    for (const sub of user.pushSubscriptions) {
      try {
        const result = await transport(sub, { title, body, url: `/orders/${orderId}` })
        if (result === 'sent') delivered = true
        if (result === 'gone') await prisma.pushSubscription.deleteMany({ where: { id: sub.id } })
      } catch (error: any) {
        failure = String(error?.message ?? error).slice(0, 500)
      }
    }
    await prisma.pushMessage.update({
      where: { id: message.id },
      data: { sentAt: delivered ? new Date() : null, error: delivered ? null : failure },
    })
  } catch (error: any) {
    console.error('Order notification failed:', error?.message ?? error)
  }
}
