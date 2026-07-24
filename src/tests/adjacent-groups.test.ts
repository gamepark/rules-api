import { describe, expect, it } from 'vitest'
import { createAdjacentGroups, HexGridSystem } from '../utils'

describe('adjacent-groups.util', () => {

  describe('createAdjacentGroups on a square grid', () => {
    it('should give empty groups for empty cells', () => {
      const groups = createAdjacentGroups([[0, 0], [0, 0]])
      for (const line of groups) {
        for (const group of line) {
          expect(group.values).toEqual([])
          expect(group.coordinates).toEqual([])
        }
      }
    })

    it('should group orthogonally adjacent non-empty cells together', () => {
      // A single L-shaped connected group
      const map = [
        [1, 0],
        [1, 1]
      ]
      const groups = createAdjacentGroups(map)
      // The three filled cells should share the same group reference
      expect(groups[0][0]).toBe(groups[1][0])
      expect(groups[1][0]).toBe(groups[1][1])
      expect(groups[0][0].coordinates).toHaveLength(3)
      expect(groups[0][0].values).toEqual([1, 1, 1])
    })

    it('should keep diagonal-only cells in separate groups', () => {
      const map = [
        [1, 0],
        [0, 1]
      ]
      const groups = createAdjacentGroups(map)
      expect(groups[0][0]).not.toBe(groups[1][1])
      expect(groups[0][0].coordinates).toEqual([{ x: 0, y: 0 }])
      expect(groups[1][1].coordinates).toEqual([{ x: 1, y: 1 }])
    })

    it('should merge two groups that become connected', () => {
      // Two top cells, initially in separate groups, joined by the bottom row => one group of 5
      const map = [
        [1, 0, 1],
        [1, 1, 1]
      ]
      const groups = createAdjacentGroups(map)
      const group = groups[1][1]
      expect(group.coordinates).toHaveLength(5)
      // Every filled cell references the same merged group
      expect(groups[0][0]).toBe(group)
      expect(groups[0][2]).toBe(group)
    })

    it('should support a custom isEmpty predicate', () => {
      const map = [
        ['a', '.'],
        ['a', '.']
      ]
      const groups = createAdjacentGroups(map, { isEmpty: (v) => v === '.' })
      expect(groups[0][0]).toBe(groups[1][0])
      expect(groups[0][0].values).toEqual(['a', 'a'])
      expect(groups[0][1].values).toEqual([])
    })
  })

  describe('createAdjacentGroups on a hexagonal grid', () => {
    it('should connect axial neighbors that are only diagonal on a square grid', () => {
      const map = [
        [0, 1],
        [1, 0]
      ]
      // {x:1,y:0} and {x:0,y:1} are diagonal (unconnected) on a square grid...
      expect(createAdjacentGroups(map)[0][1]).not.toBe(createAdjacentGroups(map)[1][0])
      // ...but adjacent in the Axial hex system
      const groups = createAdjacentGroups(map, { hexGridSystem: HexGridSystem.Axial })
      expect(groups[0][1]).toBe(groups[1][0])
      expect(groups[0][1].coordinates).toHaveLength(2)
    })

    it('should support OddQ and EvenQ systems', () => {
      const map = [
        [1, 1],
        [1, 1]
      ]
      const oddQ = createAdjacentGroups(map, { hexGridSystem: HexGridSystem.OddQ })
      const evenQ = createAdjacentGroups(map, { hexGridSystem: HexGridSystem.EvenQ })
      // All cells connected into a single group in both systems
      expect(oddQ[0][0].coordinates).toHaveLength(4)
      expect(evenQ[0][0].coordinates).toHaveLength(4)
    })
  })
})
