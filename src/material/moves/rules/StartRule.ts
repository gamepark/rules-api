import { RuleMoveCommon, RuleMoveType } from './RuleMove'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'

export type StartRule<RuleId extends number = number> = RuleMoveCommon & {
  type: typeof RuleMoveType.StartRule
  id: RuleId
}

export function isStartRule<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is StartRule<P> {
  return move.kind === MoveKind.RulesMove && move.type === RuleMoveType.StartRule
}
