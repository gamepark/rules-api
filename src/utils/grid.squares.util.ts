import { getEnumValues } from './enum.util'
import { isXYCoordinates, XYCoordinates } from './grid.util'

/**
 * Check if two squares in a grid are orthogonally adjacent based on their coordinates
 * @param square1 Coordinates of the first square
 * @param square2 Coordinates of the second square
 * @returns true if the squares are orthogonally adjacent
 */
export const areAdjacentSquares = (square1: Partial<XYCoordinates>, square2: Partial<XYCoordinates>): boolean =>
  isXYCoordinates(square1) && isXYCoordinates(square2) && getDistanceBetweenSquares(square1, square2) === 1

/**
 * Get the distance between 2 squares in a square-grid, ie the minimum number of steps you need to take to go from square 1 to square 2 following
 * orthogonally adjacent squares
 * @param square1 Coordinates of the first square
 * @param square2 Coordinates of the second square
 * @returns the distance between square1 and square2
 */
export const getDistanceBetweenSquares = (square1: XYCoordinates, square2: XYCoordinates): number =>
  Math.abs(square1.x - square2.x) + Math.abs(square1.y - square2.y)

/**
 * The direction (cardinal points) you can orient in a square grid
 */
export enum Direction {
  North = 1, South, East, West
}

/**
 * List of the 4 {@link Direction}s
 */
export const directions = getEnumValues(Direction)

/**
 * Get the coordinates of the next square if you move in a square grid following a direction
 * @param origin The coordinates of the square you start from
 * @param direction The direction you move to
 * @param distance The number of steps you move (A by default)
 * @returns the coordinates of the destination square
 */
export const getSquareInDirection = (origin: Partial<XYCoordinates>, direction: Direction, distance = 1): XYCoordinates => {
  if (origin.x === undefined || origin.y === undefined) throw new Error('Missing x or y to getSquareInDirection')
  return {
    x: direction === Direction.East ? origin.x + distance : direction === Direction.West ? origin.x - distance : origin.x,
    y: direction === Direction.North ? origin.y - distance : direction === Direction.South ? origin.y + distance : origin.y
  }
}
