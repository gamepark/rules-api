import { Location } from '../material'
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

/**
 * Rotate square-grid coordinates.
 * A quarter turn (90°) matches a positive CSS rotation (clockwise on a y-down screen).
 * @param vector Vector to rotate
 * @param rotation Number of 90 degrees rotations to apply (1 = 90°, 2 = 180°...)
 * @return the rotated vector
 */
export function squareRotate(vector: XYCoordinates, rotation: number = 0): XYCoordinates {
  switch (((rotation % 4) + 4) % 4) {
    case 1:
      return { x: -vector.y, y: vector.x }
    case 2:
      return { x: -vector.x, y: -vector.y }
    case 3:
      return { x: vector.y, y: -vector.x }
    default:
      return vector
  }
}

/**
 * Translate square-grid coordinates by a vector.
 * @param square Coordinates of the square to translate
 * @param vector Vector of the translation
 * @return the coordinates of the square after the translation
 */
export function squareTranslate(square: XYCoordinates, vector: XYCoordinates): XYCoordinates {
  return { x: square.x + vector.x, y: square.y + vector.y }
}

/**
 * Get all the squares that are exactly at a specific (Manhattan) distance from a given square.
 * @param square Coordinates of the square
 * @param distance Distance of the squares we want
 * @return the list of the squares found at distance from given square
 */
export function getSquaresAtDistance(square: XYCoordinates, distance: number): XYCoordinates[] {
  if (distance <= 0) return [square]
  const result: XYCoordinates[] = []
  let currentSquare = { x: square.x + distance, y: square.y }
  const vectors = [{ x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 1 }]
  for (const vector of vectors) {
    for (let j = 0; j < distance; j++) {
      result.push(currentSquare)
      currentSquare = squareTranslate(currentSquare, vector)
    }
  }
  return result
}

/**
 * Get the coordinates of the 4 squares orthogonally adjacent to a given square.
 * @param square Coordinates of the square
 * @return the coordinates of the adjacent squares
 */
export function getAdjacentSquares(square: XYCoordinates): XYCoordinates[] {
  return directions.map((direction) => getSquareInDirection(square, direction))
}

/**
 * Get the coordinates that will be covered by a polyomino tile when at a specific grid location.
 * @param polyomino Coordinates occupied by the polyomino without any rotation
 * @param location Location of the polyomino on the grid (x, y, and rotation)
 * @return coordinates in the grid covered when the polyomino has this location
 */
export function getPolyominoSpaces(polyomino: XYCoordinates[], location: Partial<Location>): XYCoordinates[] {
  const vector = { x: location.x ?? 0, y: location.y ?? 0 }
  return polyomino
    .map((square) => squareRotate(square, location.rotation ?? 0))
    .map((square) => squareTranslate(square, vector))
}
