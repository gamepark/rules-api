import { RuleMoveCommon, RuleMoveType } from './RuleMove'
import { MaterialMove } from '../MaterialMove'
import { MoveKind } from '../MoveKind'

export type EndGame = RuleMoveCommon & {
  type: typeof RuleMoveType.EndGame
}

export function isEndGame<P extends number, M extends number, L extends number>(move: MaterialMove<P, M, L>): move is EndGame {
  return move.kind === MoveKind.RulesMove && move.type === RuleMoveType.EndGame
}
