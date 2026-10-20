import { MaterialItem } from '../../items'
import { Location } from '../../location'
import { MoveKind } from '../MoveKind'
import { LocalMoveType } from './LocalMove'

/**
 * Common type for the moves that display a help dialog
 */
export type HelpDisplay<P extends number = number, M extends number = number, L extends number = number, RuleId extends number = number, I = any>
  = MaterialHelpDisplay<P, M, L, I>
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
export type MaterialHelpDisplay<P extends number = number, M extends number = number, L extends number = number, I = any> = {
  type: typeof HelpDisplayType.Material
  itemType: M
  itemIndex?: number
  displayIndex?: number
  item: Partial<MaterialItem<P, L, I>>
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
 * What becomes of the help dialog already displayed when a {@link DisplayHelp} move is played
 */
export enum HelpHistory {
  /**
   * The help displayed is kept in {@link MaterialGame.helpHistory}, so that the player can go back to it.
   * This is the default when a help is displayed over another one, for instance from a button inside a help.
   */
  Keep = 1,
  /**
   * The help displayed is replaced, the history is left unchanged: for instance to browse similar items.
   */
  Replace,
  /**
   * The last help kept in history is displayed again and removed from history. The helpDisplay of the move is ignored.
   */
  Back
}

/**
 * Move object to display a help dialog. Without helpDisplay, the help dialog is closed and its history is cleared.
 */
export type DisplayHelp<P extends number = number, M extends number = number, L extends number = number, R extends number = number, I = any> = {
  kind: MoveKind.LocalMove
  type: typeof LocalMoveType.DisplayHelp
  helpDisplay?: HelpDisplay<P, M, L, R, I>
  history?: HelpHistory
}
