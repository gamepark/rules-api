import { MaterialItem } from '../../items'
import { Location } from '../../location'
import { MoveKind } from '../MoveKind'
import { LocalMoveType } from './LocalMove'

/**
 * Common type for the moves that display a help dialog
 */
export type HelpDisplay<P extends number = number, M extends number = number, L extends number = number, RuleId extends number = number>
  = MaterialHelpDisplay<P, M, L>
  | LocationHelpDisplay<P, L>
  | RulesHelpDisplay<RuleId>

/**
 * Type of help dialogs that can be opened
 */
export enum HelpDisplayType {
  Material = 1, Location, Rules
}

/**
 * Data structure describing a help dialog about a {@link MaterialItem}
 */
export type MaterialHelpDisplay<P extends number = number, M extends number = number, L extends number = number> = {
  type: typeof HelpDisplayType.Material
  itemType: M
  itemIndex?: number
  displayIndex?: number
  item: Partial<MaterialItem<P, L>>
}

/**
 * Data structure describing a help dialog about a {@link Location}
 */
export type LocationHelpDisplay<P extends number = number, L extends number = number> = {
  type: typeof HelpDisplayType.Location
  location: Location<P, L>
}

/**
 * Data structure describing a help dialog about a point in the rules of a game
 */
export type RulesHelpDisplay<RuleId extends number = number> = {
  type: typeof HelpDisplayType.Rules
  ruleId: RuleId
}

/**
 * Move object to display a help dialog
 */
export type DisplayHelp<P extends number = number, M extends number = number, L extends number = number> = {
  kind: MoveKind.LocalMove
  type: typeof LocalMoveType.DisplayHelp
  helpDisplay?: HelpDisplay<P, M, L>
}
