import { ItemMoveType } from './ItemMoveType'
import { MaterialMoveCommon } from './ItemMove'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'

/**
 * Move object that will shuffle a list of {@link MaterialItem}, when played.
 * Use {@link Material} utility to build the move easily.
 * When items are shuffled, they swap their indexes randomly so that players can never "track" one item in the list.
 *
 * @property indexes indexes of the items to shuffle
 */
export type Shuffle<MaterialType extends number = number> = MaterialMoveCommon<MaterialType> & {
  type: typeof ItemMoveType.Shuffle
  indexes: number[]
}

/**
 * Data structure when a {@link Shuffle} move has been randomized.
 * @property newIndexes The new random indexes
 */
export type ShuffleRandomized<MaterialType extends number = number> = Shuffle<MaterialType> & {
  newIndexes: number[]
}

/**
 * Type guard to test if a {@link MaterialMove} is a {@link Shuffle} move
 * @param move Move to test
 * @returns true if move is a {@link Shuffle}
 */
export function isShuffle<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is Shuffle<M> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.Shuffle
}

/**
 * Function to get a type guard for a {@link Shuffle} move for specific item types.
 * @param type Item type to test
 * @returns a type guard similar as {@link isShuffle} but that also verify the item type.
 */
export function isShuffleItemType<T extends number>(
  type: T
): <P extends number, L extends number>(move: MaterialMove<P, number, L>) => move is Shuffle<T> {
  return <P extends number, L extends number>(move: MaterialMove<P, number, L>): move is Shuffle<T> =>
    isShuffle(move) && move.itemType === type
}

/**
 * Type guard to test if a {@link MaterialMove} is a {@link ShuffleRandomized} move
 * @param move Move to test
 * @returns true if move is a {@link ShuffleRandomized}
 */
export function isShuffleRandomized<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is ShuffleRandomized<M> {
  return isShuffle(move) && Array.isArray((move as ShuffleRandomized<M>).newIndexes)
}
