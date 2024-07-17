/**
 * This interface allows to keep a move played only on the player's side.
 * It is convenient to allow the player to "preview" the results of their action before validating it.
 */
export interface LocalMovePreview<Move = any> {
  /**
   * Function called on client side after a move is played, before it is sent to the server
   * @param move The move that was played
   * @return true if the move must not be sent to the server
   */
  previewMove(move: Move): boolean
}

/**
 * Type guard for {@link LocalMovePreview} interface
 * @param rules The game's rules
 * @return true if the rules implements {@link LocalMovePreview}
 */
export function hasLocalMovePreview<Move = any>(rules: Object): rules is LocalMovePreview<Move> {
  return typeof (rules as LocalMovePreview<Move>).previewMove === 'function'
}
