import { ItemMoveType } from './ItemMoveType'
import { MaterialMoveCommon } from './ItemMove'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'

/**
 * Move object that will delete one {@link MaterialItem}, or a part of its quantity, when played
 * Use {@link Material} utility to build the move easily
 *
 * @property itemIndex index of the item to delete
 * @quantity if provided, removes the specified quantity from the item. Otherwise, remove all the item.
 */
export type DeleteItem<MaterialType extends number = number> = MaterialMoveCommon<MaterialType> & {
  type: typeof ItemMoveType.Delete
  itemIndex: number
  quantity?: number
}

/**
 * Type guard to test if a {@link MaterialMove} is a {@link DeleteItem} move
 * @param move Move to test
 * @returns true if move is a {@link DeleteItem}
 */
export function isDeleteItem<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is DeleteItem<M> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.Delete
}

/**
 * Function to get a type guard for a {@link DeleteItem} move for specific item types.
 * @param type Item type to test
 * @param index Optional itemIndex to test along the item type
 * @returns a type guard similar as {@link isDeleteItem} but that also verify the item type.
 */
export function isDeleteItemType<P extends number, M extends number, L extends number>(
  type: M, index?: number
): (move: MaterialMove<P, M, L>) => move is DeleteItem<M> {
  return (move: MaterialMove<P, M, L>): move is DeleteItem<M> =>
    isDeleteItem(move) && move.itemType === type && (index === undefined || move.itemIndex === index)
}
