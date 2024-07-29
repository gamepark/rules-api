import { MoveKind } from '../MoveKind'
import { CreateItem } from './CreateItem'
import { CreateItemsAtOnce } from './CreateItemsAtOnce'
import { DeleteItem } from './DeleteItem'
import { DeleteItemsAtOnce } from './DeleteItemsAtOnce'
import { MoveItemsAtOnce } from './MoveItemsAtOnce'
import { MoveItem } from './MoveItem'
import { RollItem } from './RollItem'
import { SelectItem } from './SelectItem'
import { Shuffle, ShuffleRandomized } from './Shuffle'

/**
 * Common type for all the moves that have an impact on the game material items
 */
export type ItemMove<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  = CreateItem<Player, MaterialType, LocationType>
  | CreateItemsAtOnce<Player, MaterialType, LocationType>
  | DeleteItem<MaterialType>
  | DeleteItemsAtOnce<MaterialType>
  | MoveItem<Player, MaterialType, LocationType>
  | MoveItemsAtOnce<Player, MaterialType, LocationType>
  | Shuffle<MaterialType>
  | RollItem<Player, MaterialType, LocationType>
  | SelectItem<MaterialType>

/**
 * Common properties for all the types of {@link ItemMove}
 */
export type MaterialMoveCommon<MaterialType extends number = number> = {
  kind: typeof MoveKind.ItemMove
  itemType: MaterialType
}

/**
 * An {@link ItemMove} but after if has been randomized (see {@link RandomMove})
 */
export type ItemMoveRandomized<P extends number = number, M extends number = number, L extends number = number>
  = Exclude<ItemMove<P, M, L>, Shuffle<M>> | ShuffleRandomized<M>

/**
 * An {@link ItemMove} but after if has been transformed into what a player or a spectator can view (see {@link HiddenInformation})
 */
export type ItemMoveView<P extends number = number, M extends number = number, L extends number = number>
  = Exclude<ItemMoveRandomized<P, M, L>, ShuffleRandomized<M>> | Shuffle<M>
