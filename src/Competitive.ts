import { Rules } from './Rules'

export type Competitive<Game = any, Move = any, PlayerId = any> = CompetitiveScore<Game, Move, PlayerId> | CompetitiveRank<Game, Move, PlayerId>

export interface CompetitiveScore<Game = any, Move = any, PlayerId = any> extends Rules<Game, Move, PlayerId> {
  getScore(playerId: PlayerId): number

  getTieBreaker?(tieBreaker: number, playerId: PlayerId): number | undefined
}

export interface CompetitiveRank<Game = any, Move = any, PlayerId = any> extends Rules<Game, Move, PlayerId> {
  rankPlayers(playerA: PlayerId, playerB: PlayerId): number
}

export function isCompetitive<Game, Move, PlayerId>(rules: Rules<any, any, PlayerId>): rules is Competitive<Game, Move, PlayerId> {
  return isCompetitiveScore(rules) || isCompetitiveRank(rules)
}

export function isCompetitiveScore<Game, Move, PlayerId>(rules: Rules<any, any, PlayerId>): rules is CompetitiveScore<Game, Move, PlayerId> {
  return typeof (rules as CompetitiveScore<Game, Move, PlayerId>).getScore === 'function'
}

export function isCompetitiveRank<Game, Move, PlayerId>(rules: Rules<any, any, PlayerId>): rules is CompetitiveRank<Game, Move, PlayerId> {
  return typeof (rules as CompetitiveRank<Game, Move, PlayerId>).rankPlayers === 'function'
}

export const rankPlayers = <PlayerId = number>(rules: Rules<any, any, PlayerId>, playerA: PlayerId, playerB: PlayerId) => {
  if (isCompetitiveRank(rules)) {
    return rules.rankPlayers(playerA, playerB)
  }
  if (isCompetitiveScore(rules)) {
    const scoreA = rules.getScore(playerA)
    const scoreB = rules.getScore(playerB)
    if (scoreA !== scoreB) {
      return scoreB - scoreA
    }
    if (rules.getTieBreaker) {
      for (let tieBreaker = 1; tieBreaker <= 10; tieBreaker++) {
        const tieBreakerA = rules.getTieBreaker(tieBreaker, playerA)
        const tieBreakerB = rules.getTieBreaker(tieBreaker, playerB)
        if (tieBreakerA === undefined) {
          return tieBreakerB === undefined ? 0 : Infinity
        } else if (tieBreakerB === undefined) {
          return -Infinity
        } else if (tieBreakerA !== tieBreakerB) {
          return tieBreakerB - tieBreakerA
        }
      }
      console.error('getTieBreaker must return "undefined" after the last tie breaker is still a tie!')
    }
  }
  return 0
}
