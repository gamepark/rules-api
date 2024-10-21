import { Location } from '../location'

/**
 * A material item is a piece of material in a game
 *
 * @typeparam P - identifier of a player. Either a number or a numeric enum (eg: PlayerColor)
 * @typeparam L - Numeric enum of the types of location in the game where the material can be located
 * @typeparam Id - Type of id property of the item. Must be JSON serializable.
 *
 * @property id Optional item identifier. Meant to identify the item, but not in a unique way. For example, two identical cards in a game should have the same id.
 * @property quantity Quantity of the item. An item without a quantity will be considered to have a quantity of 1.
 * @property {Location} location Location of the item in the game (in a player's hand, on the table...). See {@link Location}.
 * @property {number | boolean | undefined} selected Flag the item if selected. Items with a quantity can be partially selected using a number of select items.
 */
export type MaterialItem<P extends number = number, L extends number = number, Id = any> = {
  quantity?: number
  location: Location<P, L>
  selected?: number | boolean
} & IfAny<Id, { id?: any }, { id: Id }>

type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N