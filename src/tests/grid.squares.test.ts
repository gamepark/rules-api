import { describe, expect, it } from 'vitest'
import {
  areAdjacentSquares,
  Direction,
  directions,
  getAdjacentSquares,
  getDistanceBetweenSquares,
  getPolyominoSpaces,
  getSquareInDirection,
  getSquaresAtDistance,
  squareRotate,
  squareTranslate
} from '../utils'

describe('grid.squares.util', () => {

  describe('getDistanceBetweenSquares', () => {
    it('should return 0 for the same square', () => {
      expect(getDistanceBetweenSquares({ x: 2, y: 3 }, { x: 2, y: 3 })).toBe(0)
    })

    it('should return the Manhattan distance', () => {
      expect(getDistanceBetweenSquares({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7)
      expect(getDistanceBetweenSquares({ x: -1, y: -1 }, { x: 1, y: 1 })).toBe(4)
    })
  })

  describe('areAdjacentSquares', () => {
    it('should be true for orthogonally adjacent squares', () => {
      expect(areAdjacentSquares({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(true)
      expect(areAdjacentSquares({ x: 0, y: 0 }, { x: 0, y: -1 })).toBe(true)
    })

    it('should be false for diagonal or distant squares', () => {
      expect(areAdjacentSquares({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(false)
      expect(areAdjacentSquares({ x: 0, y: 0 }, { x: 2, y: 0 })).toBe(false)
    })

    it('should be false when coordinates are incomplete', () => {
      expect(areAdjacentSquares({ x: 0 }, { x: 1, y: 0 })).toBe(false)
      expect(areAdjacentSquares({}, {})).toBe(false)
    })
  })

  describe('getSquareInDirection', () => {
    it('should move in each cardinal direction', () => {
      expect(getSquareInDirection({ x: 0, y: 0 }, Direction.North)).toEqual({ x: 0, y: -1 })
      expect(getSquareInDirection({ x: 0, y: 0 }, Direction.South)).toEqual({ x: 0, y: 1 })
      expect(getSquareInDirection({ x: 0, y: 0 }, Direction.East)).toEqual({ x: 1, y: 0 })
      expect(getSquareInDirection({ x: 0, y: 0 }, Direction.West)).toEqual({ x: -1, y: 0 })
    })

    it('should apply the given distance', () => {
      expect(getSquareInDirection({ x: 5, y: 5 }, Direction.East, 3)).toEqual({ x: 8, y: 5 })
    })

    it('should throw when x or y is missing', () => {
      expect(() => getSquareInDirection({ x: 0 }, Direction.North)).toThrow()
      expect(() => getSquareInDirection({ y: 0 }, Direction.North)).toThrow()
    })
  })

  describe('squareRotate', () => {
    const vector = { x: 1, y: 2 }

    it('should return the same vector for a full turn or no rotation', () => {
      expect(squareRotate(vector)).toEqual(vector)
      expect(squareRotate(vector, 4)).toEqual(vector)
    })

    it('should rotate clockwise by quarter turns', () => {
      expect(squareRotate(vector, 1)).toEqual({ x: -2, y: 1 })
      expect(squareRotate(vector, 2)).toEqual({ x: -1, y: -2 })
      expect(squareRotate(vector, 3)).toEqual({ x: 2, y: -1 })
    })

    it('should handle negative rotations', () => {
      expect(squareRotate(vector, -1)).toEqual(squareRotate(vector, 3))
    })
  })

  describe('squareTranslate', () => {
    it('should add the vector to the square', () => {
      expect(squareTranslate({ x: 1, y: 2 }, { x: 3, y: -1 })).toEqual({ x: 4, y: 1 })
    })
  })

  describe('getSquaresAtDistance', () => {
    it('should return the square itself at distance 0 or less', () => {
      expect(getSquaresAtDistance({ x: 2, y: 2 }, 0)).toEqual([{ x: 2, y: 2 }])
      expect(getSquaresAtDistance({ x: 2, y: 2 }, -1)).toEqual([{ x: 2, y: 2 }])
    })

    it('should return the 4 squares at distance 1', () => {
      const squares = getSquaresAtDistance({ x: 0, y: 0 }, 1)
      expect(squares).toHaveLength(4)
      for (const square of squares) {
        expect(getDistanceBetweenSquares({ x: 0, y: 0 }, square)).toBe(1)
      }
    })

    it('should return squares that are all exactly at the given distance', () => {
      const distance = 3
      const squares = getSquaresAtDistance({ x: 5, y: 5 }, distance)
      expect(squares).toHaveLength(distance * 4)
      for (const square of squares) {
        expect(getDistanceBetweenSquares({ x: 5, y: 5 }, square)).toBe(distance)
      }
    })
  })

  describe('directions & getAdjacentSquares', () => {
    it('should contain the 4 directions', () => {
      expect(directions).toEqual([Direction.North, Direction.South, Direction.East, Direction.West])
    })

    it('should return the 4 orthogonal neighbors', () => {
      const neighbors = getAdjacentSquares({ x: 0, y: 0 })
      expect(neighbors).toHaveLength(4)
      expect(neighbors).toEqual(expect.arrayContaining([
        { x: 0, y: -1 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }
      ]))
    })
  })

  describe('getPolyominoSpaces', () => {
    const polyomino = [{ x: 0, y: 0 }, { x: 1, y: 0 }]

    it('should translate the polyomino to the location', () => {
      expect(getPolyominoSpaces(polyomino, { x: 2, y: 3 })).toEqual([{ x: 2, y: 3 }, { x: 3, y: 3 }])
    })

    it('should default missing location coordinates to 0', () => {
      expect(getPolyominoSpaces(polyomino, {})).toEqual(polyomino)
    })

    it('should apply rotation before translation', () => {
      expect(getPolyominoSpaces(polyomino, { x: 0, y: 0, rotation: 1 })).toEqual([{ x: 0, y: 0 }, { x: 0, y: 1 }])
    })
  })
})
