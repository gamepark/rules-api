import isEqual from 'lodash/isEqual'
import maxBy from 'lodash/maxBy'
import minBy from 'lodash/minBy'
import orderBy from 'lodash/orderBy'
import sumBy from 'lodash/sumBy'
import { Location } from '../location'
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
import { MaterialItem } from './MaterialItem'

type ItemEntry<P extends number = number, L extends number = number> = [number, MaterialItem<P, L>]

export class Material<P extends number = number, M extends number = number, L extends number = number> {

  constructor(
    readonly type: M,
    readonly entries: ItemEntry<P, L>[],
    protected readonly processMove?: (move: ItemMove<P, M, L>) => void) {
  }

  protected new(entries: ItemEntry<P, L>[]): this {
    const Class = this.constructor as new (type: M, entries: ItemEntry<P, L>[], processMove?: (move: ItemMove<P, M, L>) => void) => this
    return new Class(this.type, entries, this.processMove)
  }

  getItems(): MaterialItem<P, L>[]
  getItems<Id = any>(predicate?: (item: MaterialItem<P, L, Id>) => boolean): MaterialItem<P, L, Id>[]
  getItems<Id = any>(predicate?: (item: MaterialItem<P, L, Id>) => boolean): MaterialItem<P, L, Id>[] {
    const items = this.entries.map(entry => entry[1])
    return predicate ? items.filter(predicate) : items
  }

  getItem<Id = any>(index: number): MaterialItem<P, L, Id> | undefined
  getItem<Id = any>(predicate?: (item: MaterialItem<P, L, Id>) => boolean): MaterialItem<P, L, Id> | undefined
  getItem<Id = any>(arg?: number | ((item: MaterialItem<P, L, Id>) => boolean)): MaterialItem<P, L, Id> | undefined {
    if (typeof arg === 'number') {
      const entry = this.entries.find(entry => entry[0] === arg)
      return entry ? entry[1] : undefined
    } else if (typeof arg === 'function') {
      const entries = this.entries.filter(([, item]) => arg(item))
      return entries.length ? entries[0][1] : undefined
    } else {
      return this.entries.length ? this.entries[0][1] : undefined
    }
  }

  getIndex(): number {
    return this.entries[0]?.[0] ?? -1
  }

  getIndexes(): number[] {
    return this.entries.map(entry => entry[0])
  }

  index(arg: number | ((index: number) => boolean)): Material<P, M, L> {
    if (typeof arg === 'function') {
      return this.filter((_, index) => arg(index))
    } else {
      const item = this.entries.find(([index]) => index === arg)
      return this.new(item ? [item] : [])
    }
  }

  indexes(indexes: number[]): Material<P, M, L> {
    const items = this.entries.filter(([i]) => indexes.includes(i))
    return this.new(items)
  }

  get length(): number {
    return this.entries.length
  }

  getQuantity(): number {
    return sumBy(this.entries, ([, item]) => item.quantity ?? 1)
  }

  filter(predicate: (item: MaterialItem<P, L>, index: number) => boolean): this {
    return this.new(this.entries.filter(([index, item]) => predicate(item, index)))
  }

  id<Id extends string | number | Record<string, any> | undefined>(arg?: Id | ((id: Id) => boolean)): this {
    return this.filter(({ id }) => typeof arg === 'function' ? arg(id) : isEqual(id, arg))
  }

  location(arg: L | ((location: Location<P, L>) => boolean)): this {
    return this.filter(({ location }) => typeof arg === 'function' ? arg(location) : location.type === arg)
  }

  rotation<R extends string | number | boolean | Record<string, any> | undefined>(arg?: R | ((rotation: R) => boolean)): this {
    return this.location(({ rotation }) => typeof arg === 'function' ? arg(rotation) : isEqual(rotation, arg))
  }

  player(arg?: P | ((player?: P) => boolean)): this {
    return this.location(({ player }) => typeof arg === 'function' ? arg(player) : player === arg)
  }

  locationId<Id extends string | number | boolean | Record<string, any> | undefined>(arg: Id | ((id: Id) => boolean)): this {
    return this.location(({ id }) => typeof arg === 'function' ? arg(id) : isEqual(id, arg))
  }

  parent(arg?: number | ((parent?: number) => boolean)): this {
    return this.location(({ parent }) => typeof arg === 'function' ? arg(parent) : isEqual(parent, arg))
  }

  minBy(selector: (item: MaterialItem<P, L>) => number): this {
    const min = minBy(this.entries, entry => selector(entry[1]))
    return this.new(min ? [min] : [])
  }

  sort(...selectors: ((item: MaterialItem<P, L>) => number)[]): this {
    let orderedItems = orderBy(this.entries, selectors.map((s) => (entry) => s(entry[1])))
    return this.new(orderedItems)
  }

  limit(count: number): this {
    return this.new(this.entries.slice(0, count))
  }

  maxBy(selector: (item: MaterialItem<P, L>) => number): this {
    const max = maxBy(this.entries, entry => selector(entry[1]))
    return this.new(max ? [max] : [])
  }

  selected(selected: number | boolean = true) {
    return this.filter(item => (item.selected ?? false) === selected)
  }

  private process<T extends ItemMove<P, M, L>>(moves: T[]): T[] {
    if (this.processMove) {
      for (const move of moves) {
        this.processMove(move)
      }
    }
    return moves
  }

  createItem(item: MaterialItem<P, L>): CreateItem<P, M, L> {
    return this.createItems([item])[0]
  }

  createItems(items: MaterialItem<P, L>[]): CreateItem<P, M, L>[] {
    return this.process(items.map(item => ({
      kind: MoveKind.ItemMove,
      type: ItemMoveType.Create,
      itemType: this.type,
      item
    })))
  }

  createItemsAtOnce(items: MaterialItem<P, L>[]): CreateItemsAtOnce<P, M, L> {
    const move: CreateItemsAtOnce<P, M, L> = { kind: MoveKind.ItemMove, type: ItemMoveType.CreateAtOnce, itemType: this.type, items }
    return this.process([move])[0]
  }

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

  deleteItemsAtOnce(): DeleteItemsAtOnce<M> {
    const moves: DeleteItemsAtOnce<M> = { kind: MoveKind.ItemMove, type: ItemMoveType.DeleteAtOnce, itemType: this.type, indexes: this.getIndexes() }
    return this.process([moves])[0]
  }

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

  moveItem(location: ((item: MaterialItem<P, L>) => Location<P, L>) | Location<P, L>, quantity?: number): MoveItem<P, M, L> {
    switch (this.length) {
      case 0:
        throw new Error('You are trying to move an item that does not exists')
      case 1:
        return this.moveItems(location, quantity)[0]
      default:
        return this.limit(1).moveItems(location, quantity)[0]
    }
  }

  moveItems(location: ((item: MaterialItem<P, L>, index: number) => Partial<Location<P, L>>) | Partial<Location<P, L>>, quantity?: number): MoveItem<P, M, L>[] {
    const getLocation = typeof location === 'function' ? location : () => location
    return this.process(this.entries.map(entry => {
      const location = getLocation(entry[1], entry[0])
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

  moveItemsAtOnce(location: Partial<Location<P, L>>): MoveItemsAtOnce<P, M, L> {
    const move: MoveItemsAtOnce<P, M, L> = {
      kind: MoveKind.ItemMove,
      type: ItemMoveType.MoveAtOnce,
      itemType: this.type,
      indexes: this.entries.map(([index]) => index),
      location
    }

    return this.process([move])[0]
  }

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

  rotateItems<R extends string | number | boolean | Record<string, any> | undefined>(
    arg?: R | ((item: MaterialItem<P, L>) => R | undefined)
  ): MoveItem<P, M, L>[] {
    return this.moveItems(item => {
      const rotation = typeof arg === 'function' ? arg(item) : arg
      const { rotation: oldRotation, ...location } = item.location
      return rotation !== undefined ? ({ ...location, rotation }) : location
    })
  }

  shuffle(): Shuffle<M> {
    return this.process([{
      kind: MoveKind.ItemMove,
      type: ItemMoveType.Shuffle,
      itemType: this.type,
      indexes: this.entries.map(entry => entry[0])
    }])[0]
  }

  rollItem(location?: ((item: MaterialItem<P, L>) => Location<P, L>) | Location<P, L>): RollItem<P, M, L> {
    switch (this.length) {
      case 0:
        throw new Error('You are trying to roll an item that does not exists')
      case 1:
        return this.rollItems(location)[0]
      default:
        return this.limit(1).rollItems(location)[0]
    }
  }

  rollItems(location: ((item: MaterialItem<P, L>) => Location<P, L>) | Location<P, L> = (item: MaterialItem<P, L>) => item.location): RollItem<P, M, L>[] {
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

  deck(selector: (item: MaterialItem<P, L>) => number = item => -item.location.x!) {
    return new MaterialDeck(this.type, this.entries, this.processMove).sort(selector)
  }
}

export class MaterialDeck<P extends number = number, M extends number = number, L extends number = number> extends Material<P, M, L> {
  deal(arg: ((item: MaterialItem<P, L>) => Location<P, L>) | Location<P, L>, quantity: number = 1) {
    return this.new(this.entries.splice(0, quantity)).moveItems(arg)
  }

  dealOne(arg: ((item: MaterialItem<P, L>) => Location<P, L>) | Location<P, L>): MoveItem<P, M, L> {
    const deal = this.deal(arg)
    if (deal.length === 0) {
      throw new Error('You are trying to deal one card from an empty deck')
    }
    return deal[0]
  }

  dealAtOnce(arg: Location<P, L>, quantity: number = 1) {
    return this.new(this.entries.splice(0, quantity)).moveItemsAtOnce(arg)
  }
}
