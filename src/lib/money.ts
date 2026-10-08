// Money is stored as integer cents in the database and exposed as dollars
// with at most two decimals in the API.

export const MAX_PRICE_CENTS = 100_000_00 // 100,000.00

export function toCents(dollars: number): number {
  if (typeof dollars !== 'number' || !Number.isFinite(dollars)) {
    throw new RangeError('Amount must be a finite number')
  }
  // 1.005 * 100 is 100.49999999999999 in floating point; trimming to 15 significant
  // digits first makes the half-cent round up as a person would expect.
  const cents = Math.round(Number((Math.abs(dollars) * 100).toPrecision(15))) * Math.sign(dollars)
  if (cents < 0) {
    throw new RangeError('Amount must not be negative')
  }
  if (cents > MAX_PRICE_CENTS) {
    throw new RangeError('Amount is too large')
  }
  return cents
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100
}

export function formatMoney(cents: number): string {
  return `$${(Math.round(cents) / 100).toFixed(2)}`
}
