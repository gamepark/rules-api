import { ItemMoveType } from './ItemMoveType'
import { MaterialMoveCommon } from './ItemMove'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'

export type DeleteItem<MaterialType extends number = number> = MaterialMoveCommon<MaterialType> & {
  type: typeof ItemMoveType.Delete
  itemIndex: number
  quantity?: number
}

export function isDeleteItem<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is DeleteItem<M> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.Delete
}

export function isDeleteItemType<P extends number, M extends number, L extends number>(
  type: M, index?: number
): (move: MaterialMove<P, M, L>) => move is DeleteItem<M> {
  return (move: MaterialMove<P, M, L>): move is DeleteItem<M> =>
    isDeleteItem(move) && move.itemType === type && (index === undefined || move.itemIndex === index)
}
