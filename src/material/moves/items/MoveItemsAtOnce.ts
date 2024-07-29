import { MaterialItem } from '../../items'
import { Location } from '../../location'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'
import { MaterialMoveCommon } from './ItemMove'
import { ItemMoveType } from './ItemMoveType'

/**
 * Move object that will move multiple {@link MaterialItem} to the same new location when played.
 * Any {@link LocationStrategy} will be applied to each item individually.
 * Use {@link Material} utility to build the move easily.
 * Use this when you need to move around a lot of items at once without animating it one by one, to reduce the data payload.
 *
 * @property indexes indexes of the items to delete
 * @property location the new location for the items
 * @property reveal this property automatically set inside {@link HiddenMaterialRules} to provides any extra information about the items revealed by the move
 */
export type MoveItemsAtOnce<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  = MaterialMoveCommon<MaterialType> & {
  type: typeof ItemMoveType.MoveAtOnce
  indexes: number[]
  location: Partial<Location<Player, LocationType>>
  reveal?: Record<number, Omit<MaterialItem<Player, LocationType>, 'location'>>
}

/**
 * Type guard to test if a {@link MaterialMove} is a {@link MoveItemsAtOnce} move
 * @param move Move to test
 * @returns true if move is a {@link MoveItemsAtOnce}
 */
export function isMoveItemsAtOnce<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is MoveItemsAtOnce<P, M, L> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.MoveAtOnce
}

/**
 * Function to get a type guard for a {@link MoveItemsAtOnce} move for specific item types.
 * @param type Item type to test
 * @returns a type guard similar as {@link isMoveItemsAtOnce} but that also verify the item type.
 */
export function isMoveItemTypeAtOnce<P extends number, M extends number, L extends number>(
  type: M
): (move: MaterialMove<P, M, L>) => move is MoveItemsAtOnce<P, M, L> {
  return (move: MaterialMove<P, M, L>): move is MoveItemsAtOnce<P, M, L> =>
    isMoveItemsAtOnce(move) && move.itemType === type
}
