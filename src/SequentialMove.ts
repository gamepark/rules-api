import { Rules } from './Rules'

/**
 * When multiple actions are played concurrently (e.g. during simultaneous phases), they are animated in parallel for a smooth UI.
 * However, some moves change the game phase (e.g. StartSimultaneousRule) and recompute shared state (e.g. availableIndexes for interleaving).
 * These moves must wait for all other animations to complete before being played, to ensure the game state is fully applied.
 *
 * Implement this interface to identify which moves require this synchronization barrier.
 */
export interface SequentialMoves<M = any> {
  /**
   * Tell if a move must wait for all other concurrent animations to complete before being played.
   * @param move A move
   * @returns true if the move requires sequential execution
   */
  isSequentialMove(move: M): boolean
}

/**
 * Type guard for {@link SequentialMoves} interface
 * @param rules Rules of the game
 * @returns true if rules implements {@link SequentialMoves}
 */
export const hasSequentialMoves = <G = any, M = any, P = any>(
  rules: Rules<G, M, P>
): rules is Rules<G, M, P> & SequentialMoves<M> => typeof rules.isSequentialMove === 'function'
