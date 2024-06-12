import { Material, MaterialItem } from '../../items'

export type LocationStrategy<P extends number = number, M extends number = number, L extends number = number> = {
  addItem?(material: Material<P, M, L>, item: MaterialItem<P, L>): void
  moveItem?(material: Material<P, M, L>, item: MaterialItem<P, L>, index: number): void
  removeItem?(material: Material<P, M, L>, item: MaterialItem<P, L>): void
}
