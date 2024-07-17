import { Rules } from './Rules'

/**
 * A move is unpredictable for the player when the outcome is not known, ie when the state of the game after applying the move cannot be processed without
 * the server response.
 * It is the case for moves with random output (like rolling a die), or revealing hidden information (like drawing a card).
 *
 * Game Park offers a smooth experience by executing any move played immediately, without waiting for the server's response, as well as the consequences.
 * However, it cannot be done for unpredictable moves, so this interface allows to identify which move can be played immediately, or not.
 */
export type RulesWithUnpredictableMoves<G = any, M = any, P = any> = Rules<G, M, P> & {
  /**
   * Tell if a move is unpredictable
   * @param move A move
   * @returns true if the move outcome is predictable
   */
  isUnpredictableMove(move: M): boolean
}

/**
 * Type guard for {@link RulesWithUnpredictableMoves} interface
 * @param rules Rules of the game
 * @returns true is rules implements {@link RulesWithUnpredictableMoves}
 */
export const hasUnpredictableMoves = <G = any, M = any, P = any>(
  rules: Rules<G, M, P>
): rules is RulesWithUnpredictableMoves<G, M, P> => typeof rules.isUnpredictableMove === 'function'
