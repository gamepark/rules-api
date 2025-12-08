import { SecretInformation } from '../SecretInformation'
import { HiddenMaterialRules } from './HiddenMaterialRules'
import type { HidingSecretsStrategy } from './HidingStrategies'
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
