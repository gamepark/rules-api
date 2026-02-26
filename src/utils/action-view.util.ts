import { Action } from '../Action'
import { hasHiddenInformation, HiddenInformation } from '../HiddenInformation'
import { Rules } from '../Rules'
import { hasSecretInformation } from '../SecretInformation'
import { applyAutomaticMoves } from './automatic-moves.util'
import { hasRandomMove } from './random.util'

export type ActionWithViews<Move = any, MoveView = Move, PlayerId = any> = {
  action: Action<Move, PlayerId>
  views: ActionView<MoveView, PlayerId>[]
}

export type ActionView<MoveView = any, PlayerId = any> = {
  recipient?: PlayerId
  action: Action<MoveView, PlayerId>
}

export function playActionWithViews<Game, View, Move, MoveView, PlayerId>(
  rules: Rules<Game, Move, PlayerId> & HiddenInformation<View, Move, MoveView>, move: Move, playerId: PlayerId, recipients: PlayerId[], id?: string
): ActionWithViews<Move, MoveView, PlayerId> {

  if (hasRandomMove(rules)) {
    move = rules.randomize(move, playerId)
  }

  const actionWithView: ActionWithViews<Move, MoveView, PlayerId> = {
    action: { id, playerId, move, consequences: [] },
    views: []
  }

  // Prepare action view for each player
  for (const recipient of recipients) {
    actionWithView.views.push({ recipient, action: { id, playerId, move: getMoveView(rules, move, recipient), consequences: [] } })
  }
  // Prepare action view for spectators
  actionWithView.views.push({ action: { id, playerId, move: getMoveView(rules, move), consequences: [] } })

  const context = { player: playerId as number }
  const consequences = rules.play(JSON.parse(JSON.stringify(move)), context)

  applyAutomaticMoves(rules, consequences, move => {
    actionWithView.action.consequences.push(move)
    for (const view of actionWithView.views) {
      view.action.consequences.push(getMoveView(rules, move, view.recipient))
    }
  }, context)

  return actionWithView
}

export function getMoveView<GameView, Move, MoveView, PlayerId>(rules: Rules<any, Move, PlayerId>, move: Move, playerId?: PlayerId): MoveView {
  if (hasSecretInformation<GameView, Move, MoveView, PlayerId>(rules) && rules.getPlayerMoveView && playerId !== undefined) {
    return JSON.parse(JSON.stringify(rules.getPlayerMoveView(move, playerId)))
  } else if (hasHiddenInformation<GameView, Move, MoveView>(rules)) {
    return JSON.parse(JSON.stringify(rules.getMoveView(move)))
  } else {
    return move as Move & MoveView
  }
}

export type SecretAction<Move = any, MoveView = Move, PlayerId = any> = Action<Move, PlayerId> & {
  secrets: ActionView<MoveView, PlayerId>[]
}

export function isSecretAction(action: Action): action is SecretAction {
  return Array.isArray((action as SecretAction).secrets)
}
