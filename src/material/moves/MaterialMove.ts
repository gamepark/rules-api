import { RuleMove } from './rules'
import { CustomMove } from './CustomMove'
import { ItemMove, ItemMoveRandomized, ItemMoveView } from './items'
import { LocalMove } from './local'

/**
 * Common type of all the kind of moves that can exists in a game implemented with {@link MaterialRules}
 */
export type MaterialMove<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> =
  ItemMove<Player, MaterialType, LocationType>
  | RuleMove<Player>
  | CustomMove
  | LocalMove<Player, MaterialType, LocationType>

/**
 * A {@link MaterialMove} but after it is randomized (see {@link RandomMove})
 */
export type MaterialMoveRandomized<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> =
  | ItemMoveRandomized<Player, MaterialType, LocationType>
  | RuleMove<Player>
  | CustomMove
  | LocalMove<Player, MaterialType, LocationType>

/**
 * A {@link MaterialMove} but after it is transformed to be sent to players (see {@link HiddenMaterialRules}).
 */
export type MaterialMoveView<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> =
  | ItemMoveView<Player, MaterialType, LocationType>
  | RuleMove<Player>
  | CustomMove
  | LocalMove<Player, MaterialType, LocationType>
