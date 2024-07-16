/**
 * Some game hide information from the players, for example when a deck is shuffled and face-down on the table.
 * In that case, to prevent any cheating, it is mandatory that Game Park server does not expose this information to the players or spectators.
 * Implement this interface with you Rules class to enforce this security.
 * If the game does not hide the same information to every player, you need to implement {@link SecretInformation} instead
 */
export interface HiddenInformation<GameView = any, Move = any, MoveView = any> {
  /**
   * @returns the state of the game without the information that is hidden to the players
   */
  getView(): GameView

  /**
   * When a move is played, sometime some information inside it must be hidden to the players,
   * and sometimes the move will reveal information to the player that was previously unavailable
   * Implement this function to remove or add any such information from the given move
   *
   * @param move the Move to transform before sending it to the players
   * @returns the state of the game without the information that is hidden to the players
   */
  getMoveView(move: Move): MoveView
}

/**
 * Type guard for games with hidden information
 * @param rules Rules of the game
 * @returns true if the game implements {@link HiddenInformation}
 */
export function hasHiddenInformation<GameView = any, Move = any, MoveView = any>(rules: Object): rules is HiddenInformation<GameView, Move, MoveView> {
  const test = rules as HiddenInformation<GameView, Move, MoveView>
  return typeof test.getView === 'function' && typeof test.getMoveView === 'function'
}
