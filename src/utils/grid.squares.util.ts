import { isEnumValue } from './EnumUtils'
import { isXYCoordinates, XYCoordinates } from './grid.util'

export const areAdjacentSquares = (square1: Partial<XYCoordinates>, square2: Partial<XYCoordinates>): boolean =>
  isXYCoordinates(square1) && isXYCoordinates(square2) && getDistanceBetweenSquares(square1, square2) === 1

export const getDistanceBetweenSquares = (square1: XYCoordinates, square2: XYCoordinates): number =>
  Math.abs(square1.x - square2.x) + Math.abs(square1.y - square2.y)

export enum Direction {
  North = 1, South, East, West
}

export const directions = Object.values(Direction).filter(isEnumValue)

export const getSquareInDirection = (origin: Partial<XYCoordinates>, direction: Direction): XYCoordinates => {
  if (origin.x === undefined || origin.y === undefined) throw new Error('Missing x or y to getSquareInDirection')
  return {
    x: direction === Direction.East ? origin.x - 1 : direction === Direction.West ? origin.x + 1 : origin.x,
    y: direction === Direction.North ? origin.y - 1 : direction === Direction.South ? origin.y + 1 : origin.y
  }
}
