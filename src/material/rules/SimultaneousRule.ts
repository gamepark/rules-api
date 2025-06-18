import { PlayMoveContext } from '../../Rules'
import { EndPlayerTurn, MaterialMove, MaterialMoveBuilder } from '../moves'
import { MaterialRulesPart } from './MaterialRulesPart'

/**
 * Base class for any part of the rules where multiple players have to do something at the same time.
 */
export abstract class SimultaneousRule<Player extends number = number, MaterialType extends number = number, LocationType extends number = number, RuleId extends number = number>
  extends MaterialRulesPart<Player, MaterialType, LocationType, RuleId> {

  endPlayerTurn = MaterialMoveBuilder.endPlayerTurn

  /**
   * See {@link Rules.isTurnToPlay}
   */
  isTurnToPlay(player: Player): boolean {
    return this.game.rule?.players?.includes(player) ?? false
  }

  /**
   * @returns all the active players
   */
  get activePlayers(): Player[] {
    return this.game.rule?.players ?? []
  }

  /**
   * See {@link Rules.getLegalMoves}
   */
  getLegalMoves(player: Player): MaterialMove<Player, MaterialType, LocationType, RuleId>[] {
    return this.isTurnToPlay(player) ? this.getActivePlayerLegalMoves(player) : []
  }

  /**
   * This function is only called for players which are still active. It must return the legal move of given player.
   * @param player Player to consider
   * @return the legal moves of the player
   */
  abstract getActivePlayerLegalMoves(player: Player): MaterialMove<Player, MaterialType, LocationType, RuleId>[]

  /**
   * This function is called immediately after a {@link EndPlayerTurn} has been played.
   * @param _move The move which has just been played
   * @param _context Context of execution
   * @returns {MaterialMove[]} Any consequences that should automatically be played after the move
   */
  onPlayerTurnEnd(_move: EndPlayerTurn<Player>, _context?: PlayMoveContext): MaterialMove<Player, MaterialType, LocationType, RuleId>[] {
    return []
  }

  /**
   * Implement this to return the consequences when all the players have completed their task.
   * Usually, a new rule part should start.
   * @returns the consequences when the last awaited player have played
   */
  abstract getMovesAfterPlayersDone(): MaterialMove<Player, MaterialType, LocationType, RuleId>[]
}

/**
 * Type guard to know if a {@link MaterialRulesPart} is a {@link SimultaneousRule}
 * @param rule The rule
 * @returns true if the rule if a {@link SimultaneousRule}
 */
export function isSimultaneousRule<P extends number = number, M extends number = number, L extends number = number, R extends number = number>(
  rule?: MaterialRulesPart<P, M, L, R>
): rule is SimultaneousRule<P, M, L, R> {
  return rule !== undefined && typeof (rule as SimultaneousRule<P, M, L, R>).getMovesAfterPlayersDone === 'function'
}
