import { MaterialItem } from '../../items'
import { ItemMoveType } from './ItemMoveType'
import { MaterialMoveCommon } from './ItemMove'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'

/**
 * Move object that will create one {@link MaterialItem} when played
 */
export type CreateItem<P extends number = number, M extends number = number, L extends number = number> = MaterialMoveCommon<M> & {
  type: typeof ItemMoveType.Create
  item: MaterialItem<P, L>
}

/**
 * Type guard to test if a {@link MaterialMove} is a {@link CreateItem} move
 * @param move Move to test
 * @returns true if move is a {@link CreateItem}
 */
export function isCreateItem<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is CreateItem<P, M, L> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.Create
}

/**
 * Function to get a type guard for a {@link CreateItem} move for specific item types.
 * @param type Item type to test
 * @returns a type guard similar as {@link isCreateItem} but that also verify the item type.
 */
export function isCreateItemType<T extends number>(
  type: T
): <P extends number, L extends number>(move: MaterialMove<P, number, L>) => move is CreateItem<P, T, L> {
  return <P extends number, L extends number>(move: MaterialMove<P, number, L>): move is CreateItem<P, T, L> =>
    isCreateItem(move) && move.itemType === type
}
