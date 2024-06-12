import { XYCoordinates } from '../../utils'

export type Location<Player = number, LocationType = number, Id = any, Rotation = any> = {
  type: LocationType
  id?: Id
  player?: Player
  parent?: number
  rotation?: Rotation
} & Partial<Coordinates>

export type Coordinates = XYCoordinates & { z: number }
