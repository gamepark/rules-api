import { hasIncompleteInformation, hasSecretInformation } from '../IncompleteInformation'
import { Rules } from '../Rules'

export function getGameView<Game, GameView, PlayerId>(rules: Rules<Game, any, PlayerId>, playerId?: PlayerId): GameView {
  if (hasSecretInformation<GameView, any, any, PlayerId>(rules) && playerId !== undefined) {
    return rules.getPlayerView(playerId)
  } else if (hasIncompleteInformation<GameView>(rules)) {
    return rules.getView()
  } else {
    return rules.game as Game & GameView
  }
}