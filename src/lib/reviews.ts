// Pure helpers for book reviews (XPANBFLFA-123).

export interface RatingSummary {
  average: number
  count: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

export function summarizeRatings(ratings: number[]): RatingSummary {
  const distribution: RatingSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let sum = 0
  for (const rating of ratings) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) continue
    distribution[rating as 1 | 2 | 3 | 4 | 5] += 1
    sum += rating
  }
  const count = Object.values(distribution).reduce((a, b) => a + b, 0)
  return { average: count ? Math.round((sum / count) * 10) / 10 : 0, count, distribution }
}

// Reviews show "Una U." instead of the full name.
export function publicName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Reader'
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}
