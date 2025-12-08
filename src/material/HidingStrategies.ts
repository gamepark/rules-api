import { MaterialItem } from './items'

/**
 * A Hiding Strategy is a function that takes an item and returns a list of path to hide in the item object.
 * See {@link hideItemId} and {@link hideFront} for 2 hiding strategy frequently used.
 */
export type HidingStrategy<P extends number = number, L extends number = number> = (item: MaterialItem<P, L>) => string[]

/**
 * A Hiding Strategy is a function that takes an item and a player and returns a list of path to hide in the item object.
 * If the player parameter is undefined, the function must return the information to hide from the spectators.
 * See {@link hideItemIdToOthers} and {@link hideFrontToOthers} for 2 HidingSecretsStrategy frequently used.
 */
export type HidingSecretsStrategy<P extends number = number, L extends number = number> = (item: MaterialItem<P, L>, player?: P) => string[]

/**
 * Hiding strategy that removes the item id
 */
export const hideItemId: HidingStrategy = () => ['id']

/**
 * Hiding strategy that removes "id.front" from the item (when we have cards with composite ids, back & front)
 */
export const hideFront: HidingStrategy = () => ['id.front']

/**
 * Hide the item id to all players except the player that is equal to item.location.player.
 * Used to hide cards in a player's hand from others for instance.
 * @param item The item to hide information from
 * @param player The player to hide information to (or the spectator)
 */
export const hideItemIdToOthers = <P extends number = number, L extends number = number>(
  item: MaterialItem<P, L>, player?: P
): string[] => item.location.player === player ? [] : ['id']

/**
 * Hide the item.id.front to all players except the player that is equal to item.location.player.
 * @param item The item to hide information from
 * @param player The player to hide information to (or the spectator)
 */
export const hideFrontToOthers: HidingStrategy = <P extends number = number, L extends number = number>(
  item: MaterialItem<P, L>, player?: P
): string[] => item.location.player === player ? [] : ['id.front']
