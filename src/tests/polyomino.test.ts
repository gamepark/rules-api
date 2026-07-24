import { describe, expect, it } from 'vitest'
import { Polyomino } from '../utils'

describe('polyomino.util', () => {

  describe('bounds and getValue', () => {
    it('should compute xMax and yMax from the grid and offsets', () => {
      const polyomino = new Polyomino([[1, 2, 3], [4, 5, 6]])
      expect(polyomino.xMax).toBe(2)
      expect(polyomino.yMax).toBe(1)
    })

    it('should take xMin and yMin into account', () => {
      const polyomino = new Polyomino([[1, 2]], { xMin: 3, yMin: 5 })
      expect(polyomino.xMax).toBe(4)
      expect(polyomino.yMax).toBe(5)
      expect(polyomino.getValue({ x: 3, y: 5 })).toBe(1)
      expect(polyomino.getValue({ x: 4, y: 5 })).toBe(2)
    })

    it('should return undefined outside of the grid', () => {
      const polyomino = new Polyomino([[1]])
      expect(polyomino.getValue({ x: 5, y: 5 })).toBeUndefined()
      expect(polyomino.getValue({ x: -1, y: 0 })).toBeUndefined()
    })
  })

  describe('getDistance', () => {
    const grid = [
      [1, undefined, undefined],
      [undefined, undefined, undefined],
      [undefined, undefined, 1]
    ]

    it('should return 0 when the square is on a filled cell', () => {
      const polyomino = new Polyomino(grid)
      expect(polyomino.getDistance({ x: 0, y: 0 })).toBe(0)
    })

    it('should return the distance to the closest filled cell', () => {
      const polyomino = new Polyomino(grid)
      expect(polyomino.getDistance({ x: 1, y: 0 })).toBe(1)
      expect(polyomino.getDistance({ x: 2, y: 0 })).toBe(2)
    })

    it('should return Infinity when nothing matches the predicate', () => {
      const polyomino = new Polyomino([[undefined, undefined], [undefined, undefined]])
      expect(polyomino.getDistance({ x: 0, y: 0 })).toBe(Infinity)
    })
  })

  describe('merge', () => {
    it('should write the merged values at the target location', () => {
      const base = new Polyomino<number>([[1]])
      base.merge(new Polyomino<number>([[1]]), { x: 1, y: 0 })
      expect(base.getValue({ x: 0, y: 0 })).toBe(1)
      expect(base.getValue({ x: 1, y: 0 })).toBe(1)
    })

    it('should call onOverlap when a non-empty value is overwritten', () => {
      const base = new Polyomino<number>([[1]])
      let overlaps = 0
      base.merge(new Polyomino<number>([[1]]), { x: 0, y: 0 }, () => overlaps++)
      expect(overlaps).toBe(1)
    })

    it('should grow the grid to fit values placed at negative coordinates', () => {
      const base = new Polyomino<number>([[1]])
      base.merge(new Polyomino<number>([[2]]), { x: -1, y: -1 })
      expect(base.xMin).toBe(-1)
      expect(base.yMin).toBe(-1)
      expect(base.getValue({ x: -1, y: -1 })).toBe(2)
      expect(base.getValue({ x: 0, y: 0 })).toBe(1)
    })
  })
})
