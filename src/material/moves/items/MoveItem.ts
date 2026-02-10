import { MaterialItem } from '../../items'
import { Location } from '../../location'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'
import { MaterialMoveCommon } from './ItemMove'
import { ItemMoveType } from './ItemMoveType'

/**
 * Move object that will move one existing {@link MaterialItem} (or a part of its quantity) to a new location, when played
 * Use {@link Material} utility to build the move easily
 *
 * @property itemIndex index of the item to move
 * @property location the new location
 * @property quantity if provided, move the specified quantity from the item (split in two items). Otherwise, move all the item.
 * @property reveal this property automatically set inside {@link HiddenMaterialRules} to provides any extra information about the item revealed by the move
 */
export type MoveItem<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  = MaterialMoveCommon<MaterialType> & {
  type: typeof ItemMoveType.Move
  itemIndex: number
  location: Partial<Location<Player, LocationType>>
  quantity?: number
  reveal?: Omit<MaterialItem<Player, LocationType>, 'location'>
}

/**
 * Type guard to test if a {@link MaterialMove} is a {@link MoveItem} move
 * @param move Move to test
 * @returns true if move is a {@link MoveItem}
 */
export function isMoveItem<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is MoveItem<P, M, L> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.Move
}

/**
 * Function to get a type guard for a {@link MoveItem} move for specific item types.
 * @param type Item type to test
 * @param index Optional itemIndex to test along the item type
 * @returns a type guard similar as {@link isMoveItem} but that also verify the item type.
 */
export function isMoveItemType<T extends number>(
  type: T, index?: number
): <P extends number, L extends number>(move: MaterialMove<P, number, L>) => move is MoveItem<P, T, L> {
  return <P extends number, L extends number>(move: MaterialMove<P, number, L>): move is MoveItem<P, T, L> =>
    isMoveItem(move) && move.itemType === type && (index === undefined || move.itemIndex === index)
}
