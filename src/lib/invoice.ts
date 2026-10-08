import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'
import type { OrderWithItems } from '@/types'

// The standard PDF fonts only cover Western European letters. Anything else is
// replaced with "?" instead of crashing the download.
export function pdfSafe(font: PDFFont, text: string): string {
  const supported = new Set(font.getCharacterSet())
  let out = ''
  for (const char of text.replace(/[\r\t]+/g, ' ')) {
    out += char === '\n' || supported.has(char.codePointAt(0)!) ? char : '?'
  }
  return out
}

export function invoiceNumber(orderId: number): string {
  return `INV-${String(orderId).padStart(6, '0')}`
}

const money = (amount: number) => `$${amount.toFixed(2)}`

function fit(font: PDFFont, text: string, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text
  let cut = text
  while (cut.length > 1 && font.widthOfTextAtSize(`${cut}...`, size) > maxWidth) cut = cut.slice(0, -1)
  return `${cut}...`
}

export async function buildInvoicePdf(order: OrderWithItems): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Invoice ${invoiceNumber(order.id)}`)
  pdf.setProducer('Bookstore')
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const W = 595.28
  const H = 841.89
  const M = 50
  const ink = rgb(0.04, 0.04, 0.045)
  const grey = rgb(0.37, 0.39, 0.43)
  const rule = rgb(0.78, 0.8, 0.84)
  const blue = rgb(0.12, 0.24, 1)

  let page: PDFPage = pdf.addPage([W, H])
  let y = H - M

  const text = (value: string, x: number, size: number, opts: { bold?: boolean; color?: ReturnType<typeof rgb>; right?: boolean } = {}) => {
    const font = opts.bold ? bold : regular
    const safe = pdfSafe(font, value)
    const width = font.widthOfTextAtSize(safe, size)
    page.drawText(safe, { x: opts.right ? x - width : x, y, size, font, color: opts.color ?? ink })
  }
  const line = (x1: number, x2: number, thickness = 0.6, color = rule) =>
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color })

  // Header
  page.drawRectangle({ x: M, y: y - 14, width: 14, height: 14, color: blue })
  y -= 12
  text('bookstore', M + 22, 20, { bold: true })
  text('INVOICE', W - M, 20, { bold: true, right: true })
  y -= 20
  line(M, W - M, 1.6, ink)
  y -= 26

  const refundNote = order.payment?.status === 'REFUNDED'
  text(`Invoice number`, M, 8, { color: grey })
  text(`Date`, 230, 8, { color: grey })
  text(`Order`, 360, 8, { color: grey })
  text(`Status`, 450, 8, { color: grey })
  y -= 14
  text(invoiceNumber(order.id), M, 11, { bold: true })
  text(new Date(order.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 230, 11)
  text(`#${order.id}`, 360, 11)
  text(refundNote ? 'Refunded' : 'Paid', 450, 11, { bold: true, color: refundNote ? rgb(0.78, 0.15, 0.12) : rgb(0.04, 0.48, 0.29) })
  y -= 34

  // Customer and delivery
  text('Billed to', M, 8, { color: grey })
  text('Delivery', 300, 8, { color: grey })
  y -= 14
  const startY = y
  text(order.customerName, M, 11, { bold: true })
  y -= 14
  text(order.customerEmail, M, 10, { color: grey })
  y = startY
  for (const addressLine of order.customerAddress.split('\n').slice(0, 6)) {
    text(addressLine, 300, 10)
    y -= 13
  }
  y = Math.min(y, startY - 28) - 22

  // Items
  const colQty = 360
  const colUnit = 450
  const colTotal = W - M
  const tableHeader = () => {
    line(M, W - M, 1.2, ink)
    y -= 15
    text('ITEM', M, 8, { bold: true, color: grey })
    text('QTY', colQty, 8, { bold: true, color: grey, right: true })
    text('UNIT', colUnit, 8, { bold: true, color: grey, right: true })
    text('TOTAL', colTotal, 8, { bold: true, color: grey, right: true })
    y -= 8
    line(M, W - M)
    y -= 16
  }
  tableHeader()

  for (const item of order.orderItems) {
    if (y < 190) {
      page = pdf.addPage([W, H])
      y = H - M
      tableHeader()
    }
    const title = fit(bold, pdfSafe(bold, item.book?.title ?? 'Unknown'), 10, colQty - M - 50)
    text(title, M, 10, { bold: true })
    text(String(item.quantity), colQty, 10, { right: true })
    text(money(item.price), colUnit, 10, { right: true })
    text(money(Math.round(item.price * 100) * item.quantity / 100), colTotal, 10, { right: true })
    y -= 12
    text(fit(regular, pdfSafe(regular, item.book?.author ?? ''), 8, 280), M, 8, { color: grey })
    y -= 10
    line(M, W - M)
    y -= 14
  }

  // Totals
  if (y < 170) {
    page = pdf.addPage([W, H])
    y = H - M
  }
  y -= 4
  const row = (label: string, value: string, emphasis = false) => {
    text(label, 380, emphasis ? 11 : 10, { bold: emphasis, color: emphasis ? ink : grey })
    text(value, colTotal, emphasis ? 14 : 10, { bold: emphasis, right: true })
    y -= emphasis ? 22 : 15
  }
  row('Subtotal', money(order.subtotal))
  if (order.discount > 0) row(`Discount${order.promoCode ? ` (${order.promoCode})` : ''}`, `-${money(order.discount)}`)
  row(`Shipping (${order.shippingMethod === 'EXPRESS' ? 'Express' : 'Standard'})`, order.shipping === 0 ? 'Free' : money(order.shipping))
  row('Tax', money(order.tax))
  y -= 2
  line(380, W - M, 1.2, ink)
  y -= 18
  row('Total', money(order.totalAmount), true)

  y -= 14
  if (order.payment) {
    const how = order.payment.cardLast4 ? `${order.payment.cardBrand ?? 'Card'} ending ${order.payment.cardLast4}` : 'card'
    text(refundNote ? `Refunded to ${how}` : `Paid by ${how}`, M, 10, { color: grey })
  }

  // Footer on every page
  const pages = pdf.getPages()
  pages.forEach((p, i) => {
    p.drawText(pdfSafe(regular, `Bookstore   |   ${invoiceNumber(order.id)}   |   Page ${i + 1} of ${pages.length}`), {
      x: M,
      y: 28,
      size: 8,
      font: regular,
      color: grey,
    })
  })

  return await pdf.save()
}
