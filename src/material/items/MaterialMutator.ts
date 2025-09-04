import { isEqual, merge } from 'es-toolkit'
import { isSameLocationArea, Location, LocationStrategy } from '../location'
import {
  CreateItem,
  DeleteItem,
  isShuffleRandomized,
  ItemMoveRandomized,
  ItemMoveType,
  ItemMoveView,
  MoveItem,
  MoveItemsAtOnce,
  RollItem,
  SelectItem,
  Shuffle,
  ShuffleRandomized
} from '../moves'
import { Material, MaterialItem } from './index'

/**
 * Helper class to change the state of any {@link MaterialItem} in a game implemented with {@link MaterialRules}.
 *
 * @typeparam P - identifier of a player. Either a number or a numeric enum (eg: PlayerColor)
 * @typeparam M - Numeric enum of the types of material manipulated in the game
 * @typeparam L - Numeric enum of the types of location in the game where the material can be located
 */
export class MaterialMutator<P extends number = number, M extends number = number, L extends number = number> {
  /**
   * @param type Type of items this mutator will work on
   * @param items Items to work with
   * @param locationsStrategies The strategies that these items must follow
   * @param canMerge Whether to items at the exact same location can merge into one item with a quantity
   * @param rulesClassName Constructor name of the main rules class for logging
   */
  constructor(
    private readonly type: M,
    private readonly items: MaterialItem<P, L>[],
    private readonly locationsStrategies: Partial<Record<L, LocationStrategy<P, M, L>>> = {},
    private readonly canMerge: boolean = true,
    private readonly rulesClassName: string = ''
  ) {
  }

  /**
   * Executes a move on the game items
   * @param move
   */
  applyMove(move: ItemMoveRandomized<P, M, L> | ItemMoveView<P, M, L>): void {
    switch (move.type) {
      case ItemMoveType.Create:
        this.create(move)
        break
      case ItemMoveType.CreateAtOnce:
        for (const item of move.items) {
          this.create({ ...move, type: ItemMoveType.Create, item })
        }
        break
      case ItemMoveType.Move:
        this.move(move)
        break
      case ItemMoveType.MoveAtOnce:
        this.moveItemsAtOnce(move)
        break
      case ItemMoveType.Roll:
        this.roll(move)
        break
      case ItemMoveType.Delete:
        this.delete(move)
        break
      case ItemMoveType.DeleteAtOnce:
        for (const index of move.indexes) {
          this.removeItem(this.items[index]!, Infinity)
        }
        break
      case ItemMoveType.Shuffle:
        this.shuffle(move)
        break
      case ItemMoveType.Select:
        this.select(move)
        break
    }
  }

  /**
   * Find the index of an existing item we could merge a new item with (create a single item with a quantity)
   *
   * @param newItem An item to compare with existing items
   * @returns {number} Index of the existing item we can merge with, or -1 if there is no possible merge
   */
  findMergeIndex(newItem: MaterialItem<P, L>): number {
    if (!this.canMerge) return -1
    const { quantity: q1, ...data1 } = newItem
    return this.items.findIndex(({ quantity: q2, ...data2 }) => q1 !== 0 && q2 !== 0 && isEqual(data1, data2))
  }

  private addItem(item: MaterialItem<P, L>): void {
    this.applyAddItemStrategy(item)
    const availableIndex = this.items.findIndex(item => item.quantity === 0)
    if (availableIndex !== -1) {
      this.items[availableIndex] = item
    } else {
      this.items.push(item)
    }
  }

  /**
   * Provides the index that the new item will have
   * @param newItem An item that is going to be created
   * @returns {number} the future index of that item
   */
  getItemCreationIndex(newItem: MaterialItem<P, L>): number {
    const mergeIndex = this.findMergeIndex(newItem)
    if (mergeIndex !== -1) return mergeIndex
    const availableIndex = this.items.findIndex(item => item.quantity === 0)
    if (availableIndex !== -1) return availableIndex
    return this.items.length
  }

  private applyAddItemStrategy(item: MaterialItem<P, L>): void {
    if (item.location.type in this.locationsStrategies) {
      const strategy = this.locationsStrategies[item.location.type]!
      if (strategy.addItem) {
        const material = new Material(this.type, this.items)
          .location(item.location.type).player(item.location.player).locationId(item.location.id).parent(item.location.parent)
        strategy.addItem(material, item)
      }
    }
  }

  private applyMoveItemStrategy(item: MaterialItem<P, L>, index: number): void {
    if (item.location.type in this.locationsStrategies) {
      const strategy = this.locationsStrategies[item.location.type]!
      if (strategy.moveItem) {
        const material = new Material(this.type, this.items)
          .location(item.location.type).player(item.location.player).locationId(item.location.id).parent(item.location.parent)
        strategy.moveItem(material, item, index)
      }
    }
  }

  private removeItem(item: MaterialItem<P, L>, quantity: number = 1) {
    item.quantity = Math.max(0, (item.quantity ?? 1) - quantity)
    if (item.quantity === 0) {
      this.applyRemoveItemStrategy(item)
    }
  }

  private applyRemoveItemStrategy(item: MaterialItem<P, L>): void {
    if (item.location.type in this.locationsStrategies) {
      const strategy = this.locationsStrategies[item.location.type]!
      if (strategy.removeItem) {
        const material = new Material(this.type, this.items)
          .location(item.location.type).player(item.location.player).locationId(item.location.id).parent(item.location.parent)
        strategy.removeItem(material, item)
      }
    }
  }

  private create(move: CreateItem<P, M, L>): void {
    const mergeIndex = this.findMergeIndex(move.item)
    if (mergeIndex !== -1) {
      const mergeItem = this.items[mergeIndex]
      mergeItem.quantity = (mergeItem.quantity ?? 1) + (move.item.quantity ?? 1)
    } else {
      if (move.item.quantity && !this.canMerge) {
        console.error(`${this.rulesClassName}: do not use quantity on items that cannot merge. Items that can be hidden cannot merge.`)
      }
      this.addItem(JSON.parse(JSON.stringify(move.item)))
    }
  }

  private move(move: MoveItem<P, M, L>): void {
    const quantity = move.quantity ?? 1
    const sourceItem = this.items[move.itemIndex]
    const itemAfterMove = this.getItemAfterMove(move)
    const mergeIndex = this.findMergeIndex(itemAfterMove)
    if (mergeIndex !== -1) {
      if (mergeIndex === move.itemIndex) {
        console.warn(`${this.rulesClassName}: item is moved to the location he already has - ${JSON.stringify(move)}`)
      } else {
        const mergeItem = this.items[mergeIndex]
        mergeItem.quantity = (mergeItem.quantity ?? 1) + quantity
        this.removeItem(sourceItem, quantity)
      }
    } else if (sourceItem.quantity && sourceItem.quantity > quantity) {
      sourceItem.quantity -= quantity
      this.addItem(itemAfterMove)
    } else {
      this.moveItem(sourceItem, itemAfterMove, move.itemIndex)
    }
  }

  private roll(move: RollItem<P, M, L>): void {
    const sourceItem = this.items[move.itemIndex]
    const itemAfterMove: MaterialItem<P, L> = { ...sourceItem, location: JSON.parse(JSON.stringify(move.location)) }
    this.moveItem(sourceItem, itemAfterMove, move.itemIndex)
  }

  private moveItem(item: MaterialItem<P, L>, newItem: MaterialItem<P, L>, index: number): void {
    if (!isSameLocationArea(newItem.location, item.location)) {
      this.applyAddItemStrategy(newItem)
    } else {
      this.applyMoveItemStrategy(newItem, index)
    }
    this.items[index] = newItem
    if (!isSameLocationArea(newItem.location, item.location)) {
      this.applyRemoveItemStrategy(item)
    }
  }

  private moveItemsAtOnce(move: MoveItemsAtOnce<P, M, L>): void {
    for (const index of move.indexes) {
      const sourceItem = this.items[index]
      const itemAfterMove = this.getItemAfterMoveAtOnce(move, index)
      if (!isSameLocationArea(itemAfterMove.location, sourceItem.location)) {
        this.applyAddItemStrategy(itemAfterMove)
      } else {
        this.applyMoveItemStrategy(itemAfterMove, index)
      }
      this.items[index] = itemAfterMove
      if (!isSameLocationArea(itemAfterMove.location, sourceItem.location)) {
        this.applyRemoveItemStrategy(sourceItem)
      }
    }
  }

  /**
   * Provides the state of an item after it is moved
   * @param move The move that is going to happen
   * @return {MaterialItem} state of the item after the move is executed
   */
  getItemAfterMove(move: MoveItem<P, M, L>): MaterialItem<P, L> {
    const item: MaterialItem<P, L> = this.getItemWithLocation(move.location, move.itemIndex)
    if (move.reveal) {
      merge(item, move.reveal)
    }
    if (move.quantity) {
      item.quantity = move.quantity
    } else {
      delete item.quantity
    }
    return item
  }

  /**
   * Provides the state of an item after it is moved
   * @param move The move that is going to happen
   * @param index Index of the item to consider
   * @return {MaterialItem} state of the item after the move is executed
   */
  getItemAfterMoveAtOnce(move: MoveItemsAtOnce<P, M, L>, index: number): MaterialItem<P, L> {
    const item: MaterialItem<P, L> = this.getItemWithLocation(move.location, index)
    if (move.reveal && move.reveal[index]) {
      merge(item, move.reveal[index])
    }
    return item
  }

  private getItemWithLocation(location: Partial<Location<P, L>>, index: number): MaterialItem<P, L> {
    const moveLocation = JSON.parse(JSON.stringify(location))
    const actualItem = this.items[index]
    const newLocation = location.type === undefined ? { ...actualItem.location, ...moveLocation } : moveLocation
    return { ...actualItem, location: newLocation }
  }

  private delete(move: DeleteItem<M>): void {
    return this.removeItem(this.items[move.itemIndex]!, move.quantity)
  }

  private shuffle(move: Shuffle<M> | ShuffleRandomized<M>): void {
    if (!isShuffleRandomized(move)) return // Nothing to do on front-end side for a shuffle. The index swap is only required on the backend.
    const shuffledItems = move.indexes.map((index) => this.items[index])
    move.newIndexes.forEach((newIndex, i) => {
      this.items[newIndex] = { ...shuffledItems[i], location: this.items[newIndex].location }
    })
  }

  private select(move: SelectItem<M>) {
    const item = this.items[move.itemIndex]
    if (move.selected === false) {
      delete item.selected
    } else {
      item.selected = move.quantity ?? true
    }
  }
}
