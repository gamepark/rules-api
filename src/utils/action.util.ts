import { Action } from '../Action'
import { Rules } from '../Rules'
import { applyAutomaticMoves } from './automatic-moves.util'
import { hasRandomMove } from './random.util'

export function playAction<Game, Move, PlayerId>(rules: Rules<Game, Move, PlayerId>, move: Move, playerId: PlayerId): Action<Move, PlayerId> {
  if (hasRandomMove(rules)) {
    move = rules.randomize(move, playerId)
  }

  const action: Action<Move, PlayerId> = { playerId, move, consequences: [] }

  const consequences = rules.play(JSON.parse(JSON.stringify(move)))

  applyAutomaticMoves(rules, consequences, move => action.consequences.push(move))

  return action
}

export function replayAction<Game, Move, PlayerId>(rules: Rules<Game, Move, PlayerId>, action: Action<Move, PlayerId>) {
  rules.play(JSON.parse(JSON.stringify(action.move)))
  action.consequences.forEach(move => rules.play(JSON.parse(JSON.stringify(move))))
}

export function replayActions<Game, Move, PlayerId>(rules: Rules<Game, Move, PlayerId>, actions: Action<Move, PlayerId>[]) {
  actions.forEach(action => replayAction(rules, action))
}
