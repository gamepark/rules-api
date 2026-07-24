import { describe, expect, it } from 'vitest'
import { areNeighbors, getNeighbors } from '../utils'

describe('neighbors.util', () => {

  describe('getNeighbors', () => {
    const players = [1, 2, 3, 4]

    it('should return the two neighbors of a middle item', () => {
      expect(getNeighbors(2, players)).toEqual([1, 3])
    })

    it('should wrap around for the first item', () => {
      expect(getNeighbors(1, players)).toEqual([2, 4])
    })

    it('should wrap around for the last item', () => {
      expect(getNeighbors(4, players)).toEqual([1, 3])
    })

    it('should accept a predicate', () => {
      expect(getNeighbors((p) => p === 3, players)).toEqual([2, 4])
    })

    it('should return an empty array when the item is not found', () => {
      expect(getNeighbors(99, players)).toEqual([])
    })

    it('should return the only other item in a two-element array', () => {
      expect(getNeighbors(1, [1, 2])).toEqual([2])
    })
  })

  describe('areNeighbors', () => {
    const players = [1, 2, 3, 4]

    it('should be true for consecutive items', () => {
      expect(areNeighbors(2, 3, players)).toBe(true)
    })

    it('should be true for the wrap-around pair', () => {
      expect(areNeighbors(1, 4, players)).toBe(true)
    })

    it('should be false for distant items', () => {
      expect(areNeighbors(1, 3, players)).toBe(false)
    })
  })
})
