import { RuleMoveCommon, RuleMoveType } from './RuleMove'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'

export type StartRule<RuleId extends number = number> = RuleMoveCommon & {
  type: typeof RuleMoveType.StartRule
  id: RuleId
}

export function isStartRule<P extends number, M extends number, L extends number, R extends number>(move: MaterialMove<P, M, L, R>): move is StartRule<R> {
  return move.kind === MoveKind.RulesMove && move.type === RuleMoveType.StartRule
}
