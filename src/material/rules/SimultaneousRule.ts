import { PlayMoveContext } from '../../Rules'
import { EndPlayerTurn, MaterialMove, MaterialMoveBuilder } from '../moves'
import { MaterialRulesPart } from './MaterialRulesPart'

export abstract class SimultaneousRule<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  extends MaterialRulesPart<Player, MaterialType, LocationType> {

  endPlayerTurn = MaterialMoveBuilder.endPlayerTurn

  isTurnToPlay(player: Player): boolean {
    return this.game.rule?.players?.includes(player) ?? false
  }

  getLegalMoves(player: Player): MaterialMove<Player, MaterialType, LocationType>[] {
    return this.isTurnToPlay(player) ? this.getActivePlayerLegalMoves(player) : []
  }

  abstract getActivePlayerLegalMoves(playerId: Player): MaterialMove<Player, MaterialType, LocationType>[]

  onPlayerTurnEnd(_move: EndPlayerTurn<Player>, _context?: PlayMoveContext): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  abstract getMovesAfterPlayersDone(): MaterialMove<Player, MaterialType, LocationType>[]
}

export function isSimultaneousRule<P extends number = number, M extends number = number, L extends number = number>(
  rule?: MaterialRulesPart<P, M, L>
): rule is SimultaneousRule<P, M, L> {
  return rule !== undefined && typeof (rule as SimultaneousRule<P, M, L>).getMovesAfterPlayersDone === 'function'
}
