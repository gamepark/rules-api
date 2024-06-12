import { Action } from './Action'

export interface Undo<Game, Move = string, PlayerId = number> {
  canUndo(action: Action<Move, PlayerId>, consecutiveActions: Action<Move, PlayerId>[]): boolean
  restoreLocalMoves?(localState: Game): void
}

export function hasUndo<Game, Move, PlayerId>(rules: Object): rules is Undo<Game, Move, PlayerId> {
  const test = rules as Undo<Game, Move, PlayerId>
  return typeof test.canUndo === 'function'
}