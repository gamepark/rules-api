import { Location } from '../../location'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'
import { MaterialMoveCommon } from './ItemMove'
import { ItemMoveType } from './ItemMoveType'

export type RollItem<P extends number = number, M extends number = number, L extends number = number> = MaterialMoveCommon<M> & {
  type: typeof ItemMoveType.Roll
  itemIndex: number
  location: Location<P, L>
}

export function isRoll<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is RollItem<P, M, L> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.Roll
}

export function isRollItemType<P extends number, M extends number, L extends number>(
  type: M
): (move: MaterialMove<P, M, L>) => move is RollItem<P, M, L> {
  return (move: MaterialMove<P, M, L>): move is RollItem<P, M, L> =>
    isRoll(move) && move.itemType === type
}
