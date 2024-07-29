import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'
import { MaterialMoveCommon } from './ItemMove'
import { ItemMoveType } from './ItemMoveType'

/**
 * Move object that will select one {@link MaterialItem} (or a part of its quantity), when played.
 * Use {@link Material} utility to build the move easily.
 * The same object is used to unselect an item.
 *
 * @property itemIndex index of the item to move
 * @property quantity if provided, move the specified quantity from the item (split in two items). Otherwise, move all the item.
 * @property selected False to unselect
 */
export type SelectItem<MaterialType extends number = number> = MaterialMoveCommon<MaterialType> & {
  type: typeof ItemMoveType.Select
  itemIndex: number
  quantity?: number
  selected?: boolean
}

/**
 * Type guard to test if a {@link MaterialMove} is a {@link SelectItem} move
 * @param move Move to test
 * @returns true if move is a {@link SelectItem}
 */
export function isSelectItem<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is SelectItem<M> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.Select
}

/**
 * Function to get a type guard for a {@link SelectItem} move for specific item types.
 * @param type Item type to test
 * @param index Optional itemIndex to test along the item type
 * @returns a type guard similar as {@link isSelectItem} but that also verify the item type.
 */
export function isSelectItemType<P extends number, M extends number, L extends number>(
  type: M, index?: number
): (move: MaterialMove<P, M, L>) => move is SelectItem<M> {
  return (move: MaterialMove<P, M, L>): move is SelectItem<M> =>
    isSelectItem(move) && move.itemType === type && (index === undefined || move.itemIndex === index)
}
