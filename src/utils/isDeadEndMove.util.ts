import { RulesCreator } from '../RulesCreator'
import { playMove } from '../Action'

// For some game, it is easier to play the moves to know whether the action can be completed, than code all the conditions
export function isDeadEndMove<G, M, P>(move: M, game: G, Rules: RulesCreator<G, M, P>, predicate: (game: G) => boolean, maxDepth = 5): boolean {
  if (maxDepth === 0) return false
  const rules = new Rules(JSON.parse(JSON.stringify(game)))
  playMove(rules, move)
  if (predicate(rules.game)) return false
  const activePlayer = rules.getActivePlayer()
  if (!activePlayer) return true
  return rules.getLegalMoves(activePlayer).every(move => isDeadEndMove(move, rules.game, Rules, predicate, maxDepth - 1))
}