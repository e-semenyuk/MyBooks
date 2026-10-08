// Quantity the merged cart item gets: the higher of the two, capped at stock.
// 0 means the item is dropped.
export function mergedQuantity(guestQty: number, userQty: number, stock: number): number {
  return Math.max(0, Math.min(Math.max(guestQty, userQty), stock))
}

export function fitsInStock(inCart: number, adding: number, stock: number): boolean {
  return inCart + adding <= stock
}
