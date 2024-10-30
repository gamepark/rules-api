import { Action } from './Action'

/**
 * The undo feature allow a player to undo some move played during the game.
 * The move undone is removed from the game history: the new game state results from applying all the remaining moves from the game setup.
 * Any direct consequences of the move (see {@link Action.consequences}) are also removed.
 */
export interface Undo<Game, Move = string, PlayerId = number> {
  /**
   * This function allow an action to be undone, by the player that did it.
   *
   * @param action The {@link Action} to allow or not to undo.
   * @param consecutiveActions All the actions that has been played meanwhile by the players
   * @returns true if the action can be undone
   */
  canUndo(action: Action<Move, PlayerId>, consecutiveActions: Action<Move, PlayerId>[]): boolean

  /**
   * When a move is undone, the game state is recalculated by playing all the moves from the beginning.
   * Sometimes some changes are not in the move history: local rotations, opening popups, etc.
   * This function allow to keep those changes after the game state has been recalculated.
   * @param previousState State before the undo is applied
   */
  restoreTransientState?(previousState: Game): void
}

/**
 * Type guard to know if a game implements the Undo feature.
 *
 * @param rules Rules of the game
 * @returns true if rules implements {@link Undo}
 */
export function hasUndo<Game, Move, PlayerId>(rules: Object): rules is Undo<Game, Move, PlayerId> {
  const test = rules as Undo<Game, Move, PlayerId>
  return typeof test.canUndo === 'function'
}