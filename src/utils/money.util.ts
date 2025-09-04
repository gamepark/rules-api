import { forEachRight, isEqual, mapValues, sumBy } from 'es-toolkit'
import { keyBy } from 'es-toolkit/compat'
import { Location, Material, MaterialMove } from '../material'

/**
 * This class help manipulate any kind of money with arbitrary unit values, like a set of coins of values 1, 2, 5, 10 for instance.
 * @deprecated use {@link MaterialMoney} instead
 */
export class Money<Unit extends number = number, P extends number = number, M extends number = number, L extends number = number> {
  constructor(private units: Unit[]) {
    this.units.sort((a, b) => a - b)
  }

  /**
   * Count the total value of a material instance
   * @param material The material to count
   * @returns the sum of each item id multiplied by its quantity
   */
  count(material: Material<P, M, L>) {
    return sumBy(material.getItems<Unit>(), item => (item.id ?? 1) * (item.quantity ?? 1))
  }

  /**
   * Perform an operation of adding or removing an amount from a location by creating or deleting items
   * @param material The material instance
   * @param location The location to filter material onto, and to create new items in
   * @param amount Amount to create or delete
   * @returns the moves that need to be played to perform the operation
   */
  createOrDelete(material: Material<P, M, L>, location: Location<P, L>, amount: number): MaterialMove<P, M, L>[] {
    material = material.location(l => isEqual(l, location))
    const moves: MaterialMove<P, M, L>[] = []
    const delta = amount > 0 ? this.gain(amount) : this.spend(mapValues(keyBy(this.units), unit => material.id(unit).getQuantity()), -amount)
    for (let index = this.units.length - 1; index >= 0; index--) {
      const unit = this.units[index]
      if (delta[unit] < 0) {
        moves.push(material.id(unit).deleteItem(-delta[unit]))
      } else if (delta[unit] > 0) {
        moves.push(material.createItem({ id: unit, location, quantity: delta[unit] }))
      }
    }
    return moves
  }

  /**
   * Move an amount of money from a place to another place. It searches after the easiest way to do it, making money with the bank only if necessary.
   * @param material Material instance for the money (needs to be unfiltered)
   * @param origin Location to remove money from
   * @param target Location to move money to
   * @param amount Amount of money to transfer
   * @returns the moves that need to be played to perform the operation
   */
  moveAmount(material: Material<P, M, L>, origin: Location<P, L>, target: Location<P, L>, amount: number): MaterialMove<P, M, L>[] {
    if (!amount) return []
    if (amount < 0) return this.moveAmount(material, target, origin, -amount)
    const moves: MaterialMove<P, M, L>[] = []
    const originMaterial = material.location(l => isEqual(l, origin))
    const targetMaterial = material.location(l => isEqual(l, target))
    const originUnits = mapValues(keyBy(this.units), unit => originMaterial.id(unit).getQuantity())
    const originDelta = this.spend(originUnits, amount)
    const targetDelta = this.gain(amount)
    for (let index = this.units.length - 1; index >= 0; index--) {
      const unit = this.units[index]
      if (originDelta[unit] < 0) {
        while (targetDelta[unit] < -originDelta[unit]) { // try to make money for 1 unit with lower units
          const lowerUnits = this.units.slice(0, this.units.indexOf(unit))
          const targetResult = mapValues(keyBy(lowerUnits), unit => targetMaterial.id(unit).getQuantity() + targetDelta[unit])
          const targetResultDelta = this.spend(targetResult, unit)
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
        const originMaterialUnit = originMaterial.id(unit)
        if (moveAmount > 0) {
          moves.push(originMaterialUnit.moveItem(target, moveAmount))
        }
        if (moveAmount < -originDelta[unit]) {
          moves.push(originMaterialUnit.deleteItem(-originDelta[unit] - moveAmount))
        }
      } else if (originDelta[unit] > 0) {
        if (targetDelta[unit] < 0) {
          moves.push(targetMaterial.id(unit).moveItem(origin, -targetDelta[unit]))
        } else {
          moves.push(material.createItem({ id: unit, location: origin, quantity: originDelta[unit] }))
        }
      }
      if (targetDelta[unit] > 0) {
        moves.push(material.createItem({ id: unit, location: target, quantity: targetDelta[unit] }))
      }
    }
    return moves
  }

  /**
   * Creates a new record indexes by all units, with value equal to 0 for each unit
   */
  get record(): Record<Unit, number> {
    return mapValues(keyBy(this.units), _ => 0)
  }

  /**
   * Return the best way to gain an amount, prioritizing the highest unit values
   * @param amount Amount to gain, default 1
   * @returns the record of coins to earn (only positive values)
   */
  gain(amount: number = 1): Record<Unit, number> {
    const gain = this.record
    forEachRight(this.units, unit => {
      gain[unit] = Math.floor(amount / unit)
      amount %= unit
    })
    return gain
  }

  /**
   * Return the best way to spend an amount of owned units, prioritizing the smallest unit values
   * @param owned Amount of units owned before spending
   * @param amount Amount to gain, default 1
   * @returns the record of coins to give away and eventually take (positive and negative values)
   */
  spend(owned: Record<Unit, number>, amount: number = 1): Record<Unit, number> {
    const delta: Record<Unit, number> = mapValues(owned, _ => 0)
    for (let _ = 0; _ < amount; _++) {
      for (const unit of this.units) {
        if (owned[unit] + delta[unit] > 0) {
          delta[unit]--
          if (unit > 1) {
            let rest = unit - 1
            for (const lowerUnit of this.units.slice(0, this.units.indexOf(unit)).reverse()) {
              if (lowerUnit <= rest) {
                delta[lowerUnit] += Math.floor(rest / lowerUnit)
                rest -= rest % lowerUnit
              }
            }
          }
          break
        }
      }
    }
    return delta
  }
}
