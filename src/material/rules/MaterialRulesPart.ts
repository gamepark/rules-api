import { PlayMoveContext, Rules } from '../../Rules'
import { Material } from '../items'
import { MaterialGame } from '../MaterialGame'
import { GameMemory, PlayerMemory } from '../memory'
import { CustomMove, ItemMove, MaterialMove, MaterialMoveBuilder, RuleMove } from '../moves'
import { RuleStep } from './RuleStep'

/**
 * When you implement the rules of a game using {@link MaterialRules}, the rules are split into small parts.
 * This is the base class to implement one part of the rules.
 * The constructor cannot be changed as the class is instantiated by {@link MaterialRules}.
 */
export abstract class MaterialRulesPart<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  extends Rules<MaterialGame<Player, MaterialType, LocationType>, MaterialMove<Player, MaterialType, LocationType>, Player> {

  /**
   * Helper function to get a {@link Material} instance to work on some item type in the game.
   * @param type Type of material
   * @returns {Material} the material instance
   */
  material(type: MaterialType): Material<Player, MaterialType, LocationType> {
    return new Material(type, Array.from((this.game.items[type] ?? []).entries()).filter(entry => entry[1].quantity !== 0))
  }

  /**
   * This function is called immediately before an {@link ItemMove} is played.
   * @param _move The move which is going to be played
   * @param _context Context of execution
   * @returns {MaterialMove[]} Any consequences that should automatically be played after the move
   */
  beforeItemMove(_move: ItemMove<Player, MaterialType, LocationType>, _context?: PlayMoveContext): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  /**
   * This function is called immediately after an {@link ItemMove} is played.
   * @param _move The move which has just been played
   * @param _context Context of execution
   * @returns {MaterialMove[]} Any consequences that should automatically be played after the move
   */
  afterItemMove(_move: ItemMove<Player, MaterialType, LocationType>, _context?: PlayMoveContext): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  /**
   * This function is called immediately after the {@link RuleMove} that started this rules step was played
   * @param _move The move which has just been played
   * @param _previousRule The step of the rules immediately before this one started
   * @param _context Context of execution
   * @returns {MaterialMove[]} Any consequences that should automatically be played after the move
   */
  onRuleStart<RuleId extends number>(_move: RuleMove<Player, RuleId>, _previousRule?: RuleStep, _context?: PlayMoveContext): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  /**
   * This function is called just before a {@link RuleMove} that leave this rules step is played.
   *
   * BEWARE: any consequences returned here will happen inside the next rule step. Usually we only clean the memory here.
   *
   * @param _move The move which is going to be played
   * @param _context Context of execution
   * @returns {MaterialMove[]} Any consequences that should automatically be played after the move
   */
  onRuleEnd<RuleId extends number>(_move: RuleMove<Player, RuleId>, _context?: PlayMoveContext): MaterialMove<Player, MaterialType, LocationType>[] {
    return []
  }

  /**
   * This function is called when a {@link CustomMove} is played.
   * @param _move The move
   * @param _context Context of execution
   * @returns {MaterialMove[]} Any consequences that should automatically be played after the move
   */
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

  /**
   * Utility function to access the memory tool for the game or on player.
   * this.game.memory can be used to store any data that is not available through the state of the material, or current rule.
   *
   * @param player Optional, identifier of the player if we want to manipulate a specific player's memory
   * @returns {@link GameMemory} or {@link PlayerMemory} utility
   * @protected
   */
  protected getMemory(player?: Player): GameMemory<Player> | PlayerMemory<Player> {
    return player === undefined ? new GameMemory(this.game) : new PlayerMemory(this.game, player)
  }

  /**
   * Save a new value inside the memory.
   * @param key The key to index the memorized value.
   * @param value Any JSON serializable value to store, or a function that takes previous stored value and returns the new value to store.
   * @param player optional, if we need to memorize a different value for each player.
   */
  memorize<T = any>(key: keyof any, value: T | ((lastValue: T) => T), player?: Player): void {
    this.getMemory(player).memorize(key, value)
  }

  /**
   * Retrieve the value memorized under a given key.
   * Shortcut for this.game.memory[key] or this.game.memory[key][player]
   *
   * @param key Key under which the memory is store. Usually a value of a numeric enum named "Memory".
   * @param player optional, if we need to memorize a different value for each player.
   */
  remind<T = any>(key: keyof any, player?: Player): T {
    return this.getMemory(player).remind(key)
  }

  /**
   * Delete a value from the memory
   * @param key Key of the value to delete
   * @param player optional, if we need to memorize a different value for each player.
   */
  forget(key: keyof any, player?: Player): void {
    this.getMemory(player).forget(key)
  }
}

/**
 * Creator interface for a class that extends {@link MaterialRulesPart} with the same constructor.
 */
export interface MaterialRulesPartCreator<Player extends number = number,
  MaterialType extends number = number,
  LocationType extends number = number> {
  new(
    game: MaterialGame<Player, MaterialType, LocationType>
  ): MaterialRulesPart<Player, MaterialType, LocationType>
}
