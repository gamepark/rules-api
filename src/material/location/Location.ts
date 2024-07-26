import { XYCoordinates } from '../../utils'

/**
 * A location where to place the material in a game
 *
 * @typeparam Player - identifier of a player. Either a number or a numeric enum (eg: PlayerColor)
 * @typeparam LocationType - Numeric enum of the types of location in the game where the material can be located
 * @typeparam Id - Type of id property of the location. Must be JSON serializable.
 *
 * @property type The type of location. Usually an enum named LocationType.
 * @property id Optional location identifier, if the coordinates, player and parent items are not enough.
 * @property player Optional owner player of that location.
 * @property parent Optional index of the parent item this location belongs to.
 * @property rotation Rotation applied to the item's location
 * @property x Optional X-coordinate
 * @property y Optional Y-coordinate
 * @property z Optional Z-coordinate
 */
export type Location<Player = number, LocationType = number, Id = any, Rotation = any> = {
  type: LocationType
  id?: Id
  player?: Player
  parent?: number
  rotation?: Rotation
} & Partial<Coordinates>

/**
 * A 3-dimension coordinates system
 *
 * @property x X-coordinate
 * @property y Y-coordinate
 * @property z Z-coordinate
 */
export type Coordinates = XYCoordinates & { z: number }

/**
 * Utility function to know whether some locations share the same type, id, player and parent.
 * @param locations Locations to test
 * @returns true if all the locations belongs to the same "area" (only varies in coordinates or rotation)
 */
export const isSameLocationArea = (...locations: Partial<Location>[]): boolean => locations.every((l, _, [l0]) =>
  l.type === l0.type && l.id === l0.id && l.player === l0.player && l.parent === l0.parent
)
