import { RandomMove } from '../RandomMove'
import { Rules } from '../Rules'

/**
 * Type guard for rules with Random moves
 * @param rules The game's rules
 * @return true if the rules implements {@link RandomMove} interface
 */
export function hasRandomMove<Game, Move, RandomizedMove, PlayerId>(
  rules: Rules<Game, Move, PlayerId>
): rules is Rules<Game, Move> & RandomMove<Move, RandomizedMove, PlayerId> {
  const test = rules as Rules<Game, Move> & RandomMove<Move, RandomizedMove, PlayerId>
  return typeof test.randomize === 'function'
}
