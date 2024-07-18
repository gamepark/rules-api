import { MaterialItem } from './items'
import { DisplayedItem, HelpDisplay } from './moves'
import { RuleStep } from './rules'
import { TutorialState } from './tutorial'

export type MaterialGame<Player extends number = number,
  MaterialType extends number = number,
  LocationType extends number = number> = {
  players: Player[]
  items: Partial<Record<MaterialType, MaterialItem<Player, LocationType>[]>>
  rule?: RuleStep<Player>
  memory: Record<keyof any, any>
  helpDisplay?: HelpDisplay<Player, MaterialType, LocationType>
  droppedItem?: DisplayedItem<MaterialType>
  tutorial?: TutorialState
}
