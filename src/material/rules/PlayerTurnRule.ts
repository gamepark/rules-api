import { MaterialMove } from '../moves'
import { MaterialRulesPart } from './MaterialRulesPart'

/**
 * Base class for any part of the rules where only one player has to do something.
 */
export abstract class PlayerTurnRule<Player extends number = number, MaterialType extends number = number, LocationType extends number = number, RuleId extends number = number>
  extends MaterialRulesPart<Player, MaterialType, LocationType, RuleId> {

  /**
   * Shortcut to get the awaited player (this.game.rule.player)
   */
  get player(): Player {
    return this.game.rule!.player!
  }

  /**
   * Utility function to get the id of the next player in the table order
   */
  get nextPlayer(): Player {
    return this.game.players[(this.game.players.indexOf(this.player) + 1) % this.game.players.length]
  }

  /**
   * See {@link Rules.getActivePlayer}
   */
  getActivePlayer(): Player {
    return this.player
  }

  /**
   * See {@link Rules.getLegalMoves}
   */
  getLegalMoves(player: Player): MaterialMove<Player, MaterialType, LocationType, RuleId>[] {
    if (player !== this.getActivePlayer()) return []
    return this.getPlayerMoves()
  }

  /**
   * Implement this to expose all the legal moves of the active player.
   * @returns All the {@link MaterialMove} that current active player can play
   */
  getPlayerMoves(): MaterialMove<Player, MaterialType, LocationType, RuleId>[] {
    return []
  }
}
