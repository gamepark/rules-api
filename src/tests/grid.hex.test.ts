import { describe, expect, it } from 'vitest'
import {
  axialToEvenQ,
  axialToEvenR,
  axialToOddQ,
  axialToOddR,
  evenQToAxial,
  evenRToAxial,
  getAdjacentHexagons,
  getDistanceBetweenHex,
  getHexagonsAtDistance,
  getPolyhexSpaces,
  HexGridSystem,
  hexFromAxial,
  hexRotate,
  hexToAxial,
  hexTranslate,
  oddQToAxial,
  oddRToAxial,
  XYCoordinates
} from '../utils'

describe('grid.hex.util', () => {

  describe('coordinate conversions round-trip', () => {
    const samples: XYCoordinates[] = [
      { x: 0, y: 0 }, { x: 1, y: 2 }, { x: 3, y: -4 }, { x: -5, y: 6 }, { x: 2, y: 2 }, { x: -3, y: -3 }
    ]

    it('should round-trip OddQ <-> Axial', () => {
      for (const hex of samples) {
        expect(axialToOddQ(oddQToAxial(hex))).toEqual(hex)
      }
    })

    it('should round-trip EvenQ <-> Axial', () => {
      for (const hex of samples) {
        expect(axialToEvenQ(evenQToAxial(hex))).toEqual(hex)
      }
    })

    it('should round-trip OddR <-> Axial', () => {
      for (const hex of samples) {
        expect(axialToOddR(oddRToAxial(hex))).toEqual(hex)
      }
    })

    it('should round-trip EvenR <-> Axial', () => {
      for (const hex of samples) {
        expect(axialToEvenR(evenRToAxial(hex))).toEqual(hex)
      }
    })
  })

  describe('hexToAxial / hexFromAxial', () => {
    it('should be the identity for the Axial system', () => {
      const hex = { x: 3, y: 4 }
      expect(hexToAxial(hex, HexGridSystem.Axial)).toEqual(hex)
      expect(hexFromAxial(hex, HexGridSystem.Axial)).toEqual(hex)
    })

    it('should round-trip through every system', () => {
      const systems = [HexGridSystem.OddQ, HexGridSystem.EvenQ, HexGridSystem.OddR, HexGridSystem.EvenR]
      for (const system of systems) {
        const hex = { x: 2, y: -3 }
        expect(hexFromAxial(hexToAxial(hex, system), system)).toEqual(hex)
      }
    })
  })

  describe('hexRotate', () => {
    it('should return the same vector after a full turn or no rotation', () => {
      const vector = { x: 2, y: -1 }
      expect(hexRotate(vector)).toEqual(vector)
      expect(hexRotate(vector, 6)).toEqual(vector)
    })

    it('should return to origin after 6 sixty-degree rotations applied one by one', () => {
      let vector = { x: 1, y: 2 }
      const start = { ...vector }
      for (let i = 0; i < 6; i++) {
        vector = hexRotate(vector, 1)
      }
      expect(vector).toEqual(start)
    })

    it('should rotate 180 degrees by negating both coordinates', () => {
      expect(hexRotate({ x: 3, y: -2 }, 3)).toEqual({ x: -3, y: 2 })
    })

    it('should work in non-axial systems', () => {
      const vector = { x: 1, y: 1 }
      expect(hexRotate(vector, 6, HexGridSystem.OddR)).toEqual(vector)
    })
  })

  describe('getDistanceBetweenHex', () => {
    it('should return 0 for the same hexagon', () => {
      expect(getDistanceBetweenHex({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0)
    })

    it('should return 1 for adjacent hexagons', () => {
      for (const neighbor of getAdjacentHexagons({ x: 0, y: 0 })) {
        expect(getDistanceBetweenHex({ x: 0, y: 0 }, neighbor)).toBe(1)
      }
    })

    it('should be symmetric', () => {
      expect(getDistanceBetweenHex({ x: 0, y: 0 }, { x: 3, y: -1 }))
        .toBe(getDistanceBetweenHex({ x: 3, y: -1 }, { x: 0, y: 0 }))
    })

    it('should work in a non-axial system', () => {
      expect(getDistanceBetweenHex({ x: 0, y: 0 }, { x: 0, y: 0 }, HexGridSystem.OddQ)).toBe(0)
    })
  })

  describe('getAdjacentHexagons', () => {
    it('should return exactly 6 neighbors', () => {
      expect(getAdjacentHexagons({ x: 0, y: 0 })).toHaveLength(6)
    })

    it('should return 6 distinct neighbors in a non-axial system', () => {
      const neighbors = getAdjacentHexagons({ x: 2, y: 2 }, HexGridSystem.OddQ)
      expect(neighbors).toHaveLength(6)
      const keys = new Set(neighbors.map(({ x, y }) => `${x},${y}`))
      expect(keys.size).toBe(6)
    })
  })

  describe('getHexagonsAtDistance', () => {
    it('should return the hexagon itself at distance 0', () => {
      expect(getHexagonsAtDistance({ x: 1, y: 1 }, 0)).toEqual([{ x: 1, y: 1 }])
    })

    it('should return 6 * distance hexagons all at the given distance', () => {
      const distance = 2
      const hexagons = getHexagonsAtDistance({ x: 0, y: 0 }, distance)
      expect(hexagons).toHaveLength(6 * distance)
      for (const hex of hexagons) {
        expect(getDistanceBetweenHex({ x: 0, y: 0 }, hex)).toBe(distance)
      }
    })

    it('should work in a non-axial system', () => {
      const hexagons = getHexagonsAtDistance({ x: 3, y: 3 }, 1, HexGridSystem.EvenR)
      expect(hexagons).toHaveLength(6)
      for (const hex of hexagons) {
        expect(getDistanceBetweenHex({ x: 3, y: 3 }, hex, HexGridSystem.EvenR)).toBe(1)
      }
    })
  })

  describe('hexTranslate', () => {
    it('should add vectors in the axial system', () => {
      expect(hexTranslate({ x: 1, y: 2 }, { x: 3, y: -1 })).toEqual({ x: 4, y: 1 })
    })

    it('should translate in a non-axial system', () => {
      expect(hexTranslate({ x: 0, y: 0 }, { x: 0, y: 0 }, HexGridSystem.OddQ)).toEqual({ x: 0, y: 0 })
    })
  })

  describe('getPolyhexSpaces', () => {
    const polyhex = [{ x: 0, y: 0 }, { x: 1, y: 0 }]

    it('should translate the polyhex to the location', () => {
      expect(getPolyhexSpaces(polyhex, { x: 2, y: 1 })).toEqual([{ x: 2, y: 1 }, { x: 3, y: 1 }])
    })

    it('should default missing coordinates to 0', () => {
      expect(getPolyhexSpaces(polyhex, {})).toEqual(polyhex)
    })
  })
})
