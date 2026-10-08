// Pure module: wording and rules for order notifications (XPANBFLFA-53, 59).

export const LOCALES = ['en', 'es', 'de'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export type NotificationKind = 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ORDER_CANCELLED'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

// First supported language in an Accept-Language header, by quality.
export function pickLocale(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE
  const ranked = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      const quality = q ? Number(q.slice(2)) : 1
      return { lang: tag.trim().toLowerCase().split('-')[0], quality: Number.isFinite(quality) ? quality : 0, index }
    })
    .filter((entry) => entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)
  for (const { lang } of ranked) if (isLocale(lang)) return lang
  return DEFAULT_LOCALE
}

// Confirmation and cancellation go to everyone; shipment news only to Express
// orders (the story promises it for Express shipping).
export function shouldNotify(kind: NotificationKind, shippingMethod: string): boolean {
  if (kind === 'ORDER_SHIPPED') return shippingMethod === 'EXPRESS'
  return true
}

const CURRENCY_LOCALE: Record<Locale, string> = { en: 'en-US', es: 'es-ES', de: 'de-DE' }

const TEXT: Record<Locale, Record<NotificationKind, { title: (id: number) => string; body: (id: number, total: string) => string }>> = {
  en: {
    ORDER_CONFIRMED: { title: (id) => `Order #${id} confirmed`, body: (id, t) => `Your order #${id} has been confirmed! Total ${t}.` },
    ORDER_SHIPPED: { title: (id) => `Order #${id} shipped`, body: (id) => `Your Express order #${id} is on its way.` },
    ORDER_CANCELLED: { title: (id) => `Order #${id} cancelled`, body: (id, t) => `Your order #${id} was cancelled. ${t} will be refunded.` },
  },
  es: {
    ORDER_CONFIRMED: { title: (id) => `Pedido #${id} confirmado`, body: (id, t) => `¡Tu pedido #${id} ha sido confirmado! Total ${t}.` },
    ORDER_SHIPPED: { title: (id) => `Pedido #${id} enviado`, body: (id) => `Tu pedido Express #${id} está en camino.` },
    ORDER_CANCELLED: { title: (id) => `Pedido #${id} cancelado`, body: (id, t) => `Tu pedido #${id} fue cancelado. Se reembolsarán ${t}.` },
  },
  de: {
    ORDER_CONFIRMED: { title: (id) => `Bestellung #${id} bestätigt`, body: (id, t) => `Ihre Bestellung #${id} wurde bestätigt! Gesamtbetrag ${t}.` },
    ORDER_SHIPPED: { title: (id) => `Bestellung #${id} versandt`, body: (id) => `Ihre Express-Bestellung #${id} ist unterwegs.` },
    ORDER_CANCELLED: { title: (id) => `Bestellung #${id} storniert`, body: (id, t) => `Ihre Bestellung #${id} wurde storniert. ${t} werden erstattet.` },
  },
}

export interface OrderMessageInput {
  orderId: number
  totalCents: number
  locale: Locale
}

export function orderMessage(kind: NotificationKind, { orderId, totalCents, locale }: OrderMessageInput) {
  const total = new Intl.NumberFormat(CURRENCY_LOCALE[locale], { style: 'currency', currency: 'USD' }).format(totalCents / 100)
  const text = TEXT[locale][kind]
  return { title: text.title(orderId), body: text.body(orderId, total) }
}
