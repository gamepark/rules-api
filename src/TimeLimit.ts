import { Rules } from './Rules'

export interface TimeLimit<Game, Move = string, PlayerId = number> extends Rules<Game, Move, PlayerId> {
  /**
   * Amount of time given to a player everytime it is their turn to play.
   * @param playerId Id of the player, if you want to give different time depending on the id for asymmetric games.
   */
  giveTime(playerId: PlayerId): number

  /**
   * Amount of time given to a player before the game begins. Default value is 2 minutes.
   * @param playerId Id of the player, if you want to give different time depending on the id for asymmetric games.
   */
  startingTime?(playerId: PlayerId): number
}

export function hasTimeLimit<Game, Move, PlayerId>(rules: Rules<Game, Move, PlayerId>): rules is TimeLimit<Game, Move, PlayerId> {
  return typeof (rules as TimeLimit<Game, Move, PlayerId>).giveTime === 'function'
}

export enum GameSpeed {Disabled = 'Disabled', RealTime = 'RealTime'}