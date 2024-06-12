import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'
import { MaterialMoveCommon } from './ItemMove'
import { ItemMoveType } from './ItemMoveType'

export type DeleteItemsAtOnce<MaterialType extends number = number> = MaterialMoveCommon<MaterialType> & {
  type: typeof ItemMoveType.DeleteAtOnce
  indexes: number[]
}

export function isDeleteItemsAtOnce<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is DeleteItemsAtOnce<M> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.DeleteAtOnce
}

export function isDeleteItemTypeAtOnce<P extends number, M extends number, L extends number>(
  type: M
): (move: MaterialMove<P, M, L>) => move is DeleteItemsAtOnce<M> {
  return (move: MaterialMove<P, M, L>): move is DeleteItemsAtOnce<M> =>
    isDeleteItemsAtOnce(move) && move.itemType === type
}
