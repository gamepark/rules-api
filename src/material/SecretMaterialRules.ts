import { SecretInformation } from '../SecretInformation'
import { HiddenMaterialRules, HidingStrategy } from './HiddenMaterialRules'
import { MaterialItem } from './items'
import { MaterialGame } from './MaterialGame'
import { MaterialMove, MaterialMoveRandomized } from './moves'

/**
 * Implement SecretMaterialRules when you want to use the {@link MaterialRules} approach with {@link SecretInformation}.
 * Using some {@link HidingSecretsStrategy} allows to enforce the security of a game with secret information easily.
 * If the game has only hidden information (all players have the same information), then you must implement {@link HiddenMaterialRules} instead.
 */
export abstract class SecretMaterialRules<Player extends number = number, MaterialType extends number = number, LocationType extends number = number, RuleId extends number = number>
  extends HiddenMaterialRules<Player, MaterialType, LocationType, RuleId>
  implements SecretInformation<MaterialGame<Player, MaterialType, LocationType, RuleId>, MaterialMove<Player, MaterialType, LocationType, RuleId>, MaterialMove<Player, MaterialType, LocationType, RuleId>, Player> {

  /**
   * Link {@link HiddenMaterialRules.hidingStrategies}, but with knowledge of whom the item should be hidden from.
   * See {@link HidingSecretsStrategy}
   */
  abstract hidingStrategies: Partial<Record<MaterialType, Partial<Record<LocationType, HidingSecretsStrategy<Player, LocationType>>>>>

  /**
   * With the material approach, we can offer a default working implementation for {@link SecretInformation.getPlayerView}
   */
  getPlayerView(player: Player): MaterialGame<Player, MaterialType, LocationType, RuleId> {
    return this.getView(player)
  }

  /**
   * With the material approach, we can offer a default working implementation for {@link SecretInformation.getPlayerMoveView}
   */
  getPlayerMoveView(move: MaterialMoveRandomized<Player, MaterialType, LocationType, RuleId>, player: Player): MaterialMove<Player, MaterialType, LocationType, RuleId> {
    return this.getMoveView(move, player)
  }
}

/**
 * A Hiding Strategy is a function that takes an item and a player and returns a list of path to hide in the item object.
 * If the player parameter is undefined, the function must return the information to hide from the spectators.
 * See {@link hideItemIdToOthers} and {@link hideFrontToOthers} for 2 HidingSecretsStrategy frequently used.
 */
export type HidingSecretsStrategy<P extends number = number, L extends number = number> = (item: MaterialItem<P, L>, player?: P) => string[]

/**
 * Hide the item id to all players except the player that is equal to item.location.player.
 * Used to hide cards in a player's hand from others for instance.
 * @param item The item to hide information from
 * @param player The player to hide information to (or the spectator)
 */
export const hideItemIdToOthers = <P extends number = number, L extends number = number>(
  item: MaterialItem<P, L>, player?: P
): string[] => item.location.player === player ? [] : ['id']

/**
 * Hide the item.id.front to all players except the player that is equal to item.location.player.
 * @param item The item to hide information from
 * @param player The player to hide information to (or the spectator)
 */
export const hideFrontToOthers: HidingStrategy = <P extends number = number, L extends number = number>(
  item: MaterialItem<P, L>, player?: P
): string[] => item.location.player === player ? [] : ['id.front']