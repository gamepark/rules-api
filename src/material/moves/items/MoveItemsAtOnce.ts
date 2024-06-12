import { MaterialItem } from '../../items'
import { Location } from '../../location'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'
import { MaterialMoveCommon } from './ItemMove'
import { ItemMoveType } from './ItemMoveType'

export type MoveItemsAtOnce<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  = MaterialMoveCommon<MaterialType> & {
  type: typeof ItemMoveType.MoveAtOnce
  indexes: number[]
  location: Partial<Location<Player, LocationType>>
  reveal?: Record<number, Omit<MaterialItem<Player, LocationType>, 'location'>>
}

export function isMoveItemsAtOnce<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is MoveItemsAtOnce<P, M, L> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.MoveAtOnce
}

export function isMoveItemTypeAtOnce<P extends number, M extends number, L extends number>(
  type: M, index?: number
): (move: MaterialMove<P, M, L>) => move is MoveItemsAtOnce<P, M, L> {
  return (move: MaterialMove<P, M, L>): move is MoveItemsAtOnce<P, M, L> =>
    isMoveItemsAtOnce(move) && move.itemType === type && (index === undefined || move.indexes.includes(index))
}
