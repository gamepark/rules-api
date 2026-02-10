import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'
import { MaterialMoveCommon } from './ItemMove'
import { ItemMoveType } from './ItemMoveType'

/**
 * Move object that will delete multiple {@link MaterialItem} when played.
 * Use {@link Material} utility to build the move easily.
 * Use this when you need to delete a lot of items without animating it one by one, to reduce the data payload.
 *
 * @property indexes indexes of the items to delete
 */
export type DeleteItemsAtOnce<MaterialType extends number = number> = MaterialMoveCommon<MaterialType> & {
  type: typeof ItemMoveType.DeleteAtOnce
  indexes: number[]
}

/**
 * Type guard to test if a {@link MaterialMove} is a {@link DeleteItemsAtOnce} move
 * @param move Move to test
 * @returns true if move is a {@link DeleteItemsAtOnce}
 */
export function isDeleteItemsAtOnce<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is DeleteItemsAtOnce<M> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.DeleteAtOnce
}

/**
 * Function to get a type guard for a {@link DeleteItemsAtOnce} move for specific item types.
 * @param type Item type to test
 * @returns a type guard similar as {@link isDeleteItemsAtOnce} but that also verify the item type.
 */
export function isDeleteItemTypeAtOnce<T extends number>(
  type: T
): <P extends number, L extends number>(move: MaterialMove<P, number, L>) => move is DeleteItemsAtOnce<T> {
  return <P extends number, L extends number>(move: MaterialMove<P, number, L>): move is DeleteItemsAtOnce<T> =>
    isDeleteItemsAtOnce(move) && move.itemType === type
}
