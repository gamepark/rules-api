import { RuleMoveCommon, RuleMoveType } from './RuleMove'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'

export type StartSimultaneousRule<Player extends number = number, RuleId extends number = number> = RuleMoveCommon & {
  type: typeof RuleMoveType.StartSimultaneousRule
  id: RuleId
  players?: Player[]
}

export function isStartSimultaneousRule<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is StartSimultaneousRule<P> {
  return move.kind === MoveKind.RulesMove && move.type === RuleMoveType.StartSimultaneousRule
}
