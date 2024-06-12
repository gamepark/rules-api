import { Material, MaterialItem } from '../../items'
import { LocationStrategy } from './LocationStrategy'

/**
 * This strategy help to maintain a consecutive sequence of numbers starting with 0 for items at the same location, for example a deck or a hand of cards
 */
export class PositiveSequenceStrategy<P extends number = number, M extends number = number, L extends number = number> implements LocationStrategy<P, M, L> {
  axis: 'x' | 'y' | 'z'

  constructor(axis: 'x' | 'y' | 'z' = 'x') {
    this.axis = axis
  }

  addItem(material: Material<P, M, L>, item: MaterialItem<P, L>): void {
    const x = item.location[this.axis]
    if (x === undefined) {
      item.location[this.axis] = material.length
    } else {
      for (const item of material.getItems()) {
        const itemX = item.location[this.axis]
        if (itemX !== undefined && itemX >= x) {
          item.location[this.axis]!++
        }
      }
    }
  }

  moveItem(material: Material<P, M, L>, item: MaterialItem<P, L>, index: number): void {
    if (item.location[this.axis] === undefined) {
      item.location[this.axis] = material.length - 1
    }
    const x = material.getItem(index)!.location[this.axis]
    if (x === undefined) return
    const newX = item.location[this.axis]!
    if (x < newX) {
      for (const item of material.getItems()) {
        const itemX = item.location[this.axis]
        if (itemX !== undefined && itemX > x && itemX <= newX) {
          item.location[this.axis]!--
        }
      }
    } else if (newX < x) {
      for (const item of material.getItems()) {
        const itemX = item.location[this.axis]
        if (itemX !== undefined && itemX >= newX && itemX < x) {
          item.location[this.axis]!++
        }
      }
    }
  }

  removeItem(material: Material<P, M, L>, item: MaterialItem<P, L>): void {
    const x = item.location[this.axis]
    if (x === undefined) return
    for (const item of material.getItems()) {
      const itemX = item.location[this.axis]
      if (itemX !== undefined && itemX > x) {
        item.location[this.axis]!--
      }
    }
  }
}