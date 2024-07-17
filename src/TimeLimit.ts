import { Rules } from './Rules'

/**
 * In games played in real time with a time limit, players start with an amount of time, and more time is added every time it is their turn to play.
 * Players can be expelled after some time (-1 minute).
 * This interface allows to control how much extra time is given to players every time it is their turn to play.
 *
 * Beginner have up to x1.5 more thinking time, so the time given here must be for "experienced" players.
 */
export interface TimeLimit<Game, Move = string, PlayerId = number> extends Rules<Game, Move, PlayerId> {
  /**
   * Amount of time given to a player everytime it is their turn to play.
   * @param playerId Id of the player, if you want to give different time depending on the id for asymmetric games.
   * @return number of seconds to add to the player's clock
   */
  giveTime(playerId: PlayerId): number

  /**
   * Amount of time given to a player before the game begins. Default value is 2 minutes.
   * @param playerId Id of the player, if you want to give different time depending on the id for asymmetric games.
   * @return starting amount of seconds for each player when the game starts
   */
  startingTime?(playerId: PlayerId): number
}

/**
 * Type guard for {@link TimeLimit} interface
 * @param rules Rules of the game
 * @returns true if rules implements {@link TimeLimit}
 */
export function hasTimeLimit<Game, Move, PlayerId>(rules: Rules<Game, Move, PlayerId>): rules is TimeLimit<Game, Move, PlayerId> {
  return typeof (rules as TimeLimit<Game, Move, PlayerId>).giveTime === 'function'
}
