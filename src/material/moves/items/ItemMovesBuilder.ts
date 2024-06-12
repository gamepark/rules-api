import { MaterialMove } from '../MaterialMove'
import { MaterialItem } from '../../items'
import { MoveKind } from '../MoveKind'
import { ItemMove } from './ItemMove'
import { Shuffle } from './Shuffle'
import { ItemMoveType } from './ItemMoveType'

export class ItemMovesBuilder<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> {
  items: Partial<Record<MaterialType, MaterialItem<Player, LocationType>[]>>
  moves: MaterialMove<Player, MaterialType, LocationType>[] = []

  constructor(
    items: Partial<Record<MaterialType, MaterialItem<Player, LocationType>[]>>
  ) {
    this.items = items
  }

  shuffle(
    itemsType: MaterialType,
    predicate: (item: MaterialItem<Player, LocationType>) => boolean = () =>
      true
  ) {
    const items = this.items[itemsType]
    if (!items)
      throw new Error(
        'You cannot shuffle a type of items that does not exists'
      )
    const move: ItemMove<Player, MaterialType, LocationType> & Shuffle = {
      kind: MoveKind.ItemMove,
      itemType: itemsType,
      type: ItemMoveType.Shuffle,
      indexes: []
    }
    for (let index = 0; index < items.length; index++) {
      if (predicate(items[index])) move.indexes.push(index)
    }
    this.moves.push(move)
    return this
  }
}
