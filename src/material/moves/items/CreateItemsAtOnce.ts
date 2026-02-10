import { MaterialItem } from '../../items'
import { ItemMoveType } from './ItemMoveType'
import { MaterialMoveCommon } from './ItemMove'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'

/**
 * Move object that will create multiple {@link MaterialItem} when played.
 * Use it when you create a lot of items at once and do not need to animate them, to reduce the data payload.
 */
export type CreateItemsAtOnce<P extends number = number, M extends number = number, L extends number = number> = MaterialMoveCommon<M> & {
  type: typeof ItemMoveType.CreateAtOnce
  items: MaterialItem<P, L>[]
}

/**
 * Type guard to test if a {@link MaterialMove} is a {@link CreateItemsAtOnce} move
 * @param move Move to test
 * @returns true if move is a {@link CreateItemsAtOnce}
 */
export function isCreateItemsAtOnce<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is CreateItemsAtOnce<P, M, L> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.CreateAtOnce
}

/**
 * Function to get a type guard for a {@link CreateItemsAtOnce} move for specific item types.
 * @param type Item type to test
 * @returns a type guard similar as {@link isCreateItemsAtOnce} but that also verify the item type.
 */
export function isCreateItemTypeAtOnce(
  type: number
): <P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>) => move is CreateItemsAtOnce<P, M, L> {
  return <P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is CreateItemsAtOnce<P, M, L> =>
    isCreateItemsAtOnce(move) && move.itemType === type
}
