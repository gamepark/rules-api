import { XYCoordinates } from '../../utils'

export type Location<Player = number, LocationType = number, Id = any, Rotation = any> = {
  type: LocationType
  id?: Id
  player?: Player
  parent?: number
  rotation?: Rotation
} & Partial<Coordinates>

export type Coordinates = XYCoordinates & { z: number }

export const isSameLocationArea = (...locations: Partial<Location>[]): boolean => locations.every((l, _, [l0]) =>
  l.type === l0.type && l.id === l0.id && l.player === l0.player && l.parent === l0.parent
)
