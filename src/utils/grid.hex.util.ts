import { XYCoordinates } from './grid.util'

/**
 * The different coordinates systems available to describe a Hexagonal Grid.
 * See https://www.redblobgames.com/grids/hexagons/#coordinates
 */
export enum HexagonalGridCoordinatesSystem {
  Axial, OddQ, EvenQ, OddR, EvenR
}

/**
 * Converts {@link HexagonalGridCoordinatesSystem.OddQ} coordinates into {@link HexagonalGridCoordinatesSystem.Axial} coordinates
 */
export const oddQToAxial = ({ x, y }: XYCoordinates) => ({ x, y: y - (x - (x & 1)) / 2 })
/**
 * Converts {@link HexagonalGridCoordinatesSystem.Axial} coordinates into {@link HexagonalGridCoordinatesSystem.OddQ} coordinates
 */
export const axialToOddQ = ({ x, y }: XYCoordinates) => ({ x, y: y + (x - (x & 1)) / 2 })

/**
 * Converts {@link HexagonalGridCoordinatesSystem.EvenQ} coordinates into {@link HexagonalGridCoordinatesSystem.Axial} coordinates
 */
export const evenQToAxial = ({ x, y }: XYCoordinates) => ({ x, y: y - (x + (x & 1)) / 2 })
/**
 * Converts {@link HexagonalGridCoordinatesSystem.Axial} coordinates into {@link HexagonalGridCoordinatesSystem.EvenQ} coordinates
 */
export const axialToEvenQ = ({ x, y }: XYCoordinates) => ({ x, y: y + (x + (x & 1)) / 2 })

/**
 * Converts {@link HexagonalGridCoordinatesSystem.OddR} coordinates into {@link HexagonalGridCoordinatesSystem.Axial} coordinates
 */
export const oddRToAxial = ({ x, y }: XYCoordinates) => ({ y, x: x - (y - (y & 1)) / 2 })
/**
 * Converts {@link HexagonalGridCoordinatesSystem.Axial} coordinates into {@link HexagonalGridCoordinatesSystem.OddR} coordinates
 */
export const axialToOddR = ({ x, y }: XYCoordinates) => ({ y, x: x + (y - (y & 1)) / 2 })

/**
 * Converts {@link HexagonalGridCoordinatesSystem.EvenR} coordinates into {@link HexagonalGridCoordinatesSystem.Axial} coordinates
 */
export const evenRToAxial = ({ x, y }: XYCoordinates) => ({ y, x: x - (y + (y & 1)) / 2 })
/**
 * Converts {@link HexagonalGridCoordinatesSystem.Axial} coordinates into {@link HexagonalGridCoordinatesSystem.EvenR} coordinates
 */
export const axialToEvenR = ({ x, y }: XYCoordinates) => ({ y, x: x + (y + (y & 1)) / 2 })

/**
 * Convert any {@link HexagonalGridCoordinatesSystem} coordinates to {@link HexagonalGridCoordinatesSystem.Axial}
 * @param hex Coordinates to convert
 * @param system System of the coordinates
 * @return Coordinates in {@link HexagonalGridCoordinatesSystem.Axial}
 */
export function hexToAxial(hex: XYCoordinates, system: HexagonalGridCoordinatesSystem) {
  switch (system) {
    case HexagonalGridCoordinatesSystem.OddQ:
      return oddQToAxial(hex)
    case HexagonalGridCoordinatesSystem.EvenQ:
      return evenQToAxial(hex)
    case HexagonalGridCoordinatesSystem.OddR:
      return oddRToAxial(hex)
    case HexagonalGridCoordinatesSystem.EvenR:
      return evenRToAxial(hex)
    default:
      return hex
  }
}

/**
 * Convert {@link HexagonalGridCoordinatesSystem.Axial} coordinates to any other {@link HexagonalGridCoordinatesSystem}
 * @param hex Axial coordinates to convert
 * @param system Destination coordinates system
 * @return Coordinates converted in the description system
 */
export function hexFromAxial(hex: XYCoordinates, system: HexagonalGridCoordinatesSystem) {
  switch (system) {
    case HexagonalGridCoordinatesSystem.OddQ:
      return axialToOddQ(hex)
    case HexagonalGridCoordinatesSystem.EvenQ:
      return axialToEvenQ(hex)
    case HexagonalGridCoordinatesSystem.OddR:
      return axialToOddR(hex)
    case HexagonalGridCoordinatesSystem.EvenR:
      return axialToEvenR(hex)
    default:
      return hex
  }
}

/**
 * Rotate hexagonal axial coordinates.
 * @param vector Vector to rotate
 * @param rotation Number of 60 degrees rotations to apply (1 = 60°, 2 = 120°...)
 * @return the rotated vector
 */
export function hexRotate(vector: XYCoordinates, rotation: number = 0): XYCoordinates {
  switch (rotation % 6) {
    case 1:
      return { x: -vector.y, y: vector.x + vector.y }
    case 2:
      // noinspection JSSuspiciousNameCombination
      return { x: -vector.x - vector.y, y: vector.x }
    case 3:
      return { x: -vector.x, y: -vector.y }
    case 4:
      // noinspection JSSuspiciousNameCombination
      return { x: vector.y, y: -vector.x - vector.y }
    case 5:
      return { x: vector.x + vector.y, y: -vector.x }
    default:
      return vector
  }
}
