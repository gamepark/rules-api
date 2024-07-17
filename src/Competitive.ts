import { Rules } from './Rules'

/**
 * In a competitive board game, players can be ranked at the end of the game.
 * If the game relies on scores and tie-breakers, implement {@link CompetitiveScore}. Otherwise, implement {@link CompetitiveRank}
 */
export type Competitive<Game = any, Move = any, PlayerId = any> = CompetitiveScore<Game, Move, PlayerId> | CompetitiveRank<Game, Move, PlayerId>

/**
 * Interface for any Competitive game that rank players based on their scores (and potential tie-breakers).
 */
export interface CompetitiveScore<Game = any, Move = any, PlayerId = any> extends Rules<Game, Move, PlayerId> {
  /**
   * Compute the score of a player at the end of the game
   * @param playerId Identifier of a player
   * @returns The score of the player
   */
  getScore(playerId: PlayerId): number

  /**
   * The tie-breaker function if the rules of the game includes it.
   * If players have the same score (see {@link getScore}), this function will be called for both players, with tieBreaker param equals to 1.
   * If successive tie-breakers exists, it will be called as long as necessary with incremental values for tieBreaker, until the function returns undefined
   * @param tieBreaker depth of the tie-breaker
   * @param playerId Identifier of the player
   * @returns the tie-breaker value for this player, or undefined if no tie-breaker exists at this point
   */
  getTieBreaker?(tieBreaker: number, playerId: PlayerId): number | undefined
}

/**
 * Interface to rank players in Competitive games that do not rely exclusively on scores to rank the players when game is over
 */
export interface CompetitiveRank<Game = any, Move = any, PlayerId = any> extends Rules<Game, Move, PlayerId> {
  /**
   * Rank two players when game is over (see {@link Array.sort})
   *
   * @param playerA Player A to compare
   * @param playerB player B to compare
   * @returns A positive number if B beats A, a negative number if A beats B, 0 in case of an equality
   */
  rankPlayers(playerA: PlayerId, playerB: PlayerId): number
}

/**
 * Type guard to identify if a game's Rule is Competitive or not.
 * @param rules game's Rule
 * @returns true if the game is competitive
 */
export function isCompetitive<Game, Move, PlayerId>(rules: Rules<any, any, PlayerId>): rules is Competitive<Game, Move, PlayerId> {
  return isCompetitiveScore(rules) || isCompetitiveRank(rules)
}

/**
 * Type guard to identify if a game's Rule provide scores for players.
 * @param rules game's Rule
 * @returns true if the game is competitive with scores
 */
export function isCompetitiveScore<Game, Move, PlayerId>(rules: Rules<any, any, PlayerId>): rules is CompetitiveScore<Game, Move, PlayerId> {
  return typeof (rules as CompetitiveScore<Game, Move, PlayerId>).getScore === 'function'
}

/**
 * Type guard to identify if a game's Rule can rank the players.
 * @param rules game's Rule
 * @returns true if the game is competitive with ranking (used when scores are not available)
 */
export function isCompetitiveRank<Game, Move, PlayerId>(rules: Rules<any, any, PlayerId>): rules is CompetitiveRank<Game, Move, PlayerId> {
  return typeof (rules as CompetitiveRank<Game, Move, PlayerId>).rankPlayers === 'function'
}
