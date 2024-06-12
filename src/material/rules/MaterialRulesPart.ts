import { Rules } from '../../Rules'
import { Material } from '../items'
import { MaterialGame } from '../MaterialGame'
import { GameMemory, PlayerMemory } from '../memory'
import { CustomMove, ItemMove, MaterialMove, RuleMove } from '../moves'
import { MaterialRulesMovesBuilder } from './MaterialRulesMovesBuilder'
import { RuleStep } from './RuleStep'

export abstract class MaterialRulesPart<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  extends Rules<MaterialGame<Player, MaterialType, LocationType>, MaterialMove<Player, MaterialType, LocationType>, Player> {

  material(type: MaterialType): Material<Player, MaterialType, LocationType> {
    return new Material(type, Array.from((this.game.items[type] ?? []).entries()).filter(entry => entry[1].quantity !== 0))
  }

  beforeItemMove(_move: ItemMove<Player, MaterialType, LocationType>): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  afterItemMove(_move: ItemMove<Player, MaterialType, LocationType>): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  onRuleStart<RuleId extends number>(_move: RuleMove<Player, RuleId>, _previousRule?: RuleStep): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  onRuleEnd<RuleId extends number>(_move: RuleMove<Player, RuleId>): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  onCustomMove(_move: CustomMove): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  rules(): MaterialRulesMovesBuilder<Player, MaterialType, LocationType> {
    return new MaterialRulesMovesBuilder<Player, MaterialType, LocationType>(this.game)
  }

  protected getMemory(player?: Player) {
    return player === undefined ? new GameMemory(this.game) : new PlayerMemory(this.game, player)
  }

  memorize<T = any>(key: keyof any, value: T | ((lastValue: T) => T), player?: Player): void {
    this.getMemory(player).memorize(key, value)
  }

  remind<T = any>(key: keyof any, player?: Player): T {
    return this.getMemory(player).remind(key)
  }

  forget(key: keyof any, player?: Player): void {
    this.getMemory(player).forget(key)
  }
}

export interface MaterialRulesPartCreator<Player extends number = number,
  MaterialType extends number = number,
  LocationType extends number = number> {
  new(
    game: MaterialGame<Player, MaterialType, LocationType>,
    material: (type: MaterialType) => Material<Player, MaterialType, LocationType>
  ): MaterialRulesPart<Player, MaterialType, LocationType>
}
