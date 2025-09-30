import { MaterialItem } from './items'
import { DisplayedItem, HelpDisplay } from './moves'
import { RuleStep } from './rules'
import { TutorialState } from './tutorial'

/**
 * The data structure of a game implemented with the {@link MaterialRules} approach.
 * The game state should not be manipulated directly, but using the {@link MaterialMove} and {@link MaterialRulesPart} utilities.
 *
 * @property players Array of the identifiers of the players, ordered by their position around the table
 * @property items All the {@link MaterialItem}s in the game. An item is identified by its type and its index in the array: items[type][index]
 * @property rule The current step in the rules. See {@link MaterialRules.rules} and {@link RuleStep}
 * @property memory A key-value record of free values when some state do not fit in items or rule properties. See {@link GameMemory} and {@link PlayerMemory}.
 * @property helpDisplay Current help dialog opened on the client side
 * @property view Current view displayed on the client side
 * @property droppedItems Items that were just dropped on the client side
 * @property tutorial The {@link TutorialState}, only set for tutorial games
 * @property transientItems Items modified locally with transient moves that need to be kept as they are in case of an undo
 */
export type MaterialGame<Player extends number = number,
  MaterialType extends number = number,
  LocationType extends number = number,
  RuleId extends number = number,
  View extends number = number> = {
  players: Player[]
  items: Partial<Record<MaterialType, MaterialItem<Player, LocationType>[]>>
  rule?: RuleStep<Player, RuleId>
  memory: Record<keyof any, any>
  helpDisplay?: HelpDisplay<Player, MaterialType, LocationType>
  view?: View
  droppedItems?: DisplayedItem<MaterialType>[]
  tutorial?: TutorialState<Player, MaterialType, LocationType, RuleId>
  transientItems?: Partial<Record<MaterialType, number[]>>
}
