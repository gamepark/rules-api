import { MaterialMove } from '../moves'
import { MaterialRulesPart } from './MaterialRulesPart'

export abstract class PlayerTurnRule<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  extends MaterialRulesPart<Player, MaterialType, LocationType> {

  get player(): Player {
    return this.game.rule!.player!
  }

  get nextPlayer(): Player {
    return this.game.players[(this.game.players.indexOf(this.player) + 1) % this.game.players.length]
  }

  getActivePlayer(): Player {
    return this.player
  }

  getLegalMoves(player: Player): MaterialMove<Player, MaterialType, LocationType>[] {
    if (player !== this.getActivePlayer()) return []
    return this.getPlayerMoves()
  }

  getPlayerMoves(): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }
}
