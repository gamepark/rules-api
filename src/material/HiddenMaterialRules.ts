import difference from 'lodash/difference'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import keys from 'lodash/keys'
import mapValues from 'lodash/mapValues'
import set from 'lodash/set'
import unset from 'lodash/unset'
import { HiddenInformation } from '../HiddenInformation'
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

/**
 * Implement HiddenMaterialRules when you want to use the {@link MaterialRules} approach with {@link HiddenInformation}.
 * Using some {@link HidingStrategy} allows to enforce the security of a game with hidden information easily.
 * If the game has secret information (some players have information not available to others, link cards in their hand), then you
 * must implement {@link SecretMaterialRules} instead.
 */
export abstract class HiddenMaterialRules<P extends number = number, M extends number = number, L extends number = number, R extends number = number>
  extends MaterialRules<P, M, L, R>
  implements HiddenInformation<MaterialGame<P, M, L, R>, MaterialMove<P, M, L, R>, MaterialMove<P, M, L, R>> {

  constructor(game: MaterialGame<P, M, L, R>, private readonly client?: { player?: P }) {
    super(game)
  }

  /**
   * A hiding strategy allows to hide automatically some information about an item when it is at a specific location type.
   * Usually, we hide the item id (or a part of it).
   * Example: {[MaterialType.Card]: {[LocationType.Deck]: hideItemId}} will hide the id of the cards in the deck to everybody.
   * See {@link HidingStrategy}
   */
  abstract readonly hidingStrategies: Partial<Record<M, Partial<Record<L, HidingStrategy<P, L>>>>>

  randomize(move: MaterialMove<P, M, L, R>, player?: P): MaterialMove<P, M, L> & MaterialMoveRandomized<P, M, L, R> {
    if (player !== undefined && this.isRevealingItemMove(move, player)) {
      // We need to know if a MoveItem has revealed something to the player to prevent the undo in that case.
      // To know that, we need the position of the item before the move.
      // To prevent having to recalculate the game state before the move, we flag the move in the database with "reveal: {}".
      // This flag indicate that something was revealed to someone.
      // We use the "randomize" function because is the where we can "preprocess" the move and transform it after checking it is legal and before it is saved.
      return { ...move, reveal: {} }
    }
    return super.randomize(move)
  }

  private isRevealingItemMove(move: MaterialMove<P, M, L, R>, player: P): move is MoveItem<P, M, L> | MoveItemsAtOnce<P, M, L> {
    return (isMoveItem(move) && this.moveItemWillRevealSomething(move, player))
      || (isMoveItemsAtOnce(move) && this.moveAtOnceWillRevealSomething(move, player))
  }

  /**
   * Items that can be hidden cannot merge by default, to prevent hidden items to merge only because they have no id.
   */
  itemsCanMerge(type: M): boolean {
    return !this.hidingStrategies[type]
  }

  /**
   * Moves that reveal some information (like drawing a card) cannot be predicted by the player.
   */
  isUnpredictableMove(move: MaterialMove<P, M, L, R>, player: P): boolean {
    if (isMoveItem(move)) {
      return this.moveItemWillRevealSomething(move, player)
    } else if (isMoveItemsAtOnce(move)) {
      return this.moveAtOnceWillRevealSomething(move, player)
    } else if (isCreateItem(move)) {
      return this.itemHasHiddenInformation(move.itemType, move.item, player)
    } else if (isCreateItemsAtOnce(move)) {
      return move.items.some(item => this.itemHasHiddenInformation(move.itemType, item, player))
    } else if (isShuffle(move)) {
      return true
    } else {
      return super.isUnpredictableMove(move, player)
    }
  }

  /**
   * Moves than reveals an information to someone cannot be undone by default
   */
  protected moveBlocksUndo(move: MaterialMove<P, M, L, R>, player?: P): boolean {
    return super.moveBlocksUndo(move, player) || this.moveRevealedSomething(move)
  }

  /**
   * @param move A move to test
   * @returns true if the move revealed something to some player
   */
  protected moveRevealedSomething(move: MaterialMove<P, M, L, R>): boolean {
    return (isMoveItem(move) || isMoveItemsAtOnce(move)) && !!move.reveal
  }

  /**
   * With the material approach, we can offer a default working implementation for {@link HiddenInformation.getView}
   */
  getView(player?: P): MaterialGame<P, M, L, R> {
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
    const hiddenPaths = hidingStrategy ? (hidingStrategy as HidingSecretsStrategy<P, L>)(item, player) : []
    return hiddenPaths.flatMap((path) => {
      if (!path) console.error('Empty paths are not allowed in hiding strategies')
      const itemAtPath = get(item, path)
      if (typeof itemAtPath === 'object') {
        return keys(itemAtPath).map((key) => path + '.' + key)
      } else {
        return [path]
      }
    })
  }

  private itemHasHiddenInformation(type: M, item: MaterialItem<P, L>, player?: P): boolean {
    return this.getItemHiddenPaths(type, item, player).length > 0
  }

  /**
   * To be able to know if a MoveItem cannot be undone, the server flags the moves with a "reveal" property.
   * This difference must be integrated without error during the callback.
   */
  canIgnoreServerDifference(clientMove: MaterialMove<P, M, L, R>, serverMove: MaterialMove<P, M, L, R>): boolean {
    if (isMoveItem(clientMove) && isMoveItem(serverMove)) {
      const { reveal, ...serverMoveWithoutReveal } = serverMove
      return isEqual(clientMove, serverMoveWithoutReveal)
    }
    return false
  }

  /**
   * With the material approach, we can offer a default working implementation for {@link HiddenInformation.getMoveView}
   */
  getMoveView(move: MaterialMoveRandomized<P, M, L, R>, player?: P): MaterialMove<P, M, L, R> {
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
    const revealedPaths = this.getMoveItemRevealedPath(move, player)
    if (!revealedPaths.length) return move
    const item = this.material(move.itemType).getItem(move.itemIndex)
    const moveView = { ...move, reveal: {} }
    for (const path of revealedPaths) {
      set(moveView.reveal, path, get(item, path))
    }
    return moveView
  }

  private getMoveAtOnceView(move: MoveItemsAtOnce<P, M, L>, player?: P): MoveItemsAtOnce<P, M, L> {
    const moveView: MoveItemsAtOnce<P, M, L> = { ...move }
    for (const index of move.indexes) {
      const revealedPaths = this.getMoveAtOnceRevealedPath(move, index, player)
      if (!revealedPaths.length) continue
      if (!moveView.reveal) moveView.reveal = {}
      moveView.reveal![index] = {}
      const item = this.material(move.itemType).getItem(index)
      for (const path of revealedPaths) {
        set(moveView.reveal![index], path, get(item, path))
      }
    }

    return moveView
  }

  private getMoveItemRevealedPath(move: MoveItem<P, M, L>, player?: P): string[] {
    const item = this.material(move.itemType).getItem(move.itemIndex)
    const hiddenPathsBefore = this.getItemHiddenPaths(move.itemType, item, player)
    const hiddenPathsAfter = this.getItemHiddenPaths(move.itemType, this.mutator(move.itemType).getItemAfterMove(move), player)
    return difference(hiddenPathsBefore, hiddenPathsAfter)
  }

  private getMoveAtOnceRevealedPath(move: MoveItemsAtOnce<P, M, L>, itemIndex: number, player?: P): string[] {
    const item = this.material(move.itemType).getItem(itemIndex)
    const hiddenPathsBefore = this.getItemHiddenPaths(move.itemType, item, player)
    const hiddenPathsAfter = this.getItemHiddenPaths(move.itemType, this.mutator(move.itemType).getItemAfterMoveAtOnce(move, itemIndex), player)
    return difference(hiddenPathsBefore, hiddenPathsAfter)
  }

  private moveItemWillRevealSomething(move: MoveItem<P, M, L>, player: P): boolean {
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
    const hiddenPaths = this.getItemHiddenPaths(move.itemType, material.getItem(move.indexes[0]), player)
    if (process.env.NODE_ENV === 'development' && move.indexes.some(index =>
      !isEqual(hiddenPaths, this.getItemHiddenPaths(move.itemType, material.getItem(index), player))
    )) {
      throw new RangeError(`You cannot shuffle items with different hiding strategies: ${
        JSON.stringify(move.indexes.map(index => this.getItemHiddenPaths(move.itemType, material.getItem(index), player)))
      }`)
    }
    // TODO: if we shuffle a hand of items partially hidden, we should send the partially visible information to the client.
    // Example: It's a Wonderful World with the Extension: the back face of the player's hand are different
    // => when the hand is shuffled we should see where the expansion cards land.
    return !hiddenPaths.length
  }

  /**
   * Override of {@link MaterialRules.play} that also removes the hidden information from items, for example when a card is flipped face down
   */
  play(move: MaterialMoveRandomized<P, M, L, R> | MaterialMoveView<P, M, L, R>, context?: PlayMoveContext): MaterialMove<P, M, L, R>[] {
    const result = super.play(move, context)

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

/**
 * A Hiding Strategy is a function that takes an item and returns a list of path to hide in the item object.
 * See {@link hideItemId} and {@link hideFront} for 2 hiding strategy frequently used.
 */
export type HidingStrategy<P extends number = number, L extends number = number> = (item: MaterialItem<P, L>) => string[]

/**
 * Hiding strategy that removes the item id
 */
export const hideItemId: HidingStrategy = () => ['id']

/**
 * Hiding strategy that removes "id.front" from the item (when we have cards with composite ids, back & front)
 */
export const hideFront: HidingStrategy = () => ['id.front']
