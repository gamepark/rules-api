import { MoveKind } from '../MoveKind'
import { StartRule } from './StartRule'
import { StartPlayerTurn } from './StartPlayerTurn'
import { EndGame } from './EndGame'
import { StartSimultaneousRule } from './StartSimultaneousRule'
import { EndPlayerTurn } from './EndPlayerTurn'

export type RuleMove<Player extends number = number, RuleId extends number = number>
  = StartPlayerTurn<Player, RuleId>
  | StartSimultaneousRule<Player, RuleId>
  | StartRule<RuleId>
  | EndGame
  | EndPlayerTurn<Player>

export enum RuleMoveType {
  StartPlayerTurn, StartSimultaneousRule, EndPlayerTurn, StartRule, EndGame
}

export type RuleMoveCommon = {
  kind: typeof MoveKind.RulesMove
}

export const isRuleChange = <P extends number = number, R extends number = number>(move: RuleMove<P, R>): boolean => {
  switch (move.type) {
    default:
      return true
  }
}
