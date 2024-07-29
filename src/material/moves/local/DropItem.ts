import { MoveKind } from '../MoveKind'
import { LocalMoveType } from './LocalMove'

/**
 * Move object to remind when a player has dropped an item
 */
export type DropItem<M extends number = number> = {
  kind: MoveKind.LocalMove
  type: typeof LocalMoveType.DropItem
  item: DisplayedItem<M>
}

/**
 * Data structure of an item displayed on screen
 * @property type the type of item
 * @property index index of the item
 * @property displayIndex when the item has a quantity, the index of the specific item inside the quantity (otherwise 0)
 */
export type DisplayedItem<M extends number = number> = {
  type: M
  index: number
  displayIndex: number
}
