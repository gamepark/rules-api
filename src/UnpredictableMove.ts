import { Rules } from './Rules'

export interface UnpredictableMoves<M = any, P = any> {
  isUnpredictableMove(move: M, player: P): boolean

  canIgnoreServerDifference?(clientMove: M, serverMove: M): boolean
}

export const hasUnpredictableMoves = <G = any, M = any, P = any>(
  rules: Rules<G, M, P>
): rules is Rules<G, M, P> & UnpredictableMoves<M> => typeof rules.isUnpredictableMove === 'function'
