import { randomBytes } from 'crypto'
import { ApiError } from '@/lib/api/errors'

// A stand-in for a payment provider. The card number decides the outcome, so
// every path can be tried without a real account. No money moves.
export const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
  PROCESSING_ERROR: '4000000000000119',
  TIMEOUT: '4000000000000341',
} as const

export const FAILURES = {
  CARD_DECLINED: 'Your card was declined. Try another card.',
  INSUFFICIENT_FUNDS: 'Your card has insufficient funds. Try another card.',
  PROCESSING_ERROR: 'The payment could not be processed. Try again.',
  PAYMENT_TIMEOUT: 'The payment provider did not answer in time. You were not charged. Try again.',
} as const

export type FailureCode = keyof typeof FAILURES

export type ChargeResult =
  | { ok: true; ref: string }
  | { ok: false; code: FailureCode; message: string }

export interface PaymentProvider {
  charge(input: { amountCents: number; cardNumber: string }): Promise<ChargeResult>
  refund(ref: string): Promise<void>
}

const fail = (code: FailureCode): ChargeResult => ({ ok: false, code, message: FAILURES[code] })

export const mockProvider: PaymentProvider = {
  async charge({ amountCents, cardNumber }) {
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw new Error('Charge amount must be a positive number of cents')
    }
    switch (cardNumber) {
      case TEST_CARDS.DECLINED:
        return fail('CARD_DECLINED')
      case TEST_CARDS.INSUFFICIENT_FUNDS:
        return fail('INSUFFICIENT_FUNDS')
      case TEST_CARDS.PROCESSING_ERROR:
        return fail('PROCESSING_ERROR')
      case TEST_CARDS.TIMEOUT:
        return fail('PAYMENT_TIMEOUT')
      default:
        return { ok: true, ref: `mock_${randomBytes(9).toString('hex')}` }
    }
  },

  // The mock always accepts a refund
  async refund() {},
}

// Payment failures are reported to the shopper with HTTP 402
export function paymentFailed(result: Extract<ChargeResult, { ok: false }>): ApiError {
  return new ApiError(402, result.code, result.message)
}
