import { isCompetitiveRank, isCompetitiveScore } from '../Competitive'
import { Rules } from '../Rules'

export const rankPlayers = <PlayerId = any>(rules: Rules<any, any, PlayerId>, playerA: PlayerId, playerB: PlayerId) => {
  if (isCompetitiveRank(rules)) {
    return rules.rankPlayers(playerA, playerB)
  }
  if (isCompetitiveScore(rules)) {
    const scoreA = rules.getScore(playerA)
    const scoreB = rules.getScore(playerB)
    if (scoreA !== scoreB) {
      return rules.rankByLowerScore ? scoreA - scoreB : scoreB - scoreA
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
