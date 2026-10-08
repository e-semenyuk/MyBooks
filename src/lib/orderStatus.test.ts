import { describe, expect, it } from 'vitest'
import {
  ORDER_STATUSES,
  allowedTransitions,
  canTransition,
  isOrderStatus,
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
    expect(allowedTransitions('DELIVERED')).toEqual([])
    expect(allowedTransitions('CANCELLED')).toEqual([])
  })

  it('does not allow staying in the same status', () => {
    for (const status of ORDER_STATUSES) expect(canTransition(status, status)).toBe(false)
  })
})
