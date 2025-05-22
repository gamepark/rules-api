import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'
import sumBy from 'lodash/sumBy'
import { Location } from '../location'
import { ItemMove } from '../moves'
import { ItemEntry, Material } from './index'
import { MaterialItem } from './MaterialItem'
import { MaterialMutator } from './MaterialMutator'

/**
 * This subclass of {@link Material} is design to handle counting and moving Money with different units: coins of 5 and 1 for instance.
 * It also keeps track of how much money is left after spending moves are create so that it is easy to spend money multiple time at once,
 * without risking spending the same coins twice because the moves are no immediately executed.
 */
export class MaterialMoney<P extends number = number, M extends number = number, L extends number = number, Unit extends number = number>
  extends Material<P, M, L> {
  private pendingMoves: ItemMove<P, M, L>[] = []

  /**
   * Construct a new Material Money helper instance
   * @param {number} type Type of items this instance will work on
   * @param {MaterialItem[]} items The complete list of items of this type in current game state.
   * @param {number[]} units The different units that exists in stock to count this money
   * @param {ItemEntry[]} entries The list of items to work on. Each entry consists of an array with the index of the item, and the item
   * @param {function} processMove if provided, this function will be executed on every move created with this instance
   */
  constructor(
    readonly type: M,
    public units: Unit[],
    protected items: MaterialItem<P, L>[] = [],
    protected readonly processMove?: (move: ItemMove<P, M, L>) => void,
    public entries: ItemEntry<P, L>[] = Array.from(items.entries()).filter(entry => entry[1].quantity !== 0)
  ) {
    super(type, items, processMove, entries)
    if (this.units[0] === 1) {
      this.units = [...units]
      this.units.sort((a, b) => b - a) // Sort units from highest to 1
    }
    if (this.units[this.units.length - 1] !== 1) console.warn('Money without 1 in the possible values will produce unexpected outcomes')
  }

  /**
   * Helper function to return a new instance of the same class (works also for children class)
   * @param {ItemEntry[]} entries Filtered entries for the new class
   * @returns {this} the new Material instance
   * @protected
   */
  protected new(entries: ItemEntry<P, L>[]): this {
    const Class = this.constructor as new (type: M, units: Unit[], items: MaterialItem<P, L>[], processMove?: (move: ItemMove<P, M, L>) => void, entries?: ItemEntry<P, L>[]) => this
    return new Class(this.type, this.units, this.items, this.processMove, entries)
  }

  /**
   * We need to apply the pending moves before any filtering is done to get the right count for instance.
   */
  filter<Id extends string | number | Record<string, any> | undefined>(predicate: (item: MaterialItem<P, L, Id>, index: number) => boolean): this {
    this.applyPendingMoves()
    return super.filter(predicate)
  }

  /**
   * Count the total value of a material instance
   * @returns the sum of each item id multiplied by its quantity
   */
  get count(): number {
    this.applyPendingMoves()
    return sumBy(this.getItems<Unit>(), item => (item.id ?? 1) * (item.quantity ?? 1))
  }

  /**
   * Create an amount of Money and put it in given location
   * @param amount Amount to gain
   * @param location The location to filter material onto, and to create new items in
   * @returns the moves that need to be played to perform the operation
   */
  addMoney(amount: number, location: Location<P, L>): ItemMove<P, M, L>[] {
    if (amount === 0) return []
    if (amount < 0) return this.removeMoney(-amount, location)
    const moves: ItemMove<P, M, L>[] = []
    const gainMap = this.getGainMap(amount)
    for (const unit of this.units) {
      if (gainMap[unit] > 0) {
        moves.push(this.createItem({ id: unit, location, quantity: gainMap[unit] }))
      }
    }
    this.pendingMoves.push(...moves)
    return moves
  }

  /**
   * Remove an amount of Money from given location
   * @param amount Amount to spend
   * @param location The location to filter material onto, and to create new items in
   * @returns the moves that need to be played to perform the operation
   */
  removeMoney(amount: number, location: Location<P, L>): ItemMove<P, M, L>[] {
    if (amount === 0) return []
    if (amount < 0) return this.addMoney(-amount, location)
    this.applyPendingMoves()
    if (this.entries.some(([, item]) => !isEqual(item.location, location))) {
      return this.location(l => isEqual(l, location)).removeMoney(amount, location)
    }
    const moves: ItemMove<P, M, L>[] = []
    const spendMap = this.getSpendMap(amount)
    for (const unit of this.units) {
      if (spendMap[unit] < 0) {
        moves.push(this.id(unit).deleteItem(-spendMap[unit]))
      } else if (spendMap[unit] > 0) {
        moves.push(this.createItem({ id: unit, location, quantity: spendMap[unit] }))
      }
    }
    this.pendingMoves.push(...moves)
    return moves
  }

  /**
   * Move an amount of money from a place to another place. It searches after the easiest way to do it, making money with the bank only if necessary.
   * @param origin Location to remove money from
   * @param target Location to move money to
   * @param amount Amount of money to transfer
   * @returns the moves that need to be played to perform the operation
   */
  moveMoney(origin: Location<P, L>, target: Location<P, L>, amount: number): ItemMove<P, M, L>[] {
    if (amount === 0) return []
    if (amount < 0) return this.moveMoney(target, origin, -amount)
    this.applyPendingMoves()
    const moves: ItemMove<P, M, L>[] = []
    const originMoney = this.location(l => isEqual(l, origin))
    const targetMoney = this.location(l => isEqual(l, target))
    const originDelta = originMoney.getSpendMap(amount)
    const targetDelta = targetMoney.getGainMap(amount)
    for (const unit of this.units) {
      if (originDelta[unit] < 0) {
        while (targetDelta[unit] < -originDelta[unit]) { // try to make money for 1 unit with lower units
          const lowerUnits = this.units.slice(this.units.indexOf(unit) + 1)
          const targetResultDelta = targetMoney.getSpendMap(unit)
          const valueSpent = sumBy(lowerUnits, unit => -targetResultDelta[unit] * unit)
          if (valueSpent === unit && lowerUnits.every(lowerUnit => targetResultDelta[lowerUnit] < 0)) {
            targetDelta[unit]++
            for (const lowerUnit of lowerUnits) {
              targetDelta[lowerUnit] += targetResultDelta[lowerUnit]
            }
          } else break
        }
        const moveAmount = Math.min(-originDelta[unit], targetDelta[unit])
        targetDelta[unit] -= moveAmount
        const originMaterialUnit = originMoney.id(unit)
        if (moveAmount > 0) {
          moves.push(originMaterialUnit.moveItem(target, moveAmount))
        }
        if (moveAmount < -originDelta[unit]) {
          moves.push(originMaterialUnit.deleteItem(-originDelta[unit] - moveAmount))
        }
      } else if (originDelta[unit] > 0) {
        if (targetDelta[unit] < 0) {
          moves.push(targetMoney.id(unit).moveItem(origin, -targetDelta[unit]))
        } else {
          moves.push(originMoney.createItem({ id: unit, location: origin, quantity: originDelta[unit] }))
        }
      }
      if (targetDelta[unit] > 0) {
        moves.push(targetMoney.createItem({ id: unit, location: target, quantity: targetDelta[unit] }))
      }
    }
    this.pendingMoves.push(...moves)
    return moves
  }

  /**
   * Return the best way to gain an amount, prioritizing the highest unit values
   * @param amount Amount to gain, default 1
   * @returns the record of coins to earn (only positive values)
   */
  private getGainMap(amount: number): Record<Unit, number> {
    const map = mapValues(keyBy(this.units), _ => 0)
    for (const unit of this.units) {
      map[unit] = Math.floor(amount / unit)
      amount %= unit
    }
    return map
  }

  /**
   * Return the best way to spend an amount of owned units, prioritizing the smallest unit values
   * @param amount Amount to gain, default 1
   * @returns the record of coins to give away and eventually take (positive and negative values)
   */
  private getSpendMap(amount: number): Record<Unit, number> {
    const owned = mapValues(keyBy(this.units), unit => this.id(unit).getQuantity())
    const map = mapValues(keyBy(this.units), _ => 0)
    for (let _ = 0; _ < amount; _++) {
      for (let i = this.units.length - 1; i >= 0; i--) {
        const unit = this.units[i]
        if (owned[unit] + map[unit] > 0) {
          map[unit]--
          if (unit > 1) {
            let rest = unit - 1
            for (const lowerUnit of this.units.slice(i + 1)) {
              if (lowerUnit <= rest) {
                map[lowerUnit] += Math.floor(rest / lowerUnit)
                rest -= rest % lowerUnit
              }
            }
          }
          break
        }
      }
    }
    return map
  }

  /**
   * Mutate the entries to get the state after
   * @private
   */
  private applyPendingMoves() {
    if (!this.pendingMoves.length) return
    if (this.items.some((item, index) => item.quantity !== 0 && !this.entries.some(entry => entry[0] === index))) {
      console.warn('MaterialMoney cannot track the state of the items on filtered instances, the filter will be cancelled')
    }
    this.items = cloneDeep(this.items)
    const mutator = new MaterialMutator(this.type, this.items)
    while (this.pendingMoves.length > 0) {
      mutator.applyMove(this.pendingMoves.shift()!)
    }
    this.entries = Array.from(this.items.entries()).filter(entry => entry[1].quantity !== 0)
  }
}
