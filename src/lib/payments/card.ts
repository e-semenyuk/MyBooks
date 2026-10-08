export type CardBrand = 'Visa' | 'Mastercard' | 'Amex' | 'Card'

export function normalizeCardNumber(input: string): string {
  return input.replace(/[\s-]/g, '')
}

// Luhn check: catches mistyped numbers before anything is sent to the provider
export function luhnValid(digits: string): boolean {
  if (!/^\d{12,19}$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let n = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  }
  return sum % 10 === 0
}

export function cardBrand(digits: string): CardBrand {
  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'Amex'
  return 'Card'
}

// 2-digit years mean 20xx
export function normalizeYear(year: number): number {
  return year < 100 ? 2000 + year : year
}

// A card works through the last day of its expiry month
export function cardExpired(month: number, year: number, now = new Date()): boolean {
  const fullYear = normalizeYear(year)
  return fullYear < now.getFullYear() || (fullYear === now.getFullYear() && month < now.getMonth() + 1)
}

export function formatCardNumberInput(value: string): string {
  return normalizeCardNumber(value)
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}
