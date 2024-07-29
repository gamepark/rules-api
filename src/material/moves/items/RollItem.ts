import { Location } from '../../location'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'
import { MaterialMoveCommon } from './ItemMove'
import { ItemMoveType } from './ItemMoveType'

/**
 * Move object that will "roll" one existing {@link MaterialItem} to a new location, when played.
 * Use {@link Material} utility to build the move easily.
 * Use this to roll dices or flip coins, for instance.
 * Override "roll" function in {@link MaterialRules} to provide a custom and random "location.rotation" value when the server randomizes the move
 *
 * @property itemIndex index of the item to move
 * @property location the new location (without the rotation when the move is built, then with the randomized location after {@link RandomMove} is applied
 */
export type RollItem<P extends number = number, M extends number = number, L extends number = number> = MaterialMoveCommon<M> & {
  type: typeof ItemMoveType.Roll
  itemIndex: number
  location: Location<P, L>
}

/**
 * Type guard to test if a {@link MaterialMove} is a {@link RollItem} move
 * @param move Move to test
 * @returns true if move is a {@link RollItem}
 */
export function isRoll<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is RollItem<P, M, L> {
  return move.kind === MoveKind.ItemMove && move.type === ItemMoveType.Roll
}

/**
 * Function to get a type guard for a {@link RollItem} move for specific item types.
 * @param type Item type to test
 * @returns a type guard similar as {@link isRoll} but that also verify the item type.
 */
export function isRollItemType<P extends number, M extends number, L extends number>(
  type: M
): (move: MaterialMove<P, M, L>) => move is RollItem<P, M, L> {
  return (move: MaterialMove<P, M, L>): move is RollItem<P, M, L> =>
    isRoll(move) && move.itemType === type
}
