import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'
import { MaterialMoveCommon } from './ItemMove'
import { ItemMoveType } from './ItemMoveType'

export type SelectItem<MaterialType extends number = number> = MaterialMoveCommon<MaterialType> & {
  type: typeof ItemMoveType.Select
  itemIndex: number
  quantity?: number
  selected?: boolean
}

export function isSelectItem<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is SelectItem<M> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.Select
}

export function isSelectItemType<P extends number, M extends number, L extends number>(
  type: M, index?: number
): (move: MaterialMove<P, M, L>) => move is SelectItem<M> {
  return (move: MaterialMove<P, M, L>): move is SelectItem<M> =>
    isSelectItem(move) && move.itemType === type && (index === undefined || move.itemIndex === index)
}
