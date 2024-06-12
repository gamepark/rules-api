import { Rules } from './Rules'

export type RulesWithUnpredictableMoves<G = any, M = any, P = any> = Rules<G, M, P> & {
  isUnpredictableMove(move: M): boolean
}

export const hasUnpredictableMoves = <G = any, M = any, P = any>(
  rules: Rules<G, M, P>
): rules is RulesWithUnpredictableMoves<G, M, P> => typeof rules.isUnpredictableMove === 'function'
