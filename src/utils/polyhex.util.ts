import { getHexagonsAtDistance, HexGridSystem, hexRotate, hexTranslate } from './grid.hex.util'
import { XYCoordinates } from './grid.util'

/**
 * Configuration of a Polyhex
 */
export interface PolyhexConfig<T = any> {
  /**
   * System for the representation of the polyhex in a grid
   */
  system: HexGridSystem

  /**
   * Minimum x coordinates of the polyhex (arrays cannot have negative index)
   */
  xMin: number

  /**
   * Minimum y coordinates of the polyhex (arrays cannot have negative index)
   */
  yMin: number

  /**
   * Function to evaluate whether a value is empty or not in the grid.
   * By default, undefined and null values are considered as empty.
   * @param value Value to evaluate
   * @return true if the value should be considered as empty
   */
  isEmpty: (value: T) => boolean
}

/**
 * Class to work on Polyhex (multiple hexagons linked together)
 */
export class Polyhex<T = any> implements PolyhexConfig<T> {
  system: HexGridSystem = HexGridSystem.Axial
  xMin: number = 0
  yMin: number = 0
  isEmpty = (value: (T | undefined)) => value == null // true for null and undefined

  constructor(public grid: (T | undefined)[][], config?: Partial<PolyhexConfig>) {
    this.system = config?.system ?? this.system
    this.xMin = config?.xMin ?? this.xMin
    this.yMin = config?.yMin ?? this.yMin
    this.isEmpty = config?.isEmpty ?? this.isEmpty
  }

  get xMax() {
    return Math.max(...this.grid.map((line) => line.length)) + this.xMin - 1
  }

  get yMax() {
    return this.grid.length + this.yMin - 1
  }

  getValue(coordinates: XYCoordinates): T | undefined {
    return this.grid[coordinates.y - this.yMin]?.[coordinates.x - this.xMin]
  }

  /**
   * Utility function to merge multiple polyhex together to create a bigger polyhex: it merges given polyhex grid in current polyhex.
   * @param polyhex Polyhex to merge in the current polyhex
   * @param location Location to merge the new polyhex in
   * @param onOverlap Callback function when a non-empty value is erased
   */
  merge(
    polyhex: (T | undefined)[][],
    location: { x?: number, y?: number, rotation?: number } = {},
    onOverlap: (x: number, y: number) => void = () => {
    }) {
    for (let y = 0; y < polyhex.length; y++) {
      for (let x = 0; x < polyhex[y].length; x++) {
        if (!this.isEmpty(polyhex[y][x])) {
          const rotatedCoordinates = hexRotate({ x, y }, location.rotation, this.system)
          const coordinates = hexTranslate(rotatedCoordinates, { x: location.x ?? 0, y: location.y ?? 0 }, this.system)
          while (coordinates.y < this.yMin) {
            this.grid.unshift([])
            this.yMin--
          }
          while (coordinates.x < this.xMin) {
            for (const line1 of this.grid) {
              line1.unshift(undefined)
            }
            this.xMin--
          }
          if (!this.grid[coordinates.y - this.yMin]) {
            this.grid[coordinates.y - this.yMin] = []
          }
          if (this.grid[coordinates.y - this.yMin][coordinates.x - this.xMin]) {
            onOverlap(x, y)
          }
          this.grid[coordinates.y - this.yMin][coordinates.x - this.xMin] = polyhex[y][x]
        }
      }
    }
  }

  /**
   * Get the minimum distance from given hexagon to a hexagon of the polyhex that matches given predicate
   * @param hex Starting hexagon
   * @param predicate The predicate to match (not empty by default)
   * @returns the minimum distance found
   */
  getDistance(hex: XYCoordinates, predicate = (value: T | undefined) => !this.isEmpty(value)) {
    let distance = 0
    const maxDistance = this.xMax + this.yMax - this.xMin - this.yMin
    while (distance < maxDistance) {
      const hexagonsAtDistance = getHexagonsAtDistance(hex, distance, this.system)
      if (hexagonsAtDistance.some((hex) => predicate(this.getValue(hex)))) {
        return distance
      } else {
        distance++
      }
    }
    return Infinity
  }
}
