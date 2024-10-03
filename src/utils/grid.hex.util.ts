import { Location } from '../material'
import { XYCoordinates } from './grid.util'

/**
 * The different coordinates systems available to describe a Hexagonal Grid.
 * See https://www.redblobgames.com/grids/hexagons/#coordinates
 */
export enum HexGridSystem {
  Axial, OddQ, EvenQ, OddR, EvenR
}

/**
 * Converts {@link HexGridSystem.OddQ} coordinates into {@link HexGridSystem.Axial} coordinates
 */
export const oddQToAxial = ({ x, y }: XYCoordinates) => ({ x, y: y - (x - (x & 1)) / 2 })
/**
 * Converts {@link HexGridSystem.Axial} coordinates into {@link HexGridSystem.OddQ} coordinates
 */
export const axialToOddQ = ({ x, y }: XYCoordinates) => ({ x, y: y + (x - (x & 1)) / 2 })

/**
 * Converts {@link HexGridSystem.EvenQ} coordinates into {@link HexGridSystem.Axial} coordinates
 */
export const evenQToAxial = ({ x, y }: XYCoordinates) => ({ x, y: y - (x + (x & 1)) / 2 })
/**
 * Converts {@link HexGridSystem.Axial} coordinates into {@link HexGridSystem.EvenQ} coordinates
 */
export const axialToEvenQ = ({ x, y }: XYCoordinates) => ({ x, y: y + (x + (x & 1)) / 2 })

/**
 * Converts {@link HexGridSystem.OddR} coordinates into {@link HexGridSystem.Axial} coordinates
 */
export const oddRToAxial = ({ x, y }: XYCoordinates) => ({ y, x: x - (y - (y & 1)) / 2 })
/**
 * Converts {@link HexGridSystem.Axial} coordinates into {@link HexGridSystem.OddR} coordinates
 */
export const axialToOddR = ({ x, y }: XYCoordinates) => ({ y, x: x + (y - (y & 1)) / 2 })

/**
 * Converts {@link HexGridSystem.EvenR} coordinates into {@link HexGridSystem.Axial} coordinates
 */
export const evenRToAxial = ({ x, y }: XYCoordinates) => ({ y, x: x - (y + (y & 1)) / 2 })
/**
 * Converts {@link HexGridSystem.Axial} coordinates into {@link HexGridSystem.EvenR} coordinates
 */
export const axialToEvenR = ({ x, y }: XYCoordinates) => ({ y, x: x + (y + (y & 1)) / 2 })

/**
 * Convert any {@link HexGridSystem} coordinates to {@link HexGridSystem.Axial}
 * @param hex Coordinates to convert
 * @param system System of the coordinates
 * @return Coordinates in {@link HexGridSystem.Axial}
 */
export function hexToAxial(hex: XYCoordinates, system: HexGridSystem) {
  switch (system) {
    case HexGridSystem.OddQ:
      return oddQToAxial(hex)
    case HexGridSystem.EvenQ:
      return evenQToAxial(hex)
    case HexGridSystem.OddR:
      return oddRToAxial(hex)
    case HexGridSystem.EvenR:
      return evenRToAxial(hex)
    default:
      return hex
  }
}

/**
 * Convert {@link HexGridSystem.Axial} coordinates to any other {@link HexGridSystem}
 * @param hex Axial coordinates to convert
 * @param system Destination coordinates system
 * @return Coordinates converted in the description system
 */
export function hexFromAxial(hex: XYCoordinates, system: HexGridSystem) {
  switch (system) {
    case HexGridSystem.OddQ:
      return axialToOddQ(hex)
    case HexGridSystem.EvenQ:
      return axialToEvenQ(hex)
    case HexGridSystem.OddR:
      return axialToOddR(hex)
    case HexGridSystem.EvenR:
      return axialToEvenR(hex)
    default:
      return hex
  }
}

/**
 * Rotate hexagonal coordinates.
 * @param vector Vector to rotate
 * @param rotation Number of 60 degrees rotations to apply (1 = 60°, 2 = 120°...)
 * @param system The coordinates system used
 * @return the rotated vector
 */
export function hexRotate(vector: XYCoordinates, rotation: number = 0, system = HexGridSystem.Axial): XYCoordinates {
  if (system !== HexGridSystem.Axial) return hexFromAxial(hexRotate(hexToAxial(vector, system), rotation), system)
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

/**
 * Get the distance between 2 hexagons, i.e. the minimum number of hexagons to cross to got from hex1 to hex2.
 * @param hex1 First hexagon coordinates
 * @param hex2 Second hexagon coordinates
 * @param system The coordinates system used
 * @return the distance between the hexagons
 */
export function getDistanceBetweenHex(hex1: XYCoordinates, hex2: XYCoordinates, system = HexGridSystem.Axial): number {
  if (system !== HexGridSystem.Axial) {
    return getDistanceBetweenHex(hexToAxial(hex1, system), hexToAxial(hex2, system))
  }
  return (Math.abs(hex1.x - hex2.x) + Math.abs(hex1.x - hex2.x + hex1.y - hex2.y) + Math.abs(hex1.y - hex2.y)) / 2
}

/**
 * Translate hexagonal coordinates by a vector.
 * @param hex Coordinates of the hexagon to translate
 * @param vector Vector of the translation
 * @param system The coordinates system used
 * @return The coordinates of the hexagon after the translation
 */
export function hexTranslate(hex: XYCoordinates, vector: XYCoordinates, system = HexGridSystem.Axial): XYCoordinates {
  if (system !== HexGridSystem.Axial) return hexFromAxial(hexTranslate(hexToAxial(hex, system), hexToAxial(vector, system)), system)
  return ({ x: hex.x + vector.x, y: hex.y + vector.y })
}

/**
 * Get the coordinates that will be covered by a polyhex tile when at a specific grid location.
 * @param polyhex Coordinates occupied by the polyhex without any rotation in given coordinates system
 * @param location Location of the polyhex on the grid (x, y, and rotation)
 * @param system The coordinates system used for the polyhex description and the location
 * @return coordinates in the grid covered when the polyhex has this location
 */
export function getPolyhexSpaces(polyhex: XYCoordinates[], location: Partial<Location>, system = HexGridSystem.Axial) {
  const vector = { x: location.x ?? 0, y: location.y ?? 0 }
  return polyhex
    .map(hex => hexRotate(hex, location.rotation ?? 0, system))
    .map(hex => hexTranslate(hex, vector, system))
}
