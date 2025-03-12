import { Location } from './Location'
import { Material } from '../items'

export class LocationBuilder<P extends number = number, L extends number = number, Id = any, Rotation = any> {
  readonly location: Location<P, L, Id, Rotation>

  constructor(location: Location<P, L, Id, Rotation>) {
    this.location = location
  }

  id(id: Id): LocationBuilder<P, L, Id, Rotation> {
    return new LocationBuilder<P, L, Id, Rotation>({ ...this.location, id })
  }

  player(player: P) {
    return new LocationBuilder<P, L, Id, Rotation>({ ...this.location, player })
  }

  parent(arg: number | Material<P, number, L>) {
    const parent = typeof arg === 'number' ? arg : arg.entries[0][0]
    return new LocationBuilder<P, L, Id, Rotation>({ ...this.location, parent })
  }

  x(x: number) {
    return new LocationBuilder<P, L, Id, Rotation>({ ...this.location, x })
  }

  y(y: number) {
    return new LocationBuilder<P, L, Id, Rotation>({ ...this.location, y })
  }

  z(z: number) {
    return new LocationBuilder<P, L, Id, Rotation>({ ...this.location, z })
  }

  rotation(rotation: Rotation) {
    return new LocationBuilder<P, L, Id, Rotation>({ ...this.location, rotation })
  }
}