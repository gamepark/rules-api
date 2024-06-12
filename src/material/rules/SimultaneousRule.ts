import { MaterialMove } from '../moves'
import { MaterialRulesPart } from './MaterialRulesPart'

export abstract class SimultaneousRule<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  extends MaterialRulesPart<Player, MaterialType, LocationType> {

  isTurnToPlay(player: Player): boolean {
    return this.game.rule?.players?.includes(player) ?? false
  }

  getLegalMoves(player: Player): MaterialMove<Player, MaterialType, LocationType>[] {
    return this.isTurnToPlay(player) ? this.getActivePlayerLegalMoves(player) : []
  }

  abstract getActivePlayerLegalMoves(playerId: Player): MaterialMove<Player, MaterialType, LocationType>[]

  getAutomaticMoves(): MaterialMove<Player, MaterialType, LocationType>[] {
    if (!this.game.rule?.players?.length) {
      return this.getMovesAfterPlayersDone()
    }
    return []
  }

  abstract getMovesAfterPlayersDone(): MaterialMove<Player, MaterialType, LocationType>[]
}
