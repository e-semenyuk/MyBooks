'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowRightIcon } from '@/components/icons'
import { SHIPPING_OPTIONS, SHIPPING_METHODS, ShippingMethodName } from '@/lib/pricing'
import { formatMoney, toCents } from '@/lib/money'
import { formatAddress } from '@/lib/address'
import { formatCardNumberInput } from '@/lib/payments/card'
import VerifyEmailBanner from '@/components/VerifyEmailBanner'
import type { SavedAddress } from '@/components/AddressBook'

interface CheckoutPageProps {
  showToast: (message: string, type: 'success' | 'error') => void
  updateCartCount: () => void
  navigateTo: (page: 'home' | 'cart' | 'checkout' | 'admin') => void
}

interface Quote {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
}

const dollars = (amount: number) => formatMoney(toCents(amount))

export default function CheckoutPage({ showToast, updateCartCount, navigateTo }: CheckoutPageProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerAddress: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodName>('STANDARD')
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [cartEmpty, setCartEmpty] = useState(false)
  const [emailVerified, setEmailVerified] = useState(true)
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '' })
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (session?.user) {
      setFormData((current) => ({
        ...current,
        customerName: current.customerName || session.user?.name || '',
        customerEmail: current.customerEmail || session.user?.email || '',
      }))
    }
  }, [session])

  useEffect(() => {
    fetch('/api/addresses')
      .then((response) => (response.ok ? response.json() : []))
      .then(setSavedAddresses)
      .catch(() => setSavedAddresses([]))
  }, [])

  const chooseSavedAddress = (value: string) => {
    const address = savedAddresses.find((a) => String(a.id) === value)
    if (!address) return
    setFormData((current) => ({
      ...current,
      customerName: address.fullName,
      customerAddress: formatAddress(address),
    }))
  }

  // Price the cart whenever the shipping method or the applied code changes
  const requestQuote = useCallback(
    async (method: ShippingMethodName, promoCode: string | null) => {
      const response = await fetch('/api/checkout/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingMethod: method, ...(promoCode ? { promoCode } : {}) }),
      })
      const data = await response.json().catch(() => null)
      return { ok: response.ok, data }
    },
    []
  )

  useEffect(() => {
    let cancelled = false
    requestQuote(shippingMethod, appliedPromo)
      .then(({ ok, data }) => {
        if (cancelled) return
        if (ok) {
          setQuote(data)
          setCartEmpty(false)
        } else if (data?.code === 'ORDER_REJECTED' && /empty/i.test(data.error)) {
          setCartEmpty(true)
          setQuote(null)
        } else if (data?.error) {
          showToast(data.error, 'error')
        }
      })
      .catch(() => !cancelled && showToast('Failed to calculate the total', 'error'))
    return () => {
      cancelled = true
    }
    // showToast is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingMethod, appliedPromo, requestQuote])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const applyPromo = async () => {
    const code = promoInput.trim()
    if (!code) return
    setPromoError(null)
    const { ok, data } = await requestQuote(shippingMethod, code)
    if (ok) {
      setAppliedPromo(data.promoCode)
      setPromoInput('')
    } else {
      setPromoError(data?.error || 'This promo code could not be applied')
    }
  }

  const removePromo = () => {
    setAppliedPromo(null)
    setPromoError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentError(null)

    // "MM/YY" or "MM/YYYY"
    const match = card.expiry.trim().match(/^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/)
    if (!match) {
      setPaymentError('Enter the expiry date as MM/YY')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          shippingMethod,
          ...(appliedPromo ? { promoCode: appliedPromo } : {}),
          card: { number: card.number, expMonth: Number(match[1]), expYear: Number(match[2]), cvc: card.cvc },
        }),
      })

      if (response.ok) {
        const order = await response.json()
        showToast(`Order placed successfully! Order ID: ${order.id}`, 'success')
        setFormData({ customerName: '', customerEmail: '', customerAddress: '' })
        setCard({ number: '', expiry: '', cvc: '' })
        updateCartCount()
        navigateTo('home')
      } else {
        const error = await response.json()
        // Payment problems are shown next to the card fields, with the cart kept
        if (response.status === 402 || /^(Card|Expiry|Security)/.test(error.error ?? '')) {
          setPaymentError(error.error)
        } else {
          showToast(error.error || 'Failed to place order', 'error')
        }
      }
    } catch (error) {
      showToast('Failed to place order', 'error')
      console.error('Error placing order:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const optionClass = (selected: boolean) =>
    `flex cursor-pointer items-start gap-3 border p-4 transition-colors duration-150 ${
      selected ? 'border-ink-950 bg-mist-50 outline outline-2 -outline-offset-2 outline-ink-950' : 'border-mist-300 hover:border-ink-950'
    }`

  return (
    <div data-testid="checkout-page" className="animate-fade-in">
      <div className="mb-12">
        <p className="section-label mb-6">03 / Checkout</p>
        <h2 className="page-title mb-4">Checkout</h2>
        <p className="text-lg text-ink-600">Enter the delivery details for your order.</p>
      </div>

      <VerifyEmailBanner showToast={showToast} onStatus={setEmailVerified} />

      <form data-testid="checkout-form" onSubmit={handleSubmit} className="grid items-start gap-12 lg:grid-cols-3">
        <div className="space-y-8 border-t-2 border-ink-950 pt-8 lg:col-span-2">
          <div className="space-y-6">
            <div>
              <label htmlFor="customerName" className="label">
                Full Name
              </label>
              <input
                data-testid="checkout-name-input"
                type="text"
                id="customerName"
                name="customerName"
                autoComplete="name"
                value={formData.customerName}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label htmlFor="customerEmail" className="label">
                Email
              </label>
              <input
                data-testid="checkout-email-input"
                type="email"
                id="customerEmail"
                name="customerEmail"
                autoComplete="email"
                value={formData.customerEmail}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            {savedAddresses.length > 0 && (
              <div>
                <label htmlFor="savedAddress" className="label">
                  Saved address
                </label>
                <select
                  id="savedAddress"
                  data-testid="saved-address-select"
                  defaultValue=""
                  onChange={(e) => chooseSavedAddress(e.target.value)}
                  className="input"
                >
                  <option value="">Enter an address manually</option>
                  {savedAddresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label ? `${address.label}: ` : ''}
                      {address.street}, {address.city}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="customerAddress" className="label">
                Address
              </label>
              <textarea
                data-testid="checkout-address-input"
                id="customerAddress"
                name="customerAddress"
                autoComplete="street-address"
                value={formData.customerAddress}
                onChange={handleChange}
                required
                rows={3}
                className="input"
              />
            </div>
          </div>

          <fieldset data-testid="shipping-options">
            <legend className="label">Shipping</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {SHIPPING_METHODS.map((method) => {
                const option = SHIPPING_OPTIONS[method]
                const selected = shippingMethod === method
                return (
                  <label key={method} className={optionClass(selected)}>
                    <input
                      data-testid={`shipping-${method.toLowerCase()}`}
                      type="radio"
                      name="shippingMethod"
                      value={method}
                      checked={selected}
                      onChange={() => setShippingMethod(method)}
                      className="mt-1 h-4 w-4 accent-cobalt-500"
                    />
                    <span>
                      <span className="block font-semibold text-ink-950">
                        {option.label} <span className="num font-mono text-sm font-normal">{dollars(option.cents / 100)}</span>
                      </span>
                      <span className="block text-sm text-ink-600">{option.estimate}</span>
                      {option.freeOverCents !== undefined && (
                        <span className="block font-mono text-[11px] text-ink-500">
                          Free over {dollars(option.freeOverCents / 100)}
                        </span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="promoCode" className="label">
              Promo code
            </label>
            {appliedPromo ? (
              <div data-testid="promo-applied" className="flex items-center justify-between border border-success bg-success-soft px-4 py-3">
                <p className="text-sm text-success">
                  <span className="font-mono font-semibold">{appliedPromo}</span> applied
                </p>
                <button
                  data-testid="promo-remove-button"
                  type="button"
                  onClick={removePromo}
                  className="text-sm font-semibold text-ink-950 underline underline-offset-4"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  id="promoCode"
                  data-testid="promo-input"
                  type="text"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value)
                    setPromoError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applyPromo()
                    }
                  }}
                  maxLength={40}
                  className="input uppercase"
                />
                <button data-testid="promo-apply-button" type="button" onClick={applyPromo} className="btn btn-secondary">
                  Apply
                </button>
              </div>
            )}
            {promoError && (
              <p data-testid="promo-error" role="alert" className="mt-2 text-sm font-medium text-danger">
                {promoError}
              </p>
            )}
          </div>

          <fieldset data-testid="payment-section">
            <legend className="label">Payment</legend>
            <p className="mb-4 border border-mist-300 bg-mist-50 px-4 py-3 font-mono text-[11px] leading-relaxed text-ink-600">
              Test mode: no real money moves. Use 4242 4242 4242 4242 to pay, 4000 0000 0000 0002 to be declined,
              4000 0000 0000 9995 for insufficient funds, 4000 0000 0000 0119 for a processing error and
              4000 0000 0000 0341 for a timeout. Any future expiry date and any 3-digit code.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label htmlFor="cardNumber" className="label">Card number</label>
                <input
                  id="cardNumber"
                  data-testid="card-number-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: formatCardNumberInput(e.target.value) })}
                  required
                  className="input num"
                  placeholder="4242 4242 4242 4242"
                />
              </div>
              <div>
                <label htmlFor="cardExpiry" className="label">Expiry (MM/YY)</label>
                <input
                  id="cardExpiry"
                  data-testid="card-expiry-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={card.expiry}
                  onChange={(e) => setCard({ ...card, expiry: e.target.value.slice(0, 7) })}
                  required
                  className="input num"
                  placeholder="12/30"
                />
              </div>
              <div>
                <label htmlFor="cardCvc" className="label">Security code</label>
                <input
                  id="cardCvc"
                  data-testid="card-cvc-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={card.cvc}
                  onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  required
                  className="input num"
                  placeholder="123"
                />
              </div>
            </div>
            {paymentError && (
              <p data-testid="payment-error" role="alert" className="mt-3 border-2 border-danger bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
                {paymentError}
              </p>
            )}
          </fieldset>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <button
              data-testid="back-to-cart-button"
              type="button"
              onClick={() => navigateTo('cart')}
              className="btn btn-secondary flex-1"
            >
              Back to Cart
            </button>
            <button
              data-testid="place-order-button"
              type="submit"
              disabled={submitting || cartEmpty || !emailVerified}
              className="btn btn-primary flex-1 justify-between"
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
              {!submitting && <ArrowRightIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <aside data-testid="checkout-summary" className="border-2 border-ink-950 lg:sticky lg:top-24">
          <div className="bg-ink-950 px-6 py-4">
            <h3 className="font-display text-xl font-bold tracking-tight text-white">Order Summary</h3>
          </div>
          <div className="p-6">
            {cartEmpty ? (
              <p data-testid="checkout-empty" className="text-sm text-ink-600">
                Your cart is empty. Add some books before checking out.
              </p>
            ) : quote ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-600">Subtotal</dt>
                  <dd data-testid="summary-subtotal" className="num font-semibold text-ink-950">{dollars(quote.subtotal)}</dd>
                </div>
                {quote.discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-600">Discount</dt>
                    <dd data-testid="summary-discount" className="num font-semibold text-success">-{dollars(quote.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-600">Shipping</dt>
                  <dd data-testid="summary-shipping" className="num font-semibold text-ink-950">
                    {quote.shipping === 0 ? 'Free' : dollars(quote.shipping)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-600">Tax</dt>
                  <dd data-testid="summary-tax" className="num font-semibold text-ink-950">{dollars(quote.tax)}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t-2 border-ink-950 pt-5">
                  <dt className="font-semibold text-ink-950">Total</dt>
                  <dd data-testid="summary-total" className="num font-display text-4xl font-extrabold tracking-tight text-ink-950">
                    {dollars(quote.total)}
                  </dd>
                </div>
              </dl>
            ) : (
              <div aria-busy="true" className="space-y-3">
                <div className="skeleton h-5 w-full" />
                <div className="skeleton h-5 w-full" />
                <div className="skeleton h-10 w-full" />
              </div>
            )}
          </div>
        </aside>
      </form>
    </div>
  )
}
