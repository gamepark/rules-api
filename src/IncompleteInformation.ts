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

