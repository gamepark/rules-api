import { CloseTutorialPopup } from './CloseTutorialPopup'
import { DisplayHelp } from './DisplayHelp'
import { DropItem } from './DropItem'
import { SetTutorialStep } from './SetTutorialStep'

/**
 * Common type for all the moves designed to be local (not sent to the server)
 */
export type LocalMove<Player extends number = number, MaterialType extends number = number, LocationType extends number = number, ItemId extends number = number>
  = DisplayHelp<Player, MaterialType, LocationType, ItemId>
  | DropItem<MaterialType>
  | SetTutorialStep
  | CloseTutorialPopup

/**
 * Types of local moves
 */
export enum LocalMoveType {
  DisplayHelp = 1, DropItem, SetTutorialStep, CloseTutorialPopup
}