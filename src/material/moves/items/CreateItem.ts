import { MaterialItem } from '../../items'
import { ItemMoveType } from './ItemMoveType'
import { MaterialMoveCommon } from './ItemMove'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'

export type CreateItem<P extends number = number, M extends number = number, L extends number = number> = MaterialMoveCommon<M> & {
  type: typeof ItemMoveType.Create
  item: MaterialItem<P, L>
}

export function isCreateItem<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is CreateItem<P, M, L> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.Create
}

export function isCreateItemType<P extends number, M extends number, L extends number>(
  type: M
): (move: MaterialMove<P, M, L>) => move is CreateItem<P, M, L> {
  return (move: MaterialMove<P, M, L>): move is CreateItem<P, M, L> =>
    isCreateItem(move) && move.itemType === type
}
