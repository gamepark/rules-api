import { PlayMoveContext, Rules } from '../Rules'
import { loopWithFuse } from './loops.util'
import { hasRandomMove } from './random.util'

export function applyAutomaticMoves<Game, Move, PlayerId>(rules: Rules<Game, Move, PlayerId>, moves: Move[] = [], preprocessMove?: (move: Move) => void, context?: PlayMoveContext) {
  loopWithFuse(() => {
    if (moves.length === 0 && rules.getAutomaticMoves) {
      moves.push(...rules.getAutomaticMoves())
    }
    const move = moves.shift()
    if (!move) return false
    const randomizedMove = hasRandomMove(rules) ? rules.randomize(move) : move
    if (preprocessMove) preprocessMove(randomizedMove)
    const consequences = rules.play(JSON.parse(JSON.stringify(randomizedMove)), context) ?? []
    moves.unshift(...consequences)
    return true
  }, { errorFn: () => new Error(`Infinite loop detected while applying move consequences: ${JSON.stringify(moves)})`) })
}