import { describe, expect, it } from 'vitest'
import { Rules } from '../Rules'

type G = { n: number }

// A leaf rule with configurable behaviour
class Leaf extends Rules<G, string, number> {
  constructor(game: G, public opts: {
    active?: number, legal?: string[], auto?: string[], over?: boolean, consequences?: string[], played?: string[]
  } = {}) {
    super(game)
  }

  getActivePlayer() { return this.opts.active }
  getLegalMoves() { return this.opts.legal ?? [] }
  getAutomaticMoves() { return this.opts.auto ?? [] }
  isOver(ids?: number[]) { return this.opts.over ?? super.isOver(ids) }
  play(move: string) { (this.opts.played ??= []).push(move); return this.opts.consequences ?? [] }
}

// A rule that delegates to children
class Parent extends Rules<G, string, number> {
  constructor(game: G, public kids: Rules<G, string, number>[]) { super(game) }
  delegates() { return this.kids }
}

// A rule that supports the deprecated Eliminations "give up" move
class ElimLeaf extends Rules<G, string, number> {
  getLegalMoves() { return [] }
  isEliminated(_player: number) { return false }
  giveUpMove(player: number) { return `giveup-${player}` }
}

const game: G = { n: 1 }

describe('Rules (base)', () => {

  describe('state & delegation defaults', () => {
    it('should expose the game through state', () => {
      const rules = new Leaf(game)
      expect(rules.state).toBe(game)
      expect(rules.game).toBe(game)
    })

    it('should have no delegate by default', () => {
      const rules = new Leaf(game)
      expect(rules.delegate()).toBeUndefined()
      expect(rules.delegates()).toEqual([])
    })
  })

  describe('getActivePlayer & isTurnToPlay', () => {
    it('should return its own active player', () => {
      expect(new Leaf(game, { active: 3 }).getActivePlayer()).toBe(3)
      expect(new Leaf(game).getActivePlayer()).toBeUndefined()
    })

    it('should tell whose turn it is', () => {
      const rules = new Leaf(game, { active: 3 })
      expect(rules.isTurnToPlay(3)).toBe(true)
      expect(rules.isTurnToPlay(1)).toBe(false)
    })

    it('should return the first delegate active player', () => {
      const parent = new Parent(game, [new Leaf(game), new Leaf(game, { active: 2 })])
      expect(parent.getActivePlayer()).toBe(2)
      expect(parent.isTurnToPlay(2)).toBe(true)
    })
  })

  describe('getLegalMoves & getAutomaticMoves delegation', () => {
    it('should concatenate the legal moves of every delegate', () => {
      const parent = new Parent(game, [new Leaf(game, { legal: ['a'] }), new Leaf(game, { legal: ['b', 'c'] })])
      expect(parent.getLegalMoves(1)).toEqual(['a', 'b', 'c'])
    })

    it('should concatenate the automatic moves of every delegate', () => {
      const parent = new Parent(game, [new Leaf(game, { auto: ['x'] }), new Leaf(game, { auto: ['y'] })])
      expect(parent.getAutomaticMoves()).toEqual(['x', 'y'])
    })
  })

  describe('isLegalMove', () => {
    it('should accept a move present in the legal moves', () => {
      const rules = new Leaf(game, { legal: ['a'] })
      expect(rules.isLegalMove(1, 'a')).toBe(true)
      expect(rules.isLegalMove(1, 'b')).toBe(false)
    })

    it('should accept a move legal for a delegate', () => {
      const parent = new Parent(game, [new Leaf(game, { legal: ['a'] })])
      expect(parent.isLegalMove(1, 'a')).toBe(true)
    })

    it('should accept the give-up move for an eliminable rule', () => {
      const rules = new ElimLeaf(game)
      expect(rules.isLegalMove(1, 'giveup-1')).toBe(true)
      expect(rules.isLegalMove(1, 'something-else')).toBe(false)
    })
  })

  describe('play delegation', () => {
    it('should play the move on every delegate and gather consequences', () => {
      const kid1 = new Leaf(game, { consequences: ['c1'] })
      const kid2 = new Leaf(game, { consequences: ['c2'] })
      const parent = new Parent(game, [kid1, kid2])
      expect(parent.play('m')).toEqual(['c1', 'c2'])
      expect(kid1.opts.played).toEqual(['m'])
      expect(kid2.opts.played).toEqual(['m'])
    })

    it('should return no consequence for a leaf without delegate', () => {
      expect(new Leaf(game).play('m')).toEqual([])
    })
  })

  describe('isOver', () => {
    it('should be over when there is no active player', () => {
      expect(new Leaf(game).isOver()).toBe(true)
      expect(new Leaf(game, { active: 1 }).isOver()).toBe(false)
    })

    it('should use playerIds when provided', () => {
      expect(new Leaf(game, { active: 1 }).isOver([1, 2])).toBe(false) // player 1 still plays
      expect(new Leaf(game).isOver([1, 2])).toBe(true) // nobody plays
    })

    it('should be over when every delegate is over', () => {
      const over = new Parent(game, [new Leaf(game, { over: true }), new Leaf(game, { over: true })])
      expect(over.isOver()).toBe(true)
    })

    it('should not be over when a delegate is not over', () => {
      const parent = new Parent(game, [new Leaf(game, { over: true }), new Leaf(game, { over: false, active: 1 })])
      expect(parent.isOver()).toBe(false)
    })
  })
})
