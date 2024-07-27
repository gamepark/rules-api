import { MoveKind } from './MoveKind'
import { MaterialMove } from './MaterialMove'

/**
 * A custom move is a special kind of move that can be used when the other kind of move cannot be used to implement the game easily.
 * Often used for actions like saying "I pass" or conceptual actions specific to a game.
 * A custom move does nothing by default. You have to implement "onCustomMove" in {@link MaterialRulesPart} to memorize things of create consequences.
 */
export type CustomMove<Type extends number = number> = {
  kind: typeof MoveKind.CustomMove
  type: Type
  data?: any
}

/**
 * Type guard for {@link CustomMove}
 * @param {MaterialMove} move The move to test
 * @returns true if the move is a {@link CustomMove}
 */
export const isCustomMove = <T extends number = number, P extends number = number, M extends number = number, L extends number = number>(
  move: MaterialMove<P, M, L>
): move is CustomMove<T> => move.kind === MoveKind.CustomMove

/**
 * Function that returns a type guard for a {@link CustomMove} of a specific type
 * @param type The type of custom move to test
 * @returns A type guard function
 *
 * @example
 * `if (isCustomMoveType(CustomMoveType.Pass)(move)) ...`
 */
export function isCustomMoveType<T extends number = number, P extends number = number, M extends number = number, L extends number = number>(
  type: T
): (move: MaterialMove<P, M, L>) => move is CustomMove<T> {
  return (move: MaterialMove<P, M, L>): move is CustomMove<T> => isCustomMove(move) && move.type === type
}
