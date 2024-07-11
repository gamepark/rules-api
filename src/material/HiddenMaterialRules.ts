import difference from 'lodash/difference'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import mapValues from 'lodash/mapValues'
import set from 'lodash/set'
import unset from 'lodash/unset'
import { IncompleteInformation } from '../IncompleteInformation'
import { PlayMoveContext } from '../Rules'
import { MaterialItem } from './items'
import { MaterialGame } from './MaterialGame'
import { MaterialRules } from './MaterialRules'
import {
  isCreateItem,
  isCreateItemsAtOnce,
  isMoveItem,
  isMoveItemsAtOnce,
  isShuffle,
  ItemMoveType,
  MaterialMove,
  MaterialMoveRandomized,
  MaterialMoveView,
  MoveItem,
  MoveItemsAtOnce,
  MoveKind,
  Shuffle,
  ShuffleRandomized
} from './moves'
import { HidingSecretsStrategy } from './SecretMaterialRules'

export abstract class HiddenMaterialRules<P extends number = number, M extends number = number, L extends number = number>
  extends MaterialRules<P, M, L>
  implements IncompleteInformation<MaterialGame<P, M, L>, MaterialMove<P, M, L>, MaterialMove<P, M, L>> {

  constructor(game: MaterialGame<P, M, L>, private readonly client?: { player?: P }) {
    super(game)
  }

  abstract readonly hidingStrategies: Partial<Record<M, Partial<Record<L, HidingStrategy<P, L>>>>>

  getLegalMoves(playerId: P): MaterialMove<P, M, L>[] {
    return this.transformMoves(super.getLegalMoves(playerId))
  }

  getAutomaticMoves(): MaterialMove<P, M, L>[] {
    return this.transformMoves(super.getAutomaticMoves())
  }

  private transformMoves(moves: MaterialMove<P, M, L>[]): MaterialMove<P, M, L>[] {
    for (const move of moves) {
      if (move && this.isRevealingItemMove(move)) {
        move.reveal = {}
      }
    }
    return moves
  }

  private isRevealingItemMove(move: MaterialMove<P, M, L>): move is MoveItem<P, M, L> | MoveItemsAtOnce<P, M, L> {
    return (isMoveItem(move) && this.game.players.some(player => this.moveItemWillRevealSomething(move, player))) ||
      (isMoveItemsAtOnce(move) && this.game.players.some(player => this.moveAtOnceWillRevealSomething(move, player)))
  }

  itemsCanMerge(type: M): boolean {
    return !this.hidingStrategies[type]
  }

  isUnpredictableMove(move: MaterialMove<P, M, L>, player: P): boolean {
    if (isMoveItem(move)) {
      return this.moveItemWillRevealSomething(move, player)
    } else if (isMoveItemsAtOnce(move)) {
      return this.moveAtOnceWillRevealSomething(move, player)
    } else if (isCreateItem(move)) {
      return this.itemHasHiddenInformation(move.itemType, move.item, player)
    } else if (isCreateItemsAtOnce(move)) {
      return move.items.some(item => this.itemHasHiddenInformation(move.itemType, item, player))
    } else if (isShuffle(move)) {
      return this.canSeeShuffleResult(move, player)
    } else {
      return super.isUnpredictableMove(move, player)
    }
  }

  protected moveBlocksUndo(move: MaterialMove<P, M, L>): boolean {
    return super.moveBlocksUndo(move) || this.moveRevealsSomething(move)
  }

  protected moveRevealsSomething(move: MaterialMove<P, M, L>): boolean {
    return (isMoveItem(move) || isMoveItemsAtOnce(move)) && !!move.reveal
  }

  getView(player?: P): MaterialGame<P, M, L> {
    return {
      ...this.game,
      items: mapValues(this.game.items, (items, stringType) => {
        const itemsType = parseInt(stringType) as M
        const hidingStrategies = this.hidingStrategies[itemsType]
        if (!hidingStrategies || !items) return items
        return items.map(item => this.hideItem(itemsType, item, player))
      })
    }
  }

  private hideItem(type: M, item: MaterialItem<P, L>, player?: P): MaterialItem<P, L> {
    const paths = this.getItemHiddenPaths(type, item, player)
    if (!paths.length) return item
    const hiddenItem = JSON.parse(JSON.stringify(item))
    for (const path of paths) {
      unset(hiddenItem, path)
    }
    return hiddenItem
  }


  private getItemHiddenPaths(type: M, item: MaterialItem<P, L>, player?: P): string[] {
    const hidingStrategy = this.hidingStrategies[type]?.[item.location.type]
    return hidingStrategy ? (hidingStrategy as HidingSecretsStrategy<P, L>)(item, player) : []
  }

  private itemHasHiddenInformation(type: M, item: MaterialItem<P, L>, player?: P): boolean {
    return this.getItemHiddenPaths(type, item, player).length > 0
  }

  getMoveView(move: MaterialMoveRandomized<P, M, L>, player?: P): MaterialMove<P, M, L> {
    if (move.kind === MoveKind.ItemMove && move.itemType in this.hidingStrategies) {
      switch (move.type) {
        case ItemMoveType.Move:
          return this.getMoveItemView(move, player)
        case ItemMoveType.MoveAtOnce:
          return this.getMoveAtOnceView(move, player)
        case ItemMoveType.Create:
          return { ...move, item: this.hideItem(move.itemType, move.item, player) }
        case ItemMoveType.CreateAtOnce:
          return { ...move, items: move.items.map(item => this.hideItem(move.itemType, item, player)) }
        case ItemMoveType.Shuffle:
          return this.getShuffleItemsView(move, player)
      }
    }
    return move
  }

  private getMoveItemView(move: MoveItem<P, M, L>, player?: P): MoveItem<P, M, L> {
    if (!move.reveal) return move
    const revealedPaths = this.getMoveItemRevealedPath(move, player)
    if (!revealedPaths.length) return move
    const item = this.material(move.itemType).getItem(move.itemIndex)!
    const moveView = { ...move, reveal: {} }
    for (const path of revealedPaths) {
      set(moveView.reveal, path, get(item, path))
    }
    return moveView
  }

  private getMoveAtOnceView(move: MoveItemsAtOnce<P, M, L>, player?: P): MoveItemsAtOnce<P, M, L> {
    if (!move.reveal) return move
    const moveView: MoveItemsAtOnce<P, M, L> = { ...move, reveal: {} }
    for (const index of move.indexes) {
      const revealedPaths = this.getMoveAtOnceRevealedPath(move, index, player)
      if (!revealedPaths.length) continue
      const item = this.material(move.itemType).getItem(index)!
      moveView.reveal![index] = {}
      for (const path of revealedPaths) {
        set(moveView.reveal![index], path, get(item, path))
      }
    }

    return moveView
  }

  private getMoveItemRevealedPath(move: MoveItem<P, M, L>, player?: P): string[] {
    const item = this.material(move.itemType).getItem(move.itemIndex)!
    const hiddenPathsBefore = this.getItemHiddenPaths(move.itemType, item, player)
    const hiddenPathsAfter = this.getItemHiddenPaths(move.itemType, this.mutator(move.itemType).getItemAfterMove(move), player)
    return difference(hiddenPathsBefore, hiddenPathsAfter)
  }

  private getMoveAtOnceRevealedPath(move: MoveItemsAtOnce<P, M, L>, itemIndex: number, player?: P): string[] {
    const item = this.material(move.itemType).getItem(itemIndex)!
    const hiddenPathsBefore = this.getItemHiddenPaths(move.itemType, item, player)
    const hiddenPathsAfter = this.getItemHiddenPaths(move.itemType, this.mutator(move.itemType).getItemAfterMoveAtOnce(move, itemIndex), player)
    return difference(hiddenPathsBefore, hiddenPathsAfter)
  }

  private moveItemWillRevealSomething(move: MoveItem<P, M, L>, player?: P): boolean {
    return this.getMoveItemRevealedPath(move, player).length > 0
  }

  private moveAtOnceWillRevealSomething(move: MoveItemsAtOnce<P, M, L>, player?: P): boolean {
    return move.indexes.some((index) => this.getMoveAtOnceRevealedPath(move, index, player).length)
  }

  private getShuffleItemsView(move: ShuffleRandomized<M>, player?: P): Shuffle<M> {
    if (this.canSeeShuffleResult(move, player)) return move
    const { newIndexes, ...moveView } = move
    return moveView
  }

  private canSeeShuffleResult(move: Shuffle<M>, player?: P): boolean {
    if (!this.hidingStrategies[move.itemType]) return true
    const material = this.material(move.itemType)
    const hiddenPaths = this.getItemHiddenPaths(move.itemType, material.getItem(move.indexes[0])!, player)
    if (process.env.NODE_ENV === 'development' && move.indexes.some(index =>
      !isEqual(hiddenPaths, this.getItemHiddenPaths(move.itemType, material.getItem(index)!, player))
    )) {
      throw new RangeError(`You cannot shuffle items with different hiding strategies: ${
        JSON.stringify(move.indexes.map(index => this.getItemHiddenPaths(move.itemType, material.getItem(index)!, player)))
      }`)
    }
    // TODO: if we shuffle a hand of items partially hidden, we should send the partially visible information to the client.
    // Example: It's a Wonderful World with the Extension: the back face of the player's hand are different
    // => when the hand is shuffled we should see where the expansion cards land.
    return !hiddenPaths.length
  }

  play(move: MaterialMoveRandomized<P, M, L> | MaterialMoveView<P, M, L>, context?: PlayMoveContext): MaterialMove<P, M, L>[] {
    const result = this.transformMoves(super.play(move, context))

    if (this.client && isMoveItem(move) && this.hidingStrategies[move.itemType]) {
      const item = this.material(move.itemType).getItem(move.itemIndex)
      if (item) {
        this.game.items[move.itemType]![move.itemIndex] = this.hideItem(move.itemType, item, this.client.player)
      }
    }

    if (this.client && isMoveItemsAtOnce(move) && this.hidingStrategies[move.itemType]) {
      for (const index of move.indexes) {
        const item = this.material(move.itemType).getItem(index)
        if (item) {
          this.game.items[move.itemType]![index] = this.hideItem(move.itemType, item, this.client.player)
        }
      }
    }

    return result
  }
}

export type HidingStrategy<P extends number = number, L extends number = number> = (item: MaterialItem<P, L>) => string[]

export const hideItemId: HidingStrategy = () => ['id']
export const hideFront: HidingStrategy = () => ['id.front']
