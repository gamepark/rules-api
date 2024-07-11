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

export abstract class MaterialRules<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  extends Rules<MaterialGame<Player, MaterialType, LocationType>, MaterialMove<Player, MaterialType, LocationType>, Player>
  implements RandomMove<MaterialMove<Player, MaterialType, LocationType>, MaterialMoveRandomized<Player, MaterialType, LocationType>>,
    Undo<MaterialMove<Player, MaterialType, LocationType>, Player> {

  material(type: MaterialType): Material<Player, MaterialType, LocationType> {
    return new Material(type, Array.from((this.game.items[type] ?? []).entries()).filter(entry => entry[1].quantity !== 0))
  }

  abstract readonly rules: Record<number, MaterialRulesPartCreator<Player, MaterialType, LocationType>>

  readonly locationsStrategies: Partial<Record<MaterialType, Partial<Record<LocationType, LocationStrategy<Player, MaterialType, LocationType>>>>> = {}

  get players(): Player[] {
    return this.game.players
  }

  protected getMemory(player?: Player) {
    return player === undefined ? new GameMemory(this.game) : new PlayerMemory(this.game, player)
  }

  remind<T = any>(key: keyof any, player?: Player): T {
    return this.getMemory(player).remind(key)
  }

  get rulesStep(): MaterialRulesPart<Player, MaterialType, LocationType> | undefined {
    if (!this.game.rule) return
    const RulesStep = this.rules[this.game.rule.id]
    if (!RulesStep) {
      console.error(`The rules class for rules id ${this.game.rule.id} is missing`)
      return
    }
    return new RulesStep(this.game, type => this.material(type))
  }

  mutator(type: MaterialType): MaterialMutator<Player, MaterialType, LocationType> {
    return new MaterialMutator(type, this.game.items[type] ?? [], this.locationsStrategies[type], this.itemsCanMerge(type))
  }

  itemsCanMerge(_type: MaterialType): boolean {
    return true
  }

  delegate(): Rules<MaterialGame<Player, MaterialType, LocationType>, MaterialMove<Player, MaterialType, LocationType>, Player> | undefined {
    return this.rulesStep
  }

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

  roll(_move: RollItem<Player, MaterialType, LocationType>) {
    return random(5)
  }

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

  canUndo(action: Action<MaterialMove<Player, MaterialType, LocationType>, Player>,
          consecutiveActions: Action<MaterialMove<Player, MaterialType, LocationType>, Player>[]): boolean {
    for (let i = consecutiveActions.length - 1; i >= 0; i--) {
      if (this.consecutiveActionBlocksUndo(action, consecutiveActions[i])) {
        return false
      }
    }
    return !this.actionBlocksUndo(action)
  }

  consecutiveActionBlocksUndo(action: Action<MaterialMove<Player, MaterialType, LocationType>, Player>,
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

  protected actionBlocksUndo(action: Action<MaterialMove<Player, MaterialType, LocationType>, Player>): boolean {
    for (let i = action.consequences.length - 1; i >= 0; i--) {
      if (this.moveBlocksUndo(action.consequences[i])) {
        return true
      }
    }
    return this.moveBlocksUndo(action.move)
  }

  protected actionActivatesPlayer(action: Action<MaterialMove<Player, MaterialType, LocationType>, Player>): boolean {
    for (let i = action.consequences.length - 1; i >= 0; i--) {
      if (this.moveActivatesPlayer(action.consequences[i])) {
        return true
      }
    }
    return this.moveActivatesPlayer(action.move)
  }

  protected moveBlocksUndo(move: MaterialMove<Player, MaterialType, LocationType>): boolean {
    return this.moveActivatesPlayer(move) || isRoll(move)
  }

  protected moveActivatesPlayer(move: MaterialMove<Player, MaterialType, LocationType>): boolean {
    return isStartPlayerTurn(move) || isStartSimultaneousRule(move)
  }

  isUnpredictableMove(move: MaterialMove<Player, MaterialType, LocationType>, _player: Player): boolean {
    return this.isRandomMove(move)
  }

  protected isRandomMove(move: MaterialMove<Player, MaterialType, LocationType>): boolean {
    return isShuffle(move) || isRoll(move)
  }

  isOver(): boolean {
    return !this.game.rule
  }
}

export interface MaterialRulesCreator<P extends number = number, M extends number = number, L extends number = number> {
  new(state: MaterialGame<P, M, L>, client?: {
    player?: P
  }): MaterialRules<P, M, L>
}
