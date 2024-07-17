import { RandomMove } from '../RandomMove'
import { Rules } from '../Rules'

/**
 * Type guard for rules with Random moves
 * @param rules The game's rules
 * @return true if the rules implements {@link RandomMove} interface
 */
export function hasRandomMove<Game, Move, RandomizedMove>(
  rules: Rules<Game, Move>
): rules is Rules<Game, Move> & RandomMove<Move, RandomizedMove> {
  const test = rules as Rules<Game, Move> & RandomMove<Move, RandomizedMove>
  return typeof test.randomize === 'function'
}

/**
 * Randomizes a list of moves at once
 * @param rules Rules of the game
 * @param moves Moves to randomize
 * @returns the randomized moves if the rules implements {@link RandomMove}
 */
export function randomizeMoves<Game, Move, RandomizedMove = Move>(rules: Rules<Game, Move>, moves: Move[]) {
  if (hasRandomMove<Game, Move, RandomizedMove>(rules)) {
    return moves.map(move => rules.randomize(move))
  } else {
    return moves as (Move & RandomizedMove)[]
  }
}
