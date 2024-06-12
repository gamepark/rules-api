import { RuleMoveCommon, RuleMoveType } from './RuleMove'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'

export type StartPlayerTurn<Player extends number = number, RuleId extends number = number> = RuleMoveCommon & {
  type: typeof RuleMoveType.StartPlayerTurn
  id: RuleId
  player?: Player
}

export function isStartPlayerTurn<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is StartPlayerTurn<P> {
  return move.kind === MoveKind.RulesMove && move.type === RuleMoveType.StartPlayerTurn
}
