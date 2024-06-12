/**
 * A material item is a piece of material in a game
 */
import { Location } from '../location'

export type MaterialItem<P extends number = number, L extends number = number, Id = any> = {
  id?: Id
  quantity?: number
  location: Location<P, L>
  selected?: number | boolean
}
