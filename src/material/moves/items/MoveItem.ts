import { MaterialItem } from '../../items'
import { Location } from '../../location'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'
import { MaterialMoveCommon } from './ItemMove'
import { ItemMoveType } from './ItemMoveType'

export type MoveItem<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  = MaterialMoveCommon<MaterialType> & {
  type: typeof ItemMoveType.Move
  itemIndex: number
  location: Partial<Location<Player, LocationType>>
  quantity?: number
  reveal?: Omit<MaterialItem<Player, LocationType>, 'location'>
}

export function isMoveItem<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is MoveItem<P, M, L> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.Move
}

export function isMoveItemType<P extends number, M extends number, L extends number>(
  type: M, index?: number
): (move: MaterialMove<P, M, L>) => move is MoveItem<P, M, L> {
  return (move: MaterialMove<P, M, L>): move is MoveItem<P, M, L> =>
    isMoveItem(move) && move.itemType === type && (index === undefined || move.itemIndex === index)
}
