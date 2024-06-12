import { MaterialItem } from '../../items'
import { ItemMoveType } from './ItemMoveType'
import { MaterialMoveCommon } from './ItemMove'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'

export type CreateItemsAtOnce<P extends number = number, M extends number = number, L extends number = number> = MaterialMoveCommon<M> & {
  type: typeof ItemMoveType.CreateAtOnce
  items: MaterialItem<P, L>[]
}

export function isCreateItemsAtOnce<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is CreateItemsAtOnce<P, M, L> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.CreateAtOnce
}

export function isCreateItemTypeAtOnce<P extends number, M extends number, L extends number>(
  type: M
): (move: MaterialMove<P, M, L>) => move is CreateItemsAtOnce<P, M, L> {
  return (move: MaterialMove<P, M, L>): move is CreateItemsAtOnce<P, M, L> =>
    isCreateItemsAtOnce(move) && move.itemType === type
}
