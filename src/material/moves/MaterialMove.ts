import { RuleMove } from './rules'
import { CustomMove } from './CustomMove'
import { ItemMove, ItemMoveRandomized, ItemMoveView } from './items'
import { LocalMove } from './local'

export type MaterialMove<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> =
  ItemMove<Player, MaterialType, LocationType>
  | RuleMove<Player>
  | CustomMove
  | LocalMove<Player, MaterialType, LocationType>

export type MaterialMoveRandomized<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> =
  | ItemMoveRandomized<Player, MaterialType, LocationType>
  | RuleMove<Player>
  | CustomMove
  | LocalMove<Player, MaterialType, LocationType>

export type MaterialMoveView<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> =
  | ItemMoveView<Player, MaterialType, LocationType>
  | RuleMove<Player>
  | CustomMove
  | LocalMove<Player, MaterialType, LocationType>
