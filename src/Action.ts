import { hasRandomMove } from './RandomMove'
import { Rules } from './Rules'
import { applyAutomaticMoves } from './utils'
import { getMoveView, IncompleteInformation } from './IncompleteInformation'

export type Action<Move = any, PlayerId = any> = {
  id?: string
  playerId: PlayerId
  move: Move
  consequences: Move[]
}

export function playAction<Game, Move, PlayerId>(rules: Rules<Game, Move, PlayerId>, move: Move, playerId: PlayerId): Action<Move, PlayerId> {
  if (hasRandomMove(rules)) {
    move = rules.randomize(move)
  }

  const action: Action<Move, PlayerId> = { playerId, move, consequences: [] }

  const consequences = rules.play(JSON.parse(JSON.stringify(move)))

  applyAutomaticMoves(rules, consequences, move => action.consequences.push(move))

  return action
}

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

export function replayAction<Game, Move, PlayerId>(rules: Rules<Game, Move, PlayerId>, action: Action<Move, PlayerId>) {
  rules.play(JSON.parse(JSON.stringify(action.move)))
  action.consequences.forEach(move => rules.play(JSON.parse(JSON.stringify(move))))
}

export function replayActions<Game, Move, PlayerId>(rules: Rules<Game, Move, PlayerId>, actions: Action<Move, PlayerId>[]) {
  actions.forEach(action => replayAction(rules, action))
}

export type SecretAction<Move = any, MoveView = Move, PlayerId = any> = Action<Move, PlayerId> & {
  secrets: ActionView<MoveView, PlayerId>[]
}

export function isSecretAction(action: Action): action is SecretAction {
  return Array.isArray((action as SecretAction).secrets)
}