import { describe, it, expect } from 'vitest'
import { computeStatus, computeWorstStatus, STOCK_STATUS } from '../../app/utils/stockStatus'

describe('computeStatus', () => {
  it('returns critical when quantity <= safetyStock', () => {
    expect(computeStatus(5, 10, 20, 100)).toBe(STOCK_STATUS.CRITICAL)
    expect(computeStatus(10, 10, 20, 100)).toBe(STOCK_STATUS.CRITICAL)
    expect(computeStatus(0, 10, 20, 100)).toBe(STOCK_STATUS.CRITICAL)
  })

  it('returns low when quantity <= reorderPoint', () => {
    expect(computeStatus(15, 10, 20, 100)).toBe(STOCK_STATUS.LOW)
    expect(computeStatus(20, 10, 20, 100)).toBe(STOCK_STATUS.LOW)
  })

  it('returns overstock when quantity > maxStock', () => {
    expect(computeStatus(150, 10, 20, 100)).toBe(STOCK_STATUS.OVERSTOCK)
    expect(computeStatus(101, 10, 20, 100)).toBe(STOCK_STATUS.OVERSTOCK)
  })

  it('returns safe for valid mid-range quantities', () => {
    expect(computeStatus(50, 10, 20, 100)).toBe(STOCK_STATUS.SAFE)
    expect(computeStatus(21, 10, 20, 100)).toBe(STOCK_STATUS.SAFE)
  })

  it('handles edge case where safetyStock is 0', () => {
    expect(computeStatus(0, 0, 10, 100)).toBe(STOCK_STATUS.CRITICAL)
    expect(computeStatus(1, 0, 10, 100)).toBe(STOCK_STATUS.LOW)
  })
})

describe('computeWorstStatus', () => {
  it('returns critical as worst', () => {
    expect(computeWorstStatus([STOCK_STATUS.SAFE, STOCK_STATUS.CRITICAL])).toBe(STOCK_STATUS.CRITICAL)
  })

  it('returns low as worst when no critical', () => {
    expect(computeWorstStatus([STOCK_STATUS.SAFE, STOCK_STATUS.LOW])).toBe(STOCK_STATUS.LOW)
  })

  it('returns overstock as worst over safe', () => {
    expect(computeWorstStatus([STOCK_STATUS.SAFE, STOCK_STATUS.OVERSTOCK])).toBe(STOCK_STATUS.OVERSTOCK)
  })

  it('returns safe when all safe', () => {
    expect(computeWorstStatus([STOCK_STATUS.SAFE, STOCK_STATUS.SAFE])).toBe(STOCK_STATUS.SAFE)
  })

  it('prioritises critical > low > overstock > safe', () => {
    expect(computeWorstStatus([STOCK_STATUS.OVERSTOCK, STOCK_STATUS.LOW, STOCK_STATUS.CRITICAL])).toBe(STOCK_STATUS.CRITICAL)
    expect(computeWorstStatus([STOCK_STATUS.OVERSTOCK, STOCK_STATUS.LOW])).toBe(STOCK_STATUS.LOW)
  })
})
