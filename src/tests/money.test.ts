import { describe, expect, it } from 'vitest'
import { Money } from '../utils'

const value = (_money: Money, delta: Record<number, number>): number =>
  Object.entries(delta).reduce((sum, [unit, count]) => sum + Number(unit) * count, 0)

describe('money.util', () => {

  describe('record', () => {
    it('should return a record with a zero entry for each unit', () => {
      const money = new Money([1, 2, 5])
      expect(money.record).toEqual({ 1: 0, 2: 0, 5: 0 })
    })
  })

  describe('gain', () => {
    const money = new Money([1, 2, 5, 10])

    it('should gain a single coin by default', () => {
      expect(money.gain()).toEqual({ 1: 1, 2: 0, 5: 0, 10: 0 })
    })

    it('should prioritise the highest units', () => {
      expect(money.gain(17)).toEqual({ 1: 0, 2: 1, 5: 1, 10: 1 })
    })

    it('should produce coins that sum up to the requested amount', () => {
      for (const amount of [1, 3, 8, 17, 42]) {
        expect(value(money, money.gain(amount))).toBe(amount)
      }
    })
  })

  describe('spend', () => {
    it('should remove the exact coins when no change is needed', () => {
      const money = new Money([1, 2, 5, 10])
      const delta = money.spend({ 1: 10, 2: 0, 5: 0, 10: 0 }, 3)
      expect(delta[1]).toBe(-3)
      expect(value(money, delta)).toBe(-3)
    })

    it('should make change by giving back lower units', () => {
      // Only a single coin of value 5 owned: spend 1 => give the 5, take back four 1s (net -1)
      const money = new Money([1, 5])
      const delta = money.spend({ 1: 0, 5: 2 }, 1)
      expect(delta[5]).toBe(-1)
      expect(value(money, delta)).toBe(-1)
    })

    it('should never remove more coins of a unit than are owned', () => {
      const money = new Money([1, 2, 5, 10])
      const owned = { 1: 5, 2: 5, 5: 5, 10: 5 }
      const delta = money.spend(owned, 13)
      for (const [unit, count] of Object.entries(delta)) {
        expect(owned[Number(unit) as keyof typeof owned] + count).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
