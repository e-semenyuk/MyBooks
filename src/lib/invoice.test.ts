import { describe, expect, it } from 'vitest'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { buildInvoicePdf, invoiceNumber, pdfSafe } from './invoice'
import type { OrderWithItems } from '@/types'

const item = (id: number, title: string) => ({
  id,
  orderId: 7,
  bookId: id,
  quantity: 2,
  price: 12.99,
  book: { id, title, author: 'Some Author', isbn: null, price: 12.99, description: null, stockQuantity: 1 },
})

const order = (overrides: Partial<OrderWithItems> = {}): OrderWithItems =>
  ({
    id: 7,
    userId: 2,
    customerName: 'Test User',
    customerEmail: 'user@test.local',
    customerAddress: '1 Main Street\nNew York, NY 10001',
    orderDate: new Date('2026-10-08T12:00:00Z'),
    subtotal: 25.98,
    discount: 0,
    shipping: 4.99,
    tax: 2.08,
    totalAmount: 33.05,
    shippingMethod: 'STANDARD',
    promoCode: null,
    payment: { status: 'PAID', cardBrand: 'Visa', cardLast4: '4242' },
    status: 'CONFIRMED',
    orderItems: [item(1, 'The Great Gatsby')],
    ...overrides,
  }) as OrderWithItems

describe('invoiceNumber', () => {
  it('pads the order id', () => {
    expect(invoiceNumber(7)).toBe('INV-000007')
    expect(invoiceNumber(1234567)).toBe('INV-1234567')
  })
})

describe('pdfSafe', () => {
  it('keeps Latin text and replaces what the font cannot draw', async () => {
    const pdf = await PDFDocument.create()
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    expect(pdfSafe(font, 'Café Müller')).toBe('Café Müller')
    expect(pdfSafe(font, 'Война и мир')).toBe('????? ? ???')
    expect(pdfSafe(font, 'Tab\there')).toBe('Tab here')
  })
})

describe('buildInvoicePdf', () => {
  it('makes a one-page PDF for a small order', async () => {
    const bytes = await buildInvoicePdf(order())
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe('%PDF-')
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1)
  })

  it('continues on more pages when there are many items', async () => {
    const many = Array.from({ length: 40 }, (_, i) => item(i + 1, `Book number ${i + 1}`))
    const doc = await PDFDocument.load(await buildInvoicePdf(order({ orderItems: many })))
    expect(doc.getPageCount()).toBeGreaterThan(1)
  })

  it('survives names the standard font cannot draw and very long titles', async () => {
    const bytes = await buildInvoicePdf(
      order({
        customerName: 'Иван Петров',
        customerAddress: '東京都\n'.repeat(10),
        orderItems: [item(1, 'Х'.repeat(300)), item(2, 'A very long title '.repeat(30))],
      })
    )
    expect(bytes.length).toBeGreaterThan(500)
  })

  it('works for discounted, refunded and unpaid-card-less orders', async () => {
    await expect(buildInvoicePdf(order({ discount: 2.6, promoCode: 'WELCOME10', shipping: 0 }))).resolves.toBeDefined()
    await expect(buildInvoicePdf(order({ payment: { status: 'REFUNDED', cardBrand: null, cardLast4: null } }))).resolves.toBeDefined()
    await expect(buildInvoicePdf(order({ payment: null }))).resolves.toBeDefined()
  })
})
