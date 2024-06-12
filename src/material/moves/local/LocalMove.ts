import { CloseHelpDisplay, DisplayHelp } from './DisplayHelp'
import { DropItem } from './DropItem'
import { SetTutorialStep } from './SetTutorialStep'
import { CloseTutorialPopup } from './CloseTutorialPopup'

export type LocalMove<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  = DisplayHelp<Player, MaterialType, LocationType>
  | CloseHelpDisplay
  | DropItem<MaterialType>
  | SetTutorialStep
  | CloseTutorialPopup

export enum LocalMoveType {
  DisplayHelp, CloseHelpDisplay, DropItem, SetTutorialStep, CloseTutorialPopup
}