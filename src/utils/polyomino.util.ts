import { getSquaresAtDistance, squareRotate, squareTranslate } from './grid.squares.util'
import { XYCoordinates } from './grid.util'

/**
 * Configuration of a Polyomino
 */
export interface PolyominoConfig<T = any> {
  /**
   * Minimum x coordinates of the polyomino (arrays cannot have negative index)
   */
  xMin: number

  /**
   * Minimum y coordinates of the polyomino (arrays cannot have negative index)
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
 * Class to work on Polyominoes (multiple squares linked together)
 */
export class Polyomino<T = any> implements PolyominoConfig<T> {
  xMin: number = 0
  yMin: number = 0
  isEmpty = (value: (T | undefined)) => value == null // true for null and undefined

  constructor(public grid: (T | undefined)[][], config?: Partial<PolyominoConfig>) {
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
   * Utility function to merge multiple polyominoes together to create a bigger polyomino: it merges given polyomino grid in current polyomino.
   * @param polyomino Polyomino to merge in the current polyomino
   * @param location Location to merge the new polyomino in
   * @param onOverlap Callback function when a non-empty value is erased
   */
  merge(
    polyomino: Polyomino,
    location: { x?: number, y?: number, rotation?: number } = {},
    onOverlap: (x: number, y: number) => void = () => {
    }) {
    for (let y = polyomino.yMin; y <= polyomino.yMax; y++) {
      for (let x = polyomino.xMin; x <= polyomino.xMax; x++) {
        const value = polyomino.getValue({ x, y })
        if (!this.isEmpty(value)) {
          const rotatedCoordinates = squareRotate({ x, y }, location.rotation)
          const coordinates = squareTranslate(rotatedCoordinates, { x: location.x ?? 0, y: location.y ?? 0 })
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
          while (this.grid.length <= coordinates.y - this.yMin) {
            this.grid.push([])
          }
          if (this.grid[coordinates.y - this.yMin][coordinates.x - this.xMin]) {
            onOverlap(x, y)
          }
          this.grid[coordinates.y - this.yMin][coordinates.x - this.xMin] = value
        }
      }
    }
  }

  /**
   * Get the minimum distance from given square to a square of the polyomino that matches given predicate
   * @param square Starting square
   * @param predicate The predicate to match (not empty by default)
   * @returns the minimum distance found
   */
  getDistance(square: XYCoordinates, predicate = (value: T | undefined) => !this.isEmpty(value)) {
    let distance = 0
    const maxDistance = this.xMax + this.yMax - this.xMin - this.yMin
    while (distance < maxDistance) {
      const squaresAtDistance = getSquaresAtDistance(square, distance)
      if (squaresAtDistance.some((square) => predicate(this.getValue(square)))) {
        return distance
      } else {
        distance++
      }
    }
    return Infinity
  }
}
