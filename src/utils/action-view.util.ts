import { Action } from '../Action'
import { hasIncompleteInformation, hasSecretInformation, IncompleteInformation } from '../IncompleteInformation'
import { hasRandomMove } from '../RandomMove'
import { Rules } from '../Rules'
import { applyAutomaticMoves } from './automatic-moves.util'

export type ActionWithViews<Move = any, MoveView = Move, PlayerId = any> = {
  action: Action<Move, PlayerId>
  views: ActionView<MoveView, PlayerId>[]
}

export type ActionView<MoveView = any, PlayerId = any> = {
  recipient?: PlayerId
  action: Action<MoveView, PlayerId>
}

export function playActionWithViews<Game, View, Move, MoveView, PlayerId>(
  rules: Rules<Game, Move, PlayerId> & IncompleteInformation<View, Move, MoveView>, move: Move, playerId: PlayerId, recipients: PlayerId[], id?: string
): ActionWithViews<Move, MoveView, PlayerId> {

  if (hasRandomMove(rules)) {
    move = rules.randomize(move)
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

  const consequences = rules.play(JSON.parse(JSON.stringify(move)))

  applyAutomaticMoves(rules, consequences, move => {
    actionWithView.action.consequences.push(move)
    for (const view of actionWithView.views) {
      view.action.consequences.push(getMoveView(rules, move, view.recipient))
    }
  })

  return actionWithView
}

export function getMoveView<GameView, Move, MoveView, PlayerId>(rules: Rules<any, Move, PlayerId>, move: Move, playerId?: PlayerId): MoveView {
  if (hasSecretInformation<GameView, Move, MoveView, PlayerId>(rules) && rules.getPlayerMoveView && playerId !== undefined) {
    return JSON.parse(JSON.stringify(rules.getPlayerMoveView(move, playerId)))
  } else if (hasIncompleteInformation<GameView, Move, MoveView>(rules)) {
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
