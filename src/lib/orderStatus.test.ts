import { describe, expect, it } from 'vitest'
import {
  ORDER_STATUSES,
  allowedTransitions,
  canTransition,
  isOrderStatus,
  nextStatus,
  returnWindowOpen,
} from './orderStatus'

describe('isOrderStatus', () => {
  it('accepts known statuses only', () => {
    for (const status of ORDER_STATUSES) expect(isOrderStatus(status)).toBe(true)
    expect(isOrderStatus('banana')).toBe(false)
    expect(isOrderStatus('confirmed')).toBe(false)
    expect(isOrderStatus(undefined)).toBe(false)
    expect(isOrderStatus(1)).toBe(false)
  })
})

describe('canTransition', () => {
  it('allows the normal flow', () => {
    expect(canTransition('PENDING', 'CONFIRMED')).toBe(true)
    expect(canTransition('CONFIRMED', 'SHIPPED')).toBe(true)
    expect(canTransition('SHIPPED', 'DELIVERED')).toBe(true)
  })

  it('allows cancelling only before shipping', () => {
    expect(canTransition('PENDING', 'CANCELLED')).toBe(true)
    expect(canTransition('CONFIRMED', 'CANCELLED')).toBe(true)
    expect(canTransition('SHIPPED', 'CANCELLED')).toBe(false)
    expect(canTransition('DELIVERED', 'CANCELLED')).toBe(false)
  })

  it('does not allow skipping, going back or leaving a final status', () => {
    expect(canTransition('PENDING', 'SHIPPED')).toBe(false)
    expect(canTransition('SHIPPED', 'CONFIRMED')).toBe(false)
    expect(allowedTransitions('DELIVERED')).toEqual(['RETURNED'])
    expect(allowedTransitions('CANCELLED')).toEqual([])
    expect(allowedTransitions('RETURNED')).toEqual([])
  })

  it('does not allow staying in the same status', () => {
    for (const status of ORDER_STATUSES) expect(canTransition(status, status)).toBe(false)
  })
})

describe('nextStatus', () => {
  it('follows the fulfilment flow and stops at the end', () => {
    expect(nextStatus('PENDING')).toBe('CONFIRMED')
    expect(nextStatus('CONFIRMED')).toBe('SHIPPED')
    expect(nextStatus('SHIPPED')).toBe('DELIVERED')
    expect(nextStatus('DELIVERED')).toBeNull()
    expect(nextStatus('CANCELLED')).toBeNull()
    expect(nextStatus('RETURNED')).toBeNull()
  })
})

describe('returnWindowOpen', () => {
  const delivered = new Date('2026-09-01T10:00:00Z')
  it('is open for 30 days after delivery', () => {
    expect(returnWindowOpen(delivered, new Date('2026-09-30T10:00:00Z'))).toBe(true)
    expect(returnWindowOpen(delivered, new Date('2026-10-01T10:00:00Z'))).toBe(true)
    expect(returnWindowOpen(delivered, new Date('2026-10-01T10:00:01Z'))).toBe(false)
  })
})
