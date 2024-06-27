import { CloseTutorialPopup } from './CloseTutorialPopup'
import { DisplayHelp } from './DisplayHelp'
import { DropItem } from './DropItem'
import { SetTutorialStep } from './SetTutorialStep'

export type LocalMove<Player extends number = number, MaterialType extends number = number, LocationType extends number = number>
  = DisplayHelp<Player, MaterialType, LocationType>
  | DropItem<MaterialType>
  | SetTutorialStep
  | CloseTutorialPopup

export enum LocalMoveType {
  DisplayHelp = 1, DropItem, SetTutorialStep, CloseTutorialPopup
}