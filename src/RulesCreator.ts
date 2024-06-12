import { Rules } from './Rules'

export interface RulesCreator<Game = any, Move = any, Player = number, Options = any> {
  new(state: Game, client?: { player?: Player }): Rules<Game, Move, Player>

  new(options: Options): Rules<Game, Move, Player> // TODO: we should be able to remove this construction now that GameSetup & Rules are distinct classes
}
