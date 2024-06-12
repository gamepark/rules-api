import { ItemMoveType } from './ItemMoveType'
import { MaterialMoveCommon } from './ItemMove'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'

export type Shuffle<MaterialType extends number = number> = MaterialMoveCommon<MaterialType> & {
  type: typeof ItemMoveType.Shuffle
  indexes: number[]
}

export type ShuffleRandomized<MaterialType extends number = number> = Shuffle<MaterialType> & {
  newIndexes: number[]
}

export function isShuffle<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is Shuffle<M> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.Shuffle
}

export function isShuffleItemType<P extends number, M extends number, L extends number>(
  type: M
): (move: MaterialMove<P, M, L>) => move is Shuffle<M> {
  return (move: MaterialMove<P, M, L>): move is Shuffle<M> =>
    isShuffle(move) && move.itemType === type
}

export function isShuffleRandomized<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is ShuffleRandomized<M> {
  return isShuffle(move) && Array.isArray((move as ShuffleRandomized<M>).newIndexes)
}
