import random from 'lodash/random'
import shuffle from 'lodash/shuffle'
import { Action } from '../Action'
import { RandomMove } from '../RandomMove'
import { PlayMoveContext, Rules } from '../Rules'
import { Undo } from '../Undo'
import { Material, MaterialMutator } from './items'
import { LocationStrategy } from './location'
import { MaterialGame } from './MaterialGame'
import { GameMemory, PlayerMemory } from './memory'
import {
  isDeleteItem,
  isMoveItem,
  isRoll,
  isSelectItem,
  isShuffle,
  isStartPlayerTurn,
  isStartSimultaneousRule,
  LocalMoveType,
  MaterialMove,
  MaterialMoveRandomized,
  MaterialMoveView,
  MoveKind,
  RollItem,
  RuleMove,
  RuleMoveType
} from './moves'
import { MaterialRulesPart, MaterialRulesPartCreator } from './rules'

/**
 * The MaterialRules class is the main class to implement the rules of a board game with the "Material oriented" approach.
 * With this approach, the game state and the game moves is structured around the game material items and their movements.
 * The rules are also automatically split into small parts.
 * Finally, a "memory" util is available to store temporary information which is not part of the material or the rules state.
 * If you need to implement game with hidden information, see {@link HiddenMaterialRules} or {@link SecretMaterialRules}.
 *
 * @typeparam Player - identifier of a player. Either a number or a numeric enum (eg: PlayerColor)
 * @typeparam MaterialType - Numeric enum of the types of material manipulated in the game
 * @typeparam LocationType - Numeric enum of the types of location in the game when the material can be located
 */
export abstract class MaterialRules<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  extends Rules<MaterialGame<Player, MaterialType, LocationType>, MaterialMove<Player, MaterialType, LocationType>, Player>
  implements RandomMove<MaterialMove<Player, MaterialType, LocationType>, MaterialMoveRandomized<Player, MaterialType, LocationType>>,
    Undo<MaterialMove<Player, MaterialType, LocationType>, Player> {

  /**
   * When you implement a game using the "material" approach, you are also strongly advised to split the rules of the game into many small parts.
   * You should usually create a numeric enum class "RuleId" that will list all those small parts.
   * This "rules" property must be implemented to map each "rule id" with the corresponding MaterialRulesPart class.
   * This way, the behavior of the rules can be delegated to the corresponding rule part at each step of the game.
   */
  abstract readonly rules: Record<number, MaterialRulesPartCreator<Player, MaterialType, LocationType>>

  /**
   * The "location strategies" are global rules that always apply in a game when we want to maintain a consistency in the position of the material.
   * For example, we usually want the cards in a player hand to always go from x=0 to x=n without a gap, so we use a {@link PositiveSequenceStrategy} to enforce
   * the rule once and for all. If we want to create a "river" of card we can use a {@link FillGapStrategy}.
   * Games with more complex use cases can implement their own {@link LocationStrategy}.
   */
  readonly locationsStrategies: Partial<Record<MaterialType, Partial<Record<LocationType, LocationStrategy<Player, MaterialType, LocationType>>>>> = {}

  /**
   *
   *
   * @param type The type of Material we want to work on
   * @returns a Material instance to manipulate all the material of that type in current game state.
   */
  material(type: MaterialType): Material<Player, MaterialType, LocationType> {
    return new Material(type, Array.from((this.game.items[type] ?? []).entries()).filter(entry => entry[1].quantity !== 0))
  }

  /**
   * Shortcut for this.game.players
   * @returns array of the players identifiers
   */
  get players(): Player[] {
    return this.game.players
  }

  /**
   * Utility function to access the memory tool for the game or on player.
   * this.game.memory can be used to store any data that is not available through the state of the material, or current rule.
   *
   * @param player Optional, identifier of the player if we want to manipulate a specific player's memory
   * @returns {@link GameMemory} or {@link PlayerMemory} utility
   * @protected
   */
  protected getMemory(player?: Player): GameMemory<Player> | PlayerMemory<Player> {
    return player === undefined ? new GameMemory<Player>(this.game) : new PlayerMemory<Player>(this.game, player)
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
   * Instantiates the class that handled the rules of the game corresponding to the current rule id.
   * This function reads the current value in this.game.rule.id and instantiate the corresponding class in the {@link rules} property.
   *
   * @returns the class that handled the rules of the game, at current specific game state.
   */
  get rulesStep(): MaterialRulesPart<Player, MaterialType, LocationType> | undefined {
    if (!this.game.rule) return
    const RulesStep = this.rules[this.game.rule.id]
    if (!RulesStep) {
      console.error(`The rules class for rules id ${this.game.rule.id} is missing`)
      return
    }
    return new RulesStep(this.game, type => this.material(type))
  }

  /**
   * Returns a utility class to change the state of the items.
   * Used by the framework to apply the Material moves on the items (should not be manipulated directly in the games).
   *
   * @param type MaterialType of the item we want to modify
   * @returns a MaterialMutator to change the state of the items
   */
  mutator(type: MaterialType): MaterialMutator<Player, MaterialType, LocationType> {
    return new MaterialMutator(type, this.game.items[type] ?? [], this.locationsStrategies[type], this.itemsCanMerge(type))
  }

  /**
   * Items can sometime be stored with a quantity (for example, coins).
   * By default, if you create or move similar items to the exact same location, they will merge into one item with a quantity.
   * However, if you have 2 cards that can be at the same spot for a short time (swapping or replacing), you can override this function to prevent them to merge
   *
   * @param _type type of items
   * @returns true if items can merge into one item with a quantity (default behavior)
   */
  itemsCanMerge(_type: MaterialType): boolean {
    return true
  }

  /**
   * In the material approach, the rules behavior is delegated to the current {@link rulesStep}. See {@link Rules.delegate}
   */
  delegate(): Rules<MaterialGame<Player, MaterialType, LocationType>, MaterialMove<Player, MaterialType, LocationType>, Player> | undefined {
    return this.rulesStep
  }

  /**
   * Randomize Shuffle of Roll moves (see {@link RandomMove.randomize})
   * @param move The Material Move to randomize
   * @returns the randomized move
   */
  randomize(
    move: MaterialMove<Player, MaterialType, LocationType>
  ): MaterialMove<Player, MaterialType, LocationType> & MaterialMoveRandomized<Player, MaterialType, LocationType> {
    if (isShuffle(move)) {
      return { ...move, newIndexes: shuffle(move.indexes) }
    } else if (isRoll(move)) {
      return { ...move, location: { ...move.location, rotation: this.roll(move) } }
    }
    return move
  }

  /**
   * When a RollItem move is create, it has to be randomized on the server side before it is saved and shared.
   * This function provides the random value. By default, it returns a value between 0 and 5 assuming a 6 sided dice is rolled.
   * If you need to flip a coin or roll non-cubic dice, you need to override this function.
   *
   * @param _move The RollItem move to randomize
   * @returns a random rolled value, by default a value between 0 and 5 (cubic dice result)
   */
  roll(_move: RollItem<Player, MaterialType, LocationType>) {
    return random(5)
  }

  /**
   * Execution of the Material Moves. See {@link Rules.play}.
   *
   * @param move Material move to play on the game state
   * @param context Context in which the move was played
   * @returns Consequences of the move
   */
  play(
    move: MaterialMoveRandomized<Player, MaterialType, LocationType> | MaterialMoveView<Player, MaterialType, LocationType>, context?: PlayMoveContext
  ): MaterialMove<Player, MaterialType, LocationType>[] {

    const consequences: MaterialMove<Player, MaterialType, LocationType>[] = []
    const rulesStep = this.rulesStep
    switch (move.kind) {
      case MoveKind.ItemMove:
        if (rulesStep) {
          consequences.push(...rulesStep.beforeItemMove(move, context))
        }
        if (!this.game.items[move.itemType]) this.game.items[move.itemType] = []
        const mutator = this.mutator(move.itemType)
        mutator.applyMove(move)
        if (this.game.droppedItem && (isMoveItem(move) || isDeleteItem(move))
          && this.game.droppedItem.type === move.itemType && move.itemIndex === this.game.droppedItem.index) {
          delete this.game.droppedItem
        }
        if (rulesStep) {
          consequences.push(...rulesStep.afterItemMove(move, context))
        }
        break
      case MoveKind.RulesMove:
        if (move.type === RuleMoveType.EndPlayerTurn) {
          if (this.game.rule?.players) {
            this.game.rule.players = this.game.rule.players.filter(player => player !== move.player)
          }
        } else {
          consequences.push(...this.changeRule(move, context))
        }
        break
      case MoveKind.CustomMove:
        if (rulesStep) {
          consequences.push(...rulesStep.onCustomMove(move, context))
        }
        break
      case MoveKind.LocalMove:
        switch (move.type) {
          case LocalMoveType.DisplayHelp:
            this.game.helpDisplay = move.helpDisplay
            break
          case LocalMoveType.DropItem:
            this.game.droppedItem = move.item
            break
          case LocalMoveType.SetTutorialStep:
            this.game.tutorialStep = move.step
            delete this.game.tutorialPopupClosed
            delete this.game.tutorialStepComplete
            break
          case LocalMoveType.CloseTutorialPopup:
            this.game.tutorialPopupClosed = true
        }
    }

    return consequences
  }

  private changeRule(move: RuleMove<Player>, context?: PlayMoveContext): MaterialMove<Player, MaterialType, LocationType>[] {
    const moves = this.rulesStep?.onRuleEnd(move, context) ?? []
    const rule = this.game.rule
    switch (move.type) {
      case RuleMoveType.StartPlayerTurn:
        this.game.rule = { id: move.id, player: move.player }
        break
      case RuleMoveType.StartSimultaneousRule:
        this.game.rule = { id: move.id, players: move.players ?? this.game.players }
        break
      case RuleMoveType.StartRule:
        this.game.rule = { id: move.id, player: this.game.rule?.player }
        break
      case RuleMoveType.EndGame:
        delete this.game.rule
        break
    }
    return moves.concat(this.rulesStep?.onRuleStart(move, rule, context) ?? [])
  }

  /**
   * By default, a Material Move can be undone if no player became active and no dice was rolled.
   * See {@link Undo.canUndo} and {@link HiddenMaterialRules.canUndo}
   *
   * @param action Action to consider
   * @param consecutiveActions Action played in between
   * @returns true if the action can be undone by the player that played it
   */
  canUndo(action: Action<MaterialMove<Player, MaterialType, LocationType>, Player>,
          consecutiveActions: Action<MaterialMove<Player, MaterialType, LocationType>, Player>[]): boolean {
    for (let i = consecutiveActions.length - 1; i >= 0; i--) {
      if (this.consecutiveActionBlocksUndo(action, consecutiveActions[i])) {
        return false
      }
    }
    return !this.actionBlocksUndo(action)
  }

  private consecutiveActionBlocksUndo(action: Action<MaterialMove<Player, MaterialType, LocationType>, Player>,
                              consecutiveAction: Action<MaterialMove<Player, MaterialType, LocationType>, Player>): boolean {
    if (this.actionActivatesPlayer(consecutiveAction)) {
      return true
    }
    if (consecutiveAction.playerId === action.playerId) {
      if (!isSelectItem(consecutiveAction.move) || !isSelectItem(action.move)) {
        return true
      }
    }
    return false
  }

  private actionBlocksUndo(action: Action<MaterialMove<Player, MaterialType, LocationType>, Player>): boolean {
    for (let i = action.consequences.length - 1; i >= 0; i--) {
      if (this.moveBlocksUndo(action.consequences[i])) {
        return true
      }
    }
    return this.moveBlocksUndo(action.move)
  }

  private actionActivatesPlayer(action: Action<MaterialMove<Player, MaterialType, LocationType>, Player>): boolean {
    for (let i = action.consequences.length - 1; i >= 0; i--) {
      if (this.moveActivatesPlayer(action.consequences[i])) {
        return true
      }
    }
    return this.moveActivatesPlayer(action.move)
  }

  /**
   * @protected
   * If a moves blocks the undo, any action with this move cannot be undone.
   * By default, a move block the undo if it activates a player or exposes new information (roll result, hidden information revealed...)
   *
   * @param move The move to consider
   * @returns true if the move blocks the undo
   */
  protected moveBlocksUndo(move: MaterialMove<Player, MaterialType, LocationType>): boolean {
    return this.moveActivatesPlayer(move) || isRoll(move)
  }

  private moveActivatesPlayer(move: MaterialMove<Player, MaterialType, LocationType>): boolean {
    return isStartPlayerTurn(move) || isStartSimultaneousRule(move)
  }

  /**
   * Random moves, or moves that reveals something to me, are unpredictable.
   * Unpredictable moves cannot be precomputed on client side, the server side's response is necessary.
   * See {@link Rules.isUnpredictableMove}
   *
   * @param move Material move to consider
   * @param _player The player playing the move
   * @returns true if the move outcome cannot be predicted on client side
   */
  isUnpredictableMove(move: MaterialMove<Player, MaterialType, LocationType>, _player: Player): boolean {
    return this.isRandomMove(move)
  }

  private isRandomMove(move: MaterialMove<Player, MaterialType, LocationType>): boolean {
    return isShuffle(move) || isRoll(move)
  }

  /**
   * A Material Game is over when there is no rule left to execute. This state results of a {@link EndGame} move.
   *
   * @returns true if game is over
   */
  isOver(): boolean {
    return !this.game.rule
  }
}

/**
 * Signature interface of the constructor of a class that implements MaterialRules
 */
export interface MaterialRulesCreator<P extends number = number, M extends number = number, L extends number = number> {
  new(state: MaterialGame<P, M, L>, client?: {
    player?: P
  }): MaterialRules<P, M, L>
}
