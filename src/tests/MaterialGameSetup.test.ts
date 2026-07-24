import { describe, expect, it } from 'vitest'
import {
  MaterialGameSetup,
  MaterialItem,
  MaterialMove,
  MaterialRules,
  MaterialRulesPart,
  MaterialRulesPartCreator
} from '../material'

enum M { Card = 1 }

enum L { Deck = 1, Hand = 2 }

enum R { Play = 1, Spawn = 2 }

class PlayRule extends MaterialRulesPart<number, M, L, R> {
}

// A rule that creates a card as a consequence of starting, to exercise playMove's consequence application
class SpawnRule extends MaterialRulesPart<number, M, L, R> {
  onRuleStart(): MaterialMove<number, M, L, R>[] {
    return [this.material(M.Card).createItem({ location: { type: L.Hand } })]
  }
}

class TestRules extends MaterialRules<number, M, L, R> {
  rules: Record<R, MaterialRulesPartCreator<number, M, L, R>> = {
    [R.Play]: PlayRule,
    [R.Spawn]: SpawnRule
  }
  locationsStrategies = {}
}

class Setup extends MaterialGameSetup<number, M, L, any, R> {
  Rules = TestRules

  start() {}

  // expose the protected surface for testing
  get state() { return this.game }
  callPlayMove(move: MaterialMove<number, M, L, R>) { this.playMove(move) }
  callMaterial(type: M) { return this.material(type) }
  callMemorize<T>(key: keyof any, value: T | ((v: T) => T), player?: number) { return this.memorize(key, value, player) }
}

// A full setup that builds material and starts a rule, to test the setup() entry point
class FullSetup extends MaterialGameSetup<number, M, L, any, R> {
  Rules = TestRules
  setupMaterial() {
    this.material(M.Card).createItems([{ location: { type: L.Deck }, id: 1 }, { location: { type: L.Deck }, id: 2 }])
  }
  start() {
    this.startPlayerTurn(R.Play, 2)
  }
  get state() { return this.game }
}

describe('MaterialGameSetup', () => {

  describe('player ids from options', () => {
    it('should build a sequence from a player count', () => {
      expect(new Setup().setup({ players: 3 }).players).toEqual([1, 2, 3])
    })

    it('should default to 2 players', () => {
      expect(new Setup().setup({}).players).toEqual([1, 2])
    })

    it('should use ids from an array of player options', () => {
      expect(new Setup().setup({ players: [{ id: 5 }, { id: 6 }] }).players).toEqual([5, 6])
    })

    it('should fall back to index+1 for player options without id', () => {
      expect(new Setup().setup({ players: [{}, {}, {}] }).players).toEqual([1, 2, 3])
    })
  })

  describe('setup entry point', () => {
    it('should run setupMaterial then start and return the game', () => {
      const game = new FullSetup().setup({ players: 3 })
      expect(game.players).toEqual([1, 2, 3])
      expect(game.items[M.Card]).toHaveLength(2)
      expect(game.rule).toEqual({ id: R.Play, player: 2 })
    })

    it('should store the initial tutorial state', () => {
      const tutorial: any = { step: 0 }
      const game = new Setup().setup({ players: 2 }, tutorial)
      expect(game.tutorial).toBe(tutorial)
    })

    it('should reset the state on each setup call', () => {
      const setup = new FullSetup()
      setup.setup({ players: 2 })
      const game = setup.setup({ players: 4 })
      expect(game.players).toEqual([1, 2, 3, 4])
      expect(game.items[M.Card]).toHaveLength(2) // not accumulated from the first setup
    })
  })

  describe('material() with immediate play', () => {
    it('should create items immediately in the game state', () => {
      const setup = new Setup()
      setup.setup({ players: 2 })
      setup.callMaterial(M.Card).createItem({ location: { type: L.Deck } })
      expect(setup.state.items[M.Card]).toHaveLength(1)
    })

    it('should randomize a roll move played through material', () => {
      const setup = new Setup()
      setup.setup({ players: 2 })
      setup.callMaterial(M.Card).createItem({ location: { type: L.Deck } })
      setup.callMaterial(M.Card).rollItem({ type: L.Deck })
      const rotation = setup.state.items[M.Card]![0].location.rotation as number
      expect(rotation).toBeGreaterThanOrEqual(0)
      expect(rotation).toBeLessThanOrEqual(5)
    })
  })

  describe('playMove', () => {
    it('should apply the consequences of a move', () => {
      const setup = new Setup()
      setup.setup({ players: 2 })
      // Starting the Spawn rule creates a card as an onRuleStart consequence
      setup.startRule(R.Spawn)
      expect(setup.state.items[M.Card]).toHaveLength(1)
      expect(setup.state.items[M.Card]![0].location.type).toBe(L.Hand)
    })
  })

  describe('memory', () => {
    it('should memorize a game value', () => {
      const setup = new Setup()
      setup.setup({ players: 2 })
      setup.callMemorize('score', 42)
      expect(setup.state.memory['score']).toBe(42)
    })

    it('should memorize a per-player value', () => {
      const setup = new Setup()
      setup.setup({ players: 2 })
      setup.callMemorize('gold', 3, 2)
      expect(setup.state.memory['gold'][2]).toBe(3)
    })
  })

  describe('accessors & start helpers', () => {
    it('should expose players and a rules instance', () => {
      const setup = new Setup()
      setup.setup({ players: 3 })
      expect(setup.players).toEqual([1, 2, 3])
      expect(setup.rules).toBeInstanceOf(TestRules)
    })

    it('should start a player turn defaulting to the first player', () => {
      const setup = new Setup()
      setup.setup({ players: 3 })
      setup.startPlayerTurn(R.Play)
      expect(setup.state.rule).toEqual({ id: R.Play, player: 1 })
    })

    it('should start a rule', () => {
      const setup = new Setup()
      setup.setup({ players: 2 })
      setup.startRule(R.Play)
      expect(setup.state.rule).toMatchObject({ id: R.Play })
    })

    it('should start a simultaneous rule', () => {
      const setup = new Setup()
      setup.setup({ players: 3 })
      setup.startSimultaneousRule(R.Play, [1, 2])
      expect(setup.state.rule!.players).toEqual([1, 2])
    })
  })
})
