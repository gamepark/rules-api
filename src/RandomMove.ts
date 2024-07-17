import { Rules } from './Rules'

/**
 * Some moves have a random output. This random output must be processed by the server, otherwise players could cheat.
 * Also, the random output must be saved alongside the move in order to be able to replay the game consistently.
 * (Another solution would have been to use a seed for the random number generator, but this feature was not available with Javascript Math.random).
 * Therefore, the move must be played and validated without the random output, then the random output must be processed and added to the move.
 * This interface must be implemented in order to add the random output to the moves that requires it.
 */
export interface RandomMove<Move = any, RandomizedMove = any> {
  /**
   * Add the random output to a move when necessary
   * @param move A move just played that might need to be randomized
   * @returns the move with the random output (or unchanged move if it is not a random move)
   */
  randomize(move: Move): Move & RandomizedMove

  /**
   * The signature of {@link Rules.play} changes a little bit: the moves are always randomized before they are played
   * @param move The move to execute, always randomized first
   * @returns the consequences of the move (not randomized yet)
   */
  play(move: Move & RandomizedMove): Move[]
}
