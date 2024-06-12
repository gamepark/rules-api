import { MaterialItem } from './items'
import { DisplayedItem, HelpDisplay, MaterialMove } from './moves'
import { RuleStep } from './rules'

export type MaterialGame<Player extends number = number,
  MaterialType extends number = number,
  LocationType extends number = number> = {
  players: Player[]
  items: Partial<Record<MaterialType, MaterialItem<Player, LocationType>[]>>
  rule?: RuleStep<Player>
  memory: Record<keyof any, any>
  helpDisplay?: HelpDisplay<Player, MaterialType, LocationType>
  droppedItem?: DisplayedItem<MaterialType>
  tutorialStep?: number
  tutorialPopupClosed?: boolean
  tutorialStepComplete?: boolean
  tutorialInterrupt?: MaterialMove<Player, MaterialType, LocationType>[]
}
