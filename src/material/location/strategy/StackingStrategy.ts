import { Material, MaterialItem } from '../../items'
import { LocationStrategy } from './LocationStrategy'
import { PositiveSequenceStrategy } from './PositiveSequenceStrategy'

/**
 * This strategy will only work on items with the same location.x and location.y, to maintain a positive sequence on location.z,
 * for example to easily stack scoring pawns when they are on the same spot.
 */
export class StackingStrategy implements LocationStrategy {
  private delegate = new PositiveSequenceStrategy('z')

  addItem(material: Material, item: MaterialItem) {
    this.delegate.addItem(material.location(l => l.x === item.location.x && l.y === item.location.y), item)
  }

  moveItem(material: Material, item: MaterialItem, index: number) {
    const itemBefore = material.getItem(index)
    if (itemBefore.location.x === item.location.x && itemBefore.location.y === itemBefore.location.y) {
      this.delegate.moveItem(material, item, index)
    } else {
      this.delegate.removeItem(material.index(i => i !== index).location(l => l.x === itemBefore.location.x && l.y === itemBefore.location.y), itemBefore)
      this.delegate.addItem(material.location(l => l.x === item.location.x && l.y === item.location.y), item)
    }
  }

  removeItem(material: Material, item: MaterialItem) {
    this.delegate.removeItem(material.location(l => l.x === item.location.x && l.y === item.location.y), item)
  }
}