import { Rules } from './Rules'

export interface RulesCreator<Game = any, Move = any, Player = number> {
  new(state: Game, client?: { player?: Player }): Rules<Game, Move, Player>
}
