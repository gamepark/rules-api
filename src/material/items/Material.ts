import isEqual from 'lodash/isEqual'
import maxBy from 'lodash/maxBy'
import minBy from 'lodash/minBy'
import orderBy from 'lodash/orderBy'
import sumBy from 'lodash/sumBy'
import { isSameLocationArea, Location } from '../location'
import {
  CreateItem,
  CreateItemsAtOnce,
  DeleteItem,
  DeleteItemsAtOnce,
  ItemMove,
  ItemMoveType,
  MoveItem,
  MoveItemsAtOnce,
  MoveKind,
  RollItem,
  SelectItem,
  Shuffle
} from '../moves'
import { MaterialDeck, MaterialMoney } from './index'
import { MaterialItem } from './MaterialItem'

export type ItemEntry<P extends number = number, L extends number = number> = [number, MaterialItem<P, L>]

/**
 * The Material class is the core helper class that help manipulate the game items in a simple way.
 * It includes two kind of functions: functions to filter items, and functions to build {@link ItemMove} objects.
 * Filter function will all return a new instance of Material with only the filtered items. This class is designed to be immutable.
 *
 * @typeparam P - identifier of a player. Either a number or a numeric enum (eg: PlayerColor)
 * @typeparam M - Numeric enum of the types of material manipulated in the game
 * @typeparam L - Numeric enum of the types of location in the game where the material can be located
 */
export class Material<P extends number = number, M extends number = number, L extends number = number> {

  /**
   * Construct a new Material helper instance
   * @param {number} type Type of items this instance will work on
   * @param {MaterialItem[]} items The complete list of items of this type in current game state.
   * @param {function} processMove if provided, this function will be executed on every move created with this instance
   * @param {ItemEntry[]} entries The list of items to work on. Each entry consists of an array with the index of the item, and the item
   */
  constructor(
    readonly type: M,
    protected items: MaterialItem<P, L>[] = [],
    protected readonly processMove?: (move: ItemMove<P, M, L>) => void,
    public entries: ItemEntry<P, L>[] = Array.from(items.entries()).filter(entry => entry[1].quantity !== 0)) {
  }

  /**
   * Helper function to return a new instance of the same class (works also for children class)
   * @param {ItemEntry[]} entries Filtered entries for the new class
   * @returns {this} the new Material instance
   * @protected
   */
  protected new(entries: ItemEntry<P, L>[]): this {
    const Class = this.constructor as new (type: M, items: MaterialItem<P, L>[], processMove?: (move: ItemMove<P, M, L>) => void, entries?: ItemEntry<P, L>[]) => this
    return new Class(this.type, this.items, this.processMove, entries)
  }

  /**
   * Use this function to collect all the items in the current Material instance.
   * For example, you can filter then collect the matching items: this.material(type).location(locationType).getItems()
   *
   * @typeparam Id - Identifier of the items (item.id)
   * @param {function} predicate If provided, only the items matching the predicate will be returned
   * @returns {MaterialItem[]} the items in this Material instance
   */
  getItems<Id = any>(predicate?: (item: MaterialItem<P, L, Id>) => boolean): MaterialItem<P, L, Id>[] {
    const items = this.entries.map(entry => entry[1]) as MaterialItem<P, L, Id>[]
    return predicate ? items.filter(predicate) : items
  }

  /**
   * @overload
   * Get the item at a specific index.
   * @throws Error if there is no item at this index
   *
   * @param {number} index Index of the item
   * @returns {MaterialItem} the item
   */
  getItem<Id = any>(index: number): MaterialItem<P, L, Id>

  /**
   * @overload
   * @param predicate If provided, returns the first item matching the predicate
   * @returns {MaterialItem | undefined} the item, or undefined if none match
   */
  getItem<Id = any>(predicate?: (item: MaterialItem<P, L, Id>) => boolean): MaterialItem<P, L, Id> | undefined

  /**
   * Use this function to collect this first item in the current Material instance.
   * You can use {@link sort} to sort the items first.
   *
   * @param {number | function} arg Index of the item, or predicate function
   * @returns {MaterialItem | undefined} the item, or undefined if none match
   */
  getItem<Id = any>(arg?: number | ((item: MaterialItem<P, L, Id>) => boolean)): MaterialItem<P, L, Id> | undefined {
    if (typeof arg === 'number') {
      const entry = this.entries.find(entry => entry[0] === arg)
      if (!entry) throw new Error(`Could not find any item with index ${arg} for type ${this.type}`)
      return entry[1] as MaterialItem<P, L, Id>
    } else if (typeof arg === 'function') {
      const entries = this.entries.filter(([, item]) => arg(item as MaterialItem<P, L, Id>))
      return entries.length ? entries[0][1] as MaterialItem<P, L, Id> : undefined
    } else {
      return this.entries.length ? this.entries[0][1] as MaterialItem<P, L, Id> : undefined
    }
  }

  /**
   * @returns {number} index of the first item
   */
  getIndex(): number {
    return this.entries[0]?.[0] ?? -1
  }

  /**
   * @returns {number[]} indexes of the items
   */
  getIndexes(): number[] {
    return this.entries.map(entry => entry[0])
  }

  /**
   * Filter and return a new instance with only the items that match a specific index, or a specific index predicate
   * @param {number | function} arg The index to keep, or the predicate matching the indexes to keep
   */
  index(arg?: number | number[] | ((index: number) => boolean)): this {
    switch (typeof arg) {
      case 'function':
        return this.filter((_, index) => arg(index))
      case 'number':
        const item = this.entries.find(([index]) => index === arg)
        return this.new(item ? [item] : [])
      case 'undefined':
        return this.new([])
      default:
        const items = this.entries.filter(([i]) => arg.includes(i))
        return this.new(items)
    }
  }

  /**
   * @deprecated Use {@link index} instead
   */
  indexes(indexes: number[]): this {
    const items = this.entries.filter(([i]) => indexes.includes(i))
    return this.new(items)
  }

  /**
   * @returns {number} number of items
   */
  get length(): number {
    return this.entries.length
  }

  /**
   * @returns {number} Sum of the quantity of all items
   */
  getQuantity(): number {
    return sumBy(this.entries, ([, item]) => item.quantity ?? 1)
  }

  /**
   * This function filter the items and returns a new instance with only the filtered items.
   * This function is the top level filtering function, but other function can be used to simplify the code:
   * {@link player}, {@link location}, {@link rotation}, {@link id}, {@link locationId}...
   *
   * @param {function} predicate The predicate function. Takes every item and index, and keep the item if it returns true
   * @returns {this} New instance with only the items that match the predicate
   */
  filter<Id extends string | number | Record<string, any> | undefined>(predicate: (item: MaterialItem<P, L, Id>, index: number) => boolean): this {
    return this.new(this.entries.filter(([index, item]) => predicate(item as MaterialItem<P, L, Id>, index)))
  }

  /**
   * Filters the items based on their ids.
   *
   * @param {function | string | number | Record} arg Id to keep, or predicate function to match the ids of the items to keep
   * @returns {this} New instance with only the items which ids match the argument
   */
  id<Id extends string | number | Record<string, any> | undefined>(arg?: Id | ((id: Id) => boolean)): this {
    return this.filter<Id>(({ id }) => typeof arg === 'function' ? arg(id) : isEqual(id, arg))
  }

  /**
   * Filters the items based on their location type, or their location.
   *
   * @param {function | number} arg Location type to keep, or predicate function to match the location of the items to keep
   * @returns {this} New instance with only the items which locations match the argument
   */
  location<Id = any, Rotation = any>(arg: L | ((location: Location<P, L, Id, Rotation>) => boolean)): this {
    return this.filter(({ location }) => typeof arg === 'function' ? arg(location) : location.type === arg)
  }

  /**
   * Filters the items based on their rotation (item.location.rotation)
   *
   * @param {function | string | number | boolean | Record} arg rotation to keep, or predicate function to match the rotations of the items to keep
   * @returns {this} New instance with only the items which rotation match the argument
   */
  rotation<R extends string | number | boolean | Record<string, any> | undefined>(arg?: R | ((rotation: R) => boolean)): this {
    return this.location(({ rotation }) => typeof arg === 'function' ? arg(rotation) : isEqual(rotation, arg))
  }

  /**
   * Filters the items based on their owner (item.location.player)
   *
   * @param {function | number} arg player id to keep, or predicate function to match the owner player of the items to keep
   * @returns {this} New instance with only the items which owner match the argument
   */
  player(arg?: P | ((player?: P) => boolean)): this {
    return this.location(({ player }) => typeof arg === 'function' ? arg(player) : player === arg)
  }

  /**
   * Filters the items based on their location's id (item.location.id)
   *
   * @param {function | number} arg location id to keep, or predicate function to match the location id of the items to keep
   * @returns {this} New instance with only the items which location id match the argument
   */
  locationId<Id extends string | number | boolean | Record<string, any> | undefined>(arg: Id | ((id: Id) => boolean)): this {
    return this.location(({ id }) => typeof arg === 'function' ? arg(id) : isEqual(id, arg))
  }

  /**
   * Filters the items based on their location's parent (item.location.parent).
   *
   * @param {function | number} arg location parent to keep, or predicate function to match the location parent of the items to keep
   * @returns {this} New instance with only the items which location parent match the argument
   */
  parent(arg?: number | ((parent?: number) => boolean)): this {
    return this.location(({ parent }) => typeof arg === 'function' ? arg(parent) : isEqual(parent, arg))
  }

  /**
   * Filters the items that are selected (item.selected).
   *
   * @param {number | boolean} selected The selected value to compare (default is true)
   * @returns {this} New instance with only the items which are selected
   */
  selected(selected: number | boolean = true): this {
    return this.filter(item => (item.selected ?? false) === selected)
  }

  /**
   * Keep only the item that has the minimum value returned by the selector argument.
   * See {@link minBy} from Lodash
   *
   * @param {function} selector The function that evaluate the item's value
   * @returns {this} New instance with only the item which has the minimum value
   */
  minBy(selector: (item: MaterialItem<P, L>) => number): this {
    const min = minBy(this.entries, entry => selector(entry[1]))
    return this.new(min ? [min] : [])
  }

  /**
   * Keep only the item that has the maximum value returned by the selector argument.
   * See {@link maxBy} from Lodash
   *
   * @param {function} selector The function that evaluate the item's value
   * @returns {this} New instance with only the item which has the maximum value
   */
  maxBy(selector: (item: MaterialItem<P, L>) => number): this {
    const max = maxBy(this.entries, entry => selector(entry[1]))
    return this.new(max ? [max] : [])
  }

  /**
   * Return a new material instance which items are ordered based on provided selector functions.
   * See {@link orderBy} from Lodash
   *
   * @param {...function} selectors The function or functions that evaluate each item's value
   * @returns {this} New instance with items ordered by the selector functions
   */
  sort(...selectors: ((item: MaterialItem<P, L>) => number)[]): this {
    let orderedItems = orderBy(this.entries, selectors.map((s) => (entry) => s(entry[1])))
    return this.new(orderedItems)
  }

  /**
   * Return a new material instance with only the first N items.
   * You have to use {@link sort} first as the items are ordered initially by index, which is not relevant.
   * Example: material.sort(item => !item.location.x!).limit(10)
   *
   * @param count Number of items to keep
   * @returns {this} New instance with only the first "count" items
   */
  limit(count: number): this {
    return this.new(this.entries.slice(0, count))
  }

  private process<T extends ItemMove<P, M, L>>(moves: T[]): T[] {
    if (this.processMove) {
      for (const move of moves) {
        this.processMove(move)
      }
    }
    return moves
  }

  /**
   * Prepare a move that will create a new item
   * @param {MaterialItem} item The item to create
   * @returns {CreateItem} the move that creates an item when executed
   */
  createItem(item: MaterialItem<P, L>): CreateItem<P, M, L> {
    return this.createItems([item])[0]
  }

  /**
   * Prepare a list of moves to create new items
   * @param {MaterialItem[]} items The items to create
   * @returns {CreateItem[]} the moves that creates the new items when executed
   */
  createItems(items: MaterialItem<P, L>[]): CreateItem<P, M, L>[] {
    return this.process(items.map(item => ({
      kind: MoveKind.ItemMove,
      type: ItemMoveType.Create,
      itemType: this.type,
      item
    })))
  }

  /**
   * Prepare one move to create new items
   * @param {MaterialItem[]} items The items to create
   * @returns {CreateItemsAtOnce} the move that creates the new items when executed
   */
  createItemsAtOnce(items: MaterialItem<P, L>[]): CreateItemsAtOnce<P, M, L> {
    const move: CreateItemsAtOnce<P, M, L> = { kind: MoveKind.ItemMove, type: ItemMoveType.CreateAtOnce, itemType: this.type, items }
    return this.process([move])[0]
  }

  /**
   * Prepare a move that will delete current first item in this material instance
   *
   * @param {number | undefined} quantity Optional: for items with a quantity, the number of items to remove. If undefined, the item is completely removed
   * @returns {DeleteItem} the move that delete the item, or a part of its quantity, when executed
   */
  deleteItem(quantity?: number): DeleteItem<M> {
    switch (this.length) {
      case 0:
        throw new Error('You are trying to delete an item that does not exists')
      case 1:
        return this.deleteItems(quantity)[0]
      default:
        return this.limit(1).deleteItems(quantity)[0]
    }
  }

  /**
   * Prepare moves that will delete all the items in this material instance
   *
   * @param {number | undefined} quantity Optional: for items with a quantity, the number of items to remove. If undefined, the items are completely removed
   * @returns {DeleteItem[]} the moves that delete the items, or a part of their quantity, when executed
   */
  deleteItems(quantity?: number): DeleteItem<M>[] {
    return this.process(this.entries.map(entry => {
      const move: DeleteItem<M> = {
        kind: MoveKind.ItemMove,
        type: ItemMoveType.Delete,
        itemType: this.type,
        itemIndex: entry[0]
      }
      if (quantity) move.quantity = quantity
      return move
    }))
  }

  /**
   * Prepare one move that will delete all the items in this material instance
   *
   * @returns {DeleteItemsAtOnce} the move that delete the items when executed
   */
  deleteItemsAtOnce(): DeleteItemsAtOnce<M> {
    const moves: DeleteItemsAtOnce<M> = { kind: MoveKind.ItemMove, type: ItemMoveType.DeleteAtOnce, itemType: this.type, indexes: this.getIndexes() }
    return this.process([moves])[0]
  }

  /**
   * Prepare a move that will change the location of the current first item in this material instance
   *
   * @param {Location | function} location The new location of the item. It can be a function to process the location based on the item current state.
   * @param {number | undefined} quantity Optional: for items with a quantity, the number of items to move. If undefined, the item is completely moved.
   * @returns {MoveItem} the move that will change the location of the item (or a part of its quantity) when executed
   */
  moveItem<ItemId = any, LocId = ItemId, Rotation = any>(
    location: Location<P, L, LocId, Rotation> | ((item: MaterialItem<P, L, ItemId>) => Location<P, L, LocId, Rotation>),
    quantity?: number
  ): MoveItem<P, M, L> {
    switch (this.length) {
      case 0:
        throw new Error('You are trying to move an item that does not exists')
      case 1:
        return this.moveItems(location, quantity)[0]
      default:
        return this.limit(1).moveItems(location, quantity)[0]
    }
  }

  /**
   * Prepare moves that will change the location of all the items in this material instance
   *
   * @param {Location | function} location The new location of the items. It can be a function to process the location based on each item current state.
   * @param {number | undefined} quantity Optional: for items with a quantity, the number of items to move. If undefined, the items are completely moved.
   * @returns {MoveItem[]} the moves that will change the location of the items (or a part of their quantity) when executed
   */
  moveItems<ItemId = any, LocId = ItemId, Rotation = any>(
    location: Partial<Location<P, L, LocId, Rotation>> | ((item: MaterialItem<P, L, ItemId>, index: number) => Partial<Location<P, L, LocId, Rotation>>),
    quantity?: number
  ): MoveItem<P, M, L>[] {
    const getLocation = typeof location === 'function' ? location : () => location
    return this.process(this.entries.map(entry => {
      const location = getLocation(entry[1] as MaterialItem<P, L, ItemId>, entry[0])
      const move: MoveItem<P, M, L> = {
        kind: MoveKind.ItemMove,
        type: ItemMoveType.Move,
        itemType: this.type,
        itemIndex: entry[0],
        location
      }
      if (quantity) move.quantity = quantity
      return move
    }))
  }

  /**
   * Prepare one move that will change the location of all the items in this material instance
   *
   * @param {Location} location The new location of the items. It can only be the same location for every item.
   * @returns {MoveItemsAtOnce} the move that will change the location of the items when executed
   */
  moveItemsAtOnce<Id = any, Rotation = any>(location: Partial<Location<P, L, Id, Rotation>>): MoveItemsAtOnce<P, M, L> {
    const move: MoveItemsAtOnce<P, M, L> = {
      kind: MoveKind.ItemMove,
      type: ItemMoveType.MoveAtOnce,
      itemType: this.type,
      indexes: this.entries.map(([index]) => index),
      location
    }

    return this.process([move])[0]
  }

  /**
   * Prepare a move that will select current first item in this material instance
   *
   * @param {number | undefined} quantity Optional: for items with a quantity, the number of items to select. If undefined, the item is completely selected.
   * @returns {SelectItem} the move that will select the item (or a part of its quantity) when executed
   */
  selectItem(quantity?: number): SelectItem<M> {
    switch (this.length) {
      case 0:
        throw new Error('You are trying to select an item that does not exists')
      case 1:
        return this.selectItems(quantity)[0]
      default:
        return this.limit(1).selectItems(quantity)[0]
    }
  }

  /**
   * Prepare a move that will select all the items in this material instance
   *
   * @param {number | undefined} quantity Optional: for items with a quantity, the number of items to select. If undefined, the items are completely selected.
   * @returns {SelectItem[]} the moves that will select the items (or a part of their quantity) when executed
   */
  selectItems(quantity?: number): SelectItem<M>[] {
    return this.process(this.entries.map(entry => {
      const move: SelectItem<M> = {
        kind: MoveKind.ItemMove,
        type: ItemMoveType.Select,
        itemType: this.type,
        itemIndex: entry[0]
      }
      if (quantity) move.quantity = quantity
      return move
    }))
  }

  /**
   * Prepare a move that will unselect current first item in this material instance
   *
   * @param {number | undefined} quantity Optional: for items with a quantity, the number of items to unselect. If undefined, the item is completely unselected.
   * @returns {SelectItem} the move that will unselect the item (or a part of its quantity) when executed
   */
  unselectItem(quantity?: number): SelectItem<M> {
    switch (this.length) {
      case 0:
        throw new Error('You are trying to select an item that does not exists')
      case 1:
        return this.unselectItems(quantity)[0]
      default:
        return this.limit(1).unselectItems(quantity)[0]
    }
  }

  /**
   * Prepare a move that will unselect all the items in this material instance
   *
   * @param {number | undefined} quantity Optional: for items with a quantity, the number of items to unselect. If undefined, the items are completely unselected.
   * @returns {SelectItem[]} the moves that will unselect the items (or a part of their quantity) when executed
   */
  unselectItems(quantity?: number): SelectItem<M>[] {
    return this.process(this.entries.map(entry => {
      const move: SelectItem<M> = {
        kind: MoveKind.ItemMove,
        type: ItemMoveType.Select,
        itemType: this.type,
        itemIndex: entry[0],
        selected: false
      }
      if (quantity) move.quantity = quantity
      return move
    }))
  }

  /**
   * Prepare a move that will rotate current first item in this material instance.
   * This function creates a {@link MoveItem} but copies the existing location values, only replacing the rotation property.
   *
   * @param {string | number | boolean | Record | function | undefined} arg Value of the rotation to give to the item.
   * In case of a function, process the value based on the item state.
   * @returns {MoveItem} the move that will rotate the item when executed
   */
  rotateItem<R extends string | number | boolean | Record<string, any> | undefined>(
    arg?: R | ((item: MaterialItem<P, L>) => R)
  ): MoveItem<P, M, L> {
    switch (this.length) {
      case 0:
        throw new Error('You are trying to rotate an item that does not exists')
      case 1:
        return this.rotateItems(arg)[0]
      default:
        return this.limit(1).rotateItems(arg)[0]
    }
  }

  /**
   * Prepare a move that will rotate all the items in this material instance.
   * This function creates an array of {@link MoveItem} but copies the existing locations values, only replacing the rotation property.
   *
   * @param {string | number | boolean | Record | function | undefined} arg Value of the rotation to give to the item.
   * In case of a function, process the value based on the item state.
   * @returns {MoveItem[]} the moves that will rotate the item when executed
   */
  rotateItems<R extends string | number | boolean | Record<string, any> | undefined>(
    arg?: R | ((item: MaterialItem<P, L>) => R | undefined)
  ): MoveItem<P, M, L>[] {
    return this.moveItems(item => {
      const rotation = typeof arg === 'function' ? arg(item) : arg
      const { rotation: oldRotation, ...location } = item.location
      return rotation !== undefined ? ({ ...location, rotation }) : location
    })
  }

  /**
   * Prepare a move that will shuffle all the items in the current material instance
   * @returns {Shuffle} the move that shuffle the items when executed
   */
  shuffle(): Shuffle<M> {
    if (process.env.NODE_ENV === 'development' && this.entries.some(e => !isSameLocationArea(e[1].location, this.entries[0][1].location))) {
      console.warn('Calling shuffle on items with different location areas might be a mistake.')
    }
    return this.process([{
      kind: MoveKind.ItemMove,
      type: ItemMoveType.Shuffle,
      itemType: this.type,
      indexes: this.entries.map(entry => entry[0])
    }])[0]
  }

  /**
   * Prepare a move that will roll the current first item in this material instance. See {@link RollItem}.
   *
   * @param {Location | function} location The new location of the item. It can be a function to process the location based on the item current state.
   * @returns {RollItem} the move that rolls the item when executed
   */
  rollItem(location?: Location<P, L> | ((item: MaterialItem<P, L>) => Location<P, L>)): RollItem<P, M, L> {
    switch (this.length) {
      case 0:
        throw new Error('You are trying to roll an item that does not exists')
      case 1:
        return this.rollItems(location)[0]
      default:
        return this.limit(1).rollItems(location)[0]
    }
  }

  /**
   * Prepare a move that will roll all the items in this material instance. See {@link RollItem}.
   *
   * @param {Location | function} location The new location of the items. It can be a function to process the location based on each item current state.
   * @returns {RollItem[]} the moves that rolls the items when executed
   */
  rollItems(location: Location<P, L> | ((item: MaterialItem<P, L>) => Location<P, L>) = (item: MaterialItem<P, L>) => item.location): RollItem<P, M, L>[] {
    const getLocation = typeof location === 'function' ? location : () => location
    return this.process(this.entries.map(entry => {
      const location = getLocation(entry[1])
      return ({
        kind: MoveKind.ItemMove,
        type: ItemMoveType.Roll,
        itemType: this.type,
        itemIndex: entry[0],
        location
      })
    }))
  }

  /**
   * Return a new {@link MaterialDeck} helper class, to deal cards easily.
   *
   * @param selector The sort to apply on the deck. See {@link sort}. Defaults to -item.location.x
   */
  deck(selector: (item: MaterialItem<P, L>) => number = item => -item.location.x!) {
    return new MaterialDeck(this.type, this.items, this.processMove, this.entries).sort(selector)
  }

  /**
   * Return a new {@link MaterialMoney} helper class, to deal with moving money units easily.
   *
   * @param units The different units that exists in stock to count this money
   */
  money<Unit extends number>(units: Unit[]) {
    return new MaterialMoney(this.type, units, this.items, this.processMove, this.entries)
  }
}
