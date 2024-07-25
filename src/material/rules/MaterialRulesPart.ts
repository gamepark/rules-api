import { PlayMoveContext, Rules } from '../../Rules'
import { Material } from '../items'
import { MaterialGame } from '../MaterialGame'
import { GameMemory, PlayerMemory } from '../memory'
import { CustomMove, ItemMove, MaterialMove, RuleMove } from '../moves'
import { MaterialMoveBuilder } from './MaterialMoveBuilder'
import { RuleStep } from './RuleStep'

export abstract class MaterialRulesPart<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  extends Rules<MaterialGame<Player, MaterialType, LocationType>, MaterialMove<Player, MaterialType, LocationType>, Player> {

  constructor(game: MaterialGame<Player, MaterialType, LocationType>,
              protected readonly material: (type: MaterialType) => Material<Player, MaterialType, LocationType>
                = (type: MaterialType) => new Material(type, Array.from((this.game.items[type] ?? []).entries()).filter(entry => entry[1].quantity !== 0))) {
    super(game)
  }

  createRule(Rule: MaterialRulesPartCreator<Player, MaterialType, LocationType>, ...args: any): MaterialRulesPart<Player, MaterialType, LocationType> {
    return new Rule(this.game, this.material, ...args)
  }

  beforeItemMove(_move: ItemMove<Player, MaterialType, LocationType>, _context?: PlayMoveContext): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  afterItemMove(_move: ItemMove<Player, MaterialType, LocationType>, _context?: PlayMoveContext): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  onRuleStart<RuleId extends number>(_move: RuleMove<Player, RuleId>, _previousRule?: RuleStep, _context?: PlayMoveContext): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  onRuleEnd<RuleId extends number>(_move: RuleMove<Player, RuleId>, _context?: PlayMoveContext): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  onCustomMove(_move: CustomMove, _context?: PlayMoveContext): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  /**
   * @deprecated replace this.rules().[the function] with: this.[the function]
   */
  rules(): typeof MaterialMoveBuilder {
    return MaterialMoveBuilder
  }

  startPlayerTurn = MaterialMoveBuilder.startPlayerTurn
  startSimultaneousRule = MaterialMoveBuilder.startSimultaneousRule
  startRule = MaterialMoveBuilder.startRule
  customMove = MaterialMoveBuilder.customMove
  endGame = MaterialMoveBuilder.endGame

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
    material: (type: MaterialType) => Material<Player, MaterialType, LocationType>,
    ...args: any
  ): MaterialRulesPart<Player, MaterialType, LocationType>
}
