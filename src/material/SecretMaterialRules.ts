import { SecretInformation } from '../SecretInformation'
import { HiddenMaterialRules, HidingStrategy } from './HiddenMaterialRules'
import { MaterialItem } from './items'
import { MaterialGame } from './MaterialGame'
import { MaterialMove, MaterialMoveRandomized } from './moves'

export abstract class SecretMaterialRules<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  extends HiddenMaterialRules<Player, MaterialType, LocationType>
  implements SecretInformation<MaterialGame, MaterialMove<Player, MaterialType, LocationType>, MaterialMove<Player, MaterialType, LocationType>, Player> {

  abstract hidingStrategies: Partial<Record<MaterialType, Partial<Record<LocationType, HidingSecretsStrategy<Player, LocationType>>>>>

  getPlayerView(player: Player): MaterialGame<Player, MaterialType, LocationType> {
    return this.getView(player)
  }

  getPlayerMoveView(move: MaterialMoveRandomized<Player, MaterialType, LocationType>, player: Player): MaterialMove<Player, MaterialType, LocationType> {
    return this.getMoveView(move, player)
  }
}

export type HidingSecretsStrategy<P extends number = number, L extends number = number> = (item: MaterialItem<P, L>, player?: P) => string[]

export const hideItemIdToOthers = <P extends number = number, L extends number = number>(
  item: MaterialItem<P, L>, player?: P
): string[] => item.location.player === player ? [] : ['id']

export const hideFrontToOthers: HidingStrategy = <P extends number = number, L extends number = number>(
  item: MaterialItem<P, L>, player?: P
): string[] => item.location.player === player ? [] : ['id.front']