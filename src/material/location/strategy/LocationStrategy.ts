import { Material, MaterialItem } from '../../items'

/**
 * A location strategy modifies the location of items when they are moved, created or deleted,
 * based on the items that already exists in the same location area (see {@link isSameLocationArea}).
 */
export type LocationStrategy<P extends number = number, M extends number = number, L extends number = number> = {
  /**
   * Strategy to apply when an item is added to a location area
   * @param material The material that exists in the same location area before the new item is added
   * @param item The item that is going to be added
   */
  addItem?(material: Material<P, M, L>, item: MaterialItem<P, L>): void

  /**
   * Strategy to apply when an item is moved inside a location area (only x, y, z or rotation changes)
   * @param material The material that exists in the same location area
   * @param item The item that is going to move inside the location area
   * @param index Index of the moved item in the Material
   */
  moveItem?(material: Material<P, M, L>, item: MaterialItem<P, L>, index: number): void

  /**
   * Strategy to apply when an item is moved inside a location area (only x, y, z or rotation changes)
   * @param material The material that remain in the same location area after the item was removed
   * @param item The item that was just removed from the location area, with the state it had before it was removed
   */
  removeItem?(material: Material<P, M, L>, item: MaterialItem<P, L>): void
}
