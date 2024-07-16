/**
 * An action is a move played by a player, with the consequences that resulted from it.
 * @property id Unique identifier for the action (see {@link Undo})
 * @property playerId Identifier of the player which played the move at the origin of the action
 * @property move Move at the origin of the action
 * @property consequences All the move that automatically happened after the move was played
 */
export type Action<Move = any, PlayerId = any> = {
  id?: string
  playerId: PlayerId
  move: Move
  consequences: Move[]
}
