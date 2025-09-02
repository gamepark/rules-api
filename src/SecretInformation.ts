import { Action } from './Action'
import { HiddenInformation } from './HiddenInformation'

/**
 * Some game hide information to the player, and the information is not equally accessible by each player.
 * For example, when a player knows the cards in their hand, but this information is not available to other players.
 * The rules of the game need to implement this interface in that case to secure the information.
 *
 * It is important not to implement SecretInformation if {@link HiddenInformation} is sufficient, because implementing SecretInformation will create a
 * distinct notification channel for each player, thus more notifications that necessary if all players have access to the same information.
 */
export interface SecretInformation<GameView = any, Move = any, MoveView = any, PlayerId = any> extends HiddenInformation<GameView, Move, MoveView> {
  /**
   * In a game with Secret Information, getView is called for spectators only. See {@link HiddenInformation.getView}.
   */
  getView(): GameView

  /**
   * In a game with Secret Information, getMoveView is called for spectators only. See {@link HiddenInformation.getMoveView}.
   */
  getMoveView(move: Move): MoveView

  /**
   * Same as {@link HiddenInformation.getView}, but for one player.
   * @param playerId The player this view will be sent to
   * @returns the state of the game this player can see
   */
  getPlayerView(playerId: PlayerId): GameView

  /**
   * Same as {@link HiddenInformation.getMoveView}, but for one player.
   * @param move A move that happened in the game
   * @param playerId The player this move view will be sent to
   * @returns the move with less or more data depending on what to hide or reveal
   */
  getPlayerMoveView?(move: Move, playerId: PlayerId): MoveView

  /**
   * If some moves played must be entirely keep secret to other players, you can implement this function to prevent the move from being transmitted to
   * another player as long as necessary.
   * Useful for game with secret planning for instance.
   *
   * @param move A move played by a player
   * @param playerId Identifier of another player
   * @return true as long as the move must be kept secret from that player
   */
  keepMoveSecret?(move: Move, playerId: PlayerId): boolean

  /**
   * If some actions played must be entirely keep secret to other players, you can implement this function to prevent the action from being transmitted to
   * another player as long as necessary.
   * Useful for game with secret planning for instance.
   *
   * @param action An action played by a player
   * @param playerId Identifier of another player
   * @return true as long as the move must be kept secret from that player
   */
  keepActionSecret?(action: Action<Move, PlayerId>, playerId: PlayerId): boolean
}

/**
 * Type guard for games with secret information
 * @param rules Rules of the game
 * @returns true if the game implements {@link SecretInformation}
 */
export function hasSecretInformation<GameView = any, Move = any, MoveView = any, PlayerId = any>(rules: Object): rules is SecretInformation<GameView, Move, MoveView, PlayerId> {
  const test = rules as SecretInformation<GameView, Move, MoveView, PlayerId>
  return typeof test.getPlayerView === 'function'
}

