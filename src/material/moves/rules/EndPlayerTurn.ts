import { RuleMoveCommon, RuleMoveType } from './RuleMove'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'

export type EndPlayerTurn<Player extends number = number> = RuleMoveCommon & {
  type: typeof RuleMoveType.EndPlayerTurn
  player: Player
}

export function isEndPlayerTurn<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is EndPlayerTurn<P> {
  return move.kind === MoveKind.RulesMove && move.type === RuleMoveType.EndPlayerTurn
}
