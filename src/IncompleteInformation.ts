import { Rules } from './Rules'

export interface IncompleteInformation<GameView = any, Move = any, MoveView = any> {
  getView(): GameView

  getMoveView(move: Move): MoveView
}

export function hasIncompleteInformation<GameView = any, Move = any, MoveView = any>(rules: Object): rules is IncompleteInformation<GameView, Move, MoveView> {
  const test = rules as IncompleteInformation<GameView, Move, MoveView>
  return typeof test.getView === 'function' && typeof test.getMoveView === 'function'
}

export interface SecretInformation<GameView = any, Move = any, MoveView = any, PlayerId = any> extends IncompleteInformation<GameView, Move, MoveView> {
  getPlayerView(playerId: PlayerId): GameView

  getPlayerMoveView?(move: Move, playerId: PlayerId): MoveView

  keepMoveSecret?(move: Move, playerId: PlayerId): boolean
}

export function hasSecretInformation<GameView = any, Move = any, MoveView = any, PlayerId = any>(rules: Object): rules is SecretInformation<GameView, Move, MoveView, PlayerId> {
  const test = rules as SecretInformation<GameView, Move, MoveView, PlayerId>
  return typeof test.getPlayerView === 'function'
}

export function getGameView<Game, GameView, PlayerId>(rules: Rules<Game, any, PlayerId>, playerId?: PlayerId): GameView {
  if (hasSecretInformation<GameView, any, any, PlayerId>(rules) && playerId !== undefined) {
    return rules.getPlayerView(playerId)
  } else if (hasIncompleteInformation<GameView>(rules)) {
    return rules.getView()
  } else {
    return rules.game as Game & GameView
  }
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
