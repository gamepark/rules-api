import { Action } from './Action'

export interface Undo<Move = string, PlayerId = number> {
  canUndo(action: Action<Move, PlayerId>, consecutiveActions: Action<Move, PlayerId>[]): boolean
}

export function hasUndo<Move, PlayerId>(rules: Object): rules is Undo<Move, PlayerId> {
  const test = rules as Undo<Move, PlayerId>
  return typeof test.canUndo === 'function'
}