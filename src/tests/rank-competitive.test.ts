import { describe, expect, it, vi } from 'vitest'
import { isCompetitive, isCompetitiveRank, isCompetitiveScore } from '../Competitive'
import { rankPlayers } from '../utils'

// Minimal fake rules objects; the guards only check for the presence of methods
const rankRules = { rankPlayers: (a: number, b: number) => a - b } as any
const scoreRules = (scores: Record<number, number>, extra: any = {}) =>
  ({ getScore: (p: number) => scores[p], ...extra }) as any

describe('Competitive type guards', () => {
  it('should detect score-based competitive rules', () => {
    expect(isCompetitiveScore(scoreRules({ 1: 0 }))).toBe(true)
    expect(isCompetitiveScore(rankRules)).toBe(false)
  })

  it('should detect rank-based competitive rules', () => {
    expect(isCompetitiveRank(rankRules)).toBe(true)
    expect(isCompetitiveRank(scoreRules({ 1: 0 }))).toBe(false)
  })

  it('should detect any competitive rules', () => {
    expect(isCompetitive(rankRules)).toBe(true)
    expect(isCompetitive(scoreRules({ 1: 0 }))).toBe(true)
    expect(isCompetitive({} as any)).toBe(false)
  })
})

describe('rankPlayers', () => {

  it('should return 0 for non-competitive rules', () => {
    expect(rankPlayers({} as any, 1, 2)).toBe(0)
  })

  it('should delegate to a rank-based rule', () => {
    expect(rankPlayers(rankRules, 1, 2)).toBe(-1) // 1 - 2
  })

  describe('score-based ranking', () => {
    it('should rank the higher score first by default', () => {
      // negative => A beats B
      expect(rankPlayers(scoreRules({ 1: 10, 2: 5 }), 1, 2)).toBe(-5)
    })

    it('should rank the lower score first when rankByLowerScore is set', () => {
      expect(rankPlayers(scoreRules({ 1: 10, 2: 5 }, { rankByLowerScore: true }), 1, 2)).toBe(5)
    })

    it('should return 0 on a tie without tie-breaker', () => {
      expect(rankPlayers(scoreRules({ 1: 5, 2: 5 }), 1, 2)).toBe(0)
    })

    it('should use the first tie-breaker that differs', () => {
      const rules = scoreRules({ 1: 5, 2: 5 }, { getTieBreaker: (_tb: number, p: number) => (p === 1 ? 3 : 1) })
      expect(rankPlayers(rules, 1, 2)).toBe(-2) // A has the higher tie-breaker => A beats B
    })

    it('should move on to deeper tie-breakers when the first is equal', () => {
      const rules = scoreRules({ 1: 5, 2: 5 }, {
        getTieBreaker: (tb: number, p: number) => tb === 1 ? 0 : (p === 1 ? 5 : 2)
      })
      expect(rankPlayers(rules, 1, 2)).toBe(-3) // second tie-breaker: 2 - 5
    })

    it('should rank a player with a tie-breaker above one without', () => {
      const rules = scoreRules({ 1: 5, 2: 5 }, {
        getTieBreaker: (_tb: number, p: number) => (p === 1 ? undefined : 4)
      })
      expect(rankPlayers(rules, 1, 2)).toBe(Infinity) // A has no tie-breaker => A ranks below
      expect(rankPlayers(rules, 2, 1)).toBe(-Infinity) // symmetric
    })

    it('should return 0 when both tie-breakers are undefined', () => {
      const rules = scoreRules({ 1: 5, 2: 5 }, { getTieBreaker: () => undefined })
      expect(rankPlayers(rules, 1, 2)).toBe(0)
    })

    it('should give up (and warn) when tie-breakers never resolve', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const rules = scoreRules({ 1: 5, 2: 5 }, { getTieBreaker: () => 0 }) // always equal, never undefined
      expect(rankPlayers(rules, 1, 2)).toBe(0)
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })
})
