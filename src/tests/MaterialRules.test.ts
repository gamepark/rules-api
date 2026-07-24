import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Action } from '../Action'
import {
  ItemMoveType,
  MaterialGame,
  MaterialMove,
  MaterialMoveBuilder,
  MaterialRules,
  MaterialRulesPart,
  MaterialRulesPartCreator,
  MoveKind,
  SimultaneousRule
} from '../material'

const { startPlayerTurn, startSimultaneousRule, startRule, endPlayerTurn, customMove, endGame, displayHelp, changeView, dropItemMove } =
  MaterialMoveBuilder

enum M { Card = 1, Token = 2 }

enum L { Deck = 1, Hand = 2, Board = 3 }

enum R { Turn = 1, Sim = 2, Other = 3, Timed = 4 }

type Move = MaterialMove<number, M, L, R>
type Game = MaterialGame<number, M, L, R>

// Configurable hooks read by the test rule parts, reset before each test
const hooks = {
  getLegalMoves: (_p: number) => [] as Move[],
  beforeItemMove: (_m: any, _c?: any) => [] as Move[],
  afterItemMove: (_m: any, _c?: any) => [] as Move[],
  onRuleStart: (_m: any, _prev?: any, _c?: any) => [] as Move[],
  onRuleEnd: (_m: any, _c?: any) => [] as Move[],
  onCustomMove: (_m: any, _c?: any) => [] as Move[],
  getActivePlayerLegalMoves: (_p: number) => [] as Move[],
  onPlayerTurnEnd: (_m: any, _c?: any) => [] as Move[],
  getMovesAfterPlayersDone: () => [] as Move[]
}

beforeEach(() => {
  hooks.getLegalMoves = () => []
  hooks.beforeItemMove = () => []
  hooks.afterItemMove = () => []
  hooks.onRuleStart = () => []
  hooks.onRuleEnd = () => []
  hooks.onCustomMove = () => []
  hooks.getActivePlayerLegalMoves = () => []
  hooks.onPlayerTurnEnd = () => []
  hooks.getMovesAfterPlayersDone = () => []
})

class TurnRule extends MaterialRulesPart<number, M, L, R> {
  getLegalMoves(p: number) { return hooks.getLegalMoves(p) }
  beforeItemMove(m: any, c?: any) { return hooks.beforeItemMove(m, c) }
  afterItemMove(m: any, c?: any) { return hooks.afterItemMove(m, c) }
  onRuleStart(m: any, prev?: any, c?: any) { return hooks.onRuleStart(m, prev, c) }
  onRuleEnd(m: any, c?: any) { return hooks.onRuleEnd(m, c) }
  onCustomMove(m: any, c?: any) { return hooks.onCustomMove(m, c) }
}

class SimRule extends SimultaneousRule<number, M, L, R> {
  getActivePlayerLegalMoves(p: number) { return hooks.getActivePlayerLegalMoves(p) }
  getMovesAfterPlayersDone() { return hooks.getMovesAfterPlayersDone() }
  onPlayerTurnEnd(m: any, c?: any) { return hooks.onPlayerTurnEnd(m, c) }
  onRuleStart(m: any, prev?: any, c?: any) { return hooks.onRuleStart(m, prev, c) }
}

class TimedRule extends MaterialRulesPart<number, M, L, R> {
  giveTime() { return 42 }
}

class TestRules extends MaterialRules<number, M, L, R> {
  rules: Record<R, MaterialRulesPartCreator<number, M, L, R>> = {
    [R.Turn]: TurnRule,
    [R.Sim]: SimRule,
    [R.Other]: TurnRule,
    [R.Timed]: TimedRule
  }
  locationsStrategies = {}
}

function makeGame(rule?: Game['rule'], items: Game['items'] = {}, memory: Game['memory'] = {}): Game {
  return { players: [1, 2, 3], items, memory, rule }
}

// Item move helpers
const createCard = (item: any) => ({ kind: MoveKind.ItemMove as const, type: ItemMoveType.Create as const, itemType: M.Card, item })
const deleteCard = (itemIndex: number) => ({ kind: MoveKind.ItemMove as const, type: ItemMoveType.Delete as const, itemType: M.Card, itemIndex })
const selectCard = (itemIndex: number) => ({ kind: MoveKind.ItemMove as const, type: ItemMoveType.Select as const, itemType: M.Card, itemIndex })
const rollCard = (itemIndex: number) => ({
  kind: MoveKind.ItemMove as const, type: ItemMoveType.Roll as const, itemType: M.Card, itemIndex, location: { type: L.Board }
})

describe('MaterialRules', () => {

  describe('material & players accessors', () => {
    it('should expose material of a given type', () => {
      const items = [{ location: { type: L.Board } }]
      const rules = new TestRules(makeGame({ id: R.Turn }, { [M.Card]: items }))
      expect(rules.material(M.Card).getItems()).toEqual(items)
    })

    it('should expose the players', () => {
      expect(new TestRules(makeGame()).players).toEqual([1, 2, 3])
    })

    it('should report active players from a single-player rule', () => {
      expect(new TestRules(makeGame({ id: R.Turn, player: 2 })).activePlayers).toEqual([2])
    })

    it('should report active players from a simultaneous rule', () => {
      expect(new TestRules(makeGame({ id: R.Sim, players: [1, 3] })).activePlayers).toEqual([1, 3])
    })

    it('should report no active players without a rule', () => {
      expect(new TestRules(makeGame()).activePlayers).toEqual([])
    })
  })

  describe('memory', () => {
    it('should memorize, remind and forget a game value', () => {
      const rules = new TestRules(makeGame())
      rules.memorize('score', 10)
      expect(rules.remind('score')).toBe(10)
      rules.forget('score')
      expect(rules.remind('score')).toBeUndefined()
    })

    it('should memorize with an updater function', () => {
      const rules = new TestRules(makeGame())
      rules.memorize('score', 5)
      rules.memorize('score', (prev: number) => prev + 3)
      expect(rules.remind('score')).toBe(8)
    })

    it('should keep separate values per player', () => {
      const rules = new TestRules(makeGame())
      rules.memorize('gold', 4, 1)
      rules.memorize('gold', 7, 2)
      expect(rules.remind('gold', 1)).toBe(4)
      expect(rules.remind('gold', 2)).toBe(7)
      rules.forget('gold', 1)
      expect(rules.remind('gold', 1)).toBeUndefined()
      expect(rules.remind('gold', 2)).toBe(7)
    })
  })

  describe('rulesStep & delegate', () => {
    it('should instantiate the rule part mapped to the current rule id', () => {
      const rules = new TestRules(makeGame({ id: R.Turn }))
      expect(rules.rulesStep).toBeInstanceOf(TurnRule)
      expect(rules.delegate()).toBeInstanceOf(TurnRule)
    })

    it('should return undefined when there is no rule', () => {
      expect(new TestRules(makeGame()).rulesStep).toBeUndefined()
    })

    it('should warn and return undefined for an unknown rule id', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const rules = new TestRules(makeGame({ id: 999 as R }))
      expect(rules.rulesStep).toBeUndefined()
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe('mutator & itemsCanMerge', () => {
    it('should lazily create the items array for a type', () => {
      const game = makeGame({ id: R.Turn })
      const rules = new TestRules(game)
      rules.mutator(M.Token)
      expect(game.items[M.Token]).toEqual([])
    })

    it('should let items merge by default', () => {
      expect(new TestRules(makeGame()).itemsCanMerge(M.Card)).toBe(true)
    })
  })

  describe('randomize & roll', () => {
    it('should add newIndexes to a shuffle move', () => {
      const rules = new TestRules(makeGame({ id: R.Turn }))
      const move: any = { kind: MoveKind.ItemMove, type: ItemMoveType.Shuffle, itemType: M.Card, indexes: [0, 1, 2] }
      const randomized: any = rules.randomize(move)
      expect(randomized.newIndexes).toHaveLength(3)
      expect([...randomized.newIndexes].sort()).toEqual([0, 1, 2])
    })

    it('should add a rotation to a roll move', () => {
      const rules = new TestRules(makeGame({ id: R.Turn }))
      const randomized: any = rules.randomize(rollCard(0))
      expect(randomized.location.rotation).toBeGreaterThanOrEqual(0)
      expect(randomized.location.rotation).toBeLessThanOrEqual(5)
    })

    it('should leave other moves unchanged', () => {
      const rules = new TestRules(makeGame({ id: R.Turn }))
      const move = customMove(1)
      expect(rules.randomize(move as any)).toBe(move)
    })

    it('should roll a 6-sided dice by default', () => {
      const rules = new TestRules(makeGame({ id: R.Turn }))
      for (let i = 0; i < 50; i++) {
        const value = rules.roll(rollCard(0) as any)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(5)
      }
    })
  })

  describe('play - item moves', () => {
    it('should apply the move and return before + after consequences', () => {
      const before = customMove(1)
      const after = customMove(2)
      hooks.beforeItemMove = () => [before]
      hooks.afterItemMove = () => [after]
      const game = makeGame({ id: R.Turn })
      const rules = new TestRules(game)
      const consequences = rules.play(createCard({ location: { type: L.Board }, id: 7 }))
      expect(game.items[M.Card]).toHaveLength(1)
      expect(consequences).toEqual([before, after])
    })

    it('should truncate consequences at the first EndGame', () => {
      hooks.afterItemMove = () => [customMove(1), endGame(), customMove(2)]
      const rules = new TestRules(makeGame({ id: R.Turn }))
      const consequences = rules.play(createCard({ location: { type: L.Board } }))
      expect(consequences).toHaveLength(2)
      expect(consequences[1]).toEqual(endGame())
    })

    it('should skip the hooks and record transient items for a transient move', () => {
      hooks.beforeItemMove = () => [customMove(1)]
      hooks.afterItemMove = () => [customMove(2)]
      const game = makeGame({ id: R.Turn }, { [M.Card]: [{ location: { type: L.Board }, id: 1 }] })
      const rules = new TestRules(game)
      const consequences = rules.play(selectCard(0), { transient: true })
      expect(consequences).toEqual([]) // hooks skipped
      expect(game.transientItems![M.Card]).toEqual([0])
    })

    it('should clear transient items when the same move is later played for real', () => {
      const game = makeGame({ id: R.Turn }, { [M.Card]: [{ location: { type: L.Board }, id: 1 }] })
      game.transientItems = { [M.Card]: [0] }
      const rules = new TestRules(game)
      rules.play(deleteCard(0))
      expect(game.transientItems![M.Card]).toEqual([])
    })

    it('should remove dropped items affected by the move', () => {
      const game = makeGame({ id: R.Turn }, { [M.Card]: [{ location: { type: L.Board }, id: 1 }] })
      game.droppedItems = [{ type: M.Card, index: 0, displayIndex: 0 }]
      const rules = new TestRules(game)
      rules.play(deleteCard(0))
      expect(game.droppedItems).toEqual([])
    })
  })

  describe('play - local moves', () => {
    it('should store the help display', () => {
      const game = makeGame({ id: R.Turn })
      const help: any = { type: 0, itemType: M.Card, item: {} }
      new TestRules(game).play(displayHelp(help) as any)
      expect(game.helpDisplay).toEqual(help)
    })

    it('should change the view', () => {
      const game = makeGame({ id: R.Turn })
      new TestRules(game).play(changeView(2 as any) as any)
      expect(game.view).toBe(2)
    })

    it('should push a dropped item', () => {
      const game = makeGame({ id: R.Turn })
      new TestRules(game).play(dropItemMove(M.Card, 3, 1) as any)
      expect(game.droppedItems).toEqual([{ type: M.Card, index: 3, displayIndex: 1 }])
    })
  })

  describe('play - rule changes', () => {
    it('should start a player turn and run onRuleStart/onRuleEnd', () => {
      const started = customMove(1)
      const ended = customMove(2)
      hooks.onRuleStart = () => [started]
      hooks.onRuleEnd = () => [ended]
      const game = makeGame({ id: R.Turn, player: 1 })
      const rules = new TestRules(game)
      const consequences = rules.play(startPlayerTurn(R.Other, 2))
      expect(game.rule).toEqual({ id: R.Other, player: 2 })
      expect(consequences).toEqual([ended, started]) // onRuleEnd first, then onRuleStart
    })

    it('should start a rule keeping the previous player', () => {
      const game = makeGame({ id: R.Turn, player: 2 })
      new TestRules(game).play(startRule(R.Other))
      expect(game.rule).toEqual({ id: R.Other, player: 2 })
    })

    it('should initialise interleaving on a simultaneous rule', () => {
      const game = makeGame({ id: R.Turn }, { [M.Card]: [{ location: { type: L.Board } }] })
      new TestRules(game).play(startSimultaneousRule(R.Sim, [3, 1]))
      expect(game.rule!.players).toEqual([3, 1])
      expect(game.rule!.interleaving!.players).toEqual([1, 3]) // sorted
      expect(game.rule!.interleaving!.availableIndexes[M.Card]).toEqual([1])
    })

    it('should end the game', () => {
      const game = makeGame({ id: R.Turn })
      const rules = new TestRules(game)
      rules.play(endGame())
      expect(game.rule).toBeUndefined()
      expect(rules.isOver()).toBe(true)
    })
  })

  describe('play - EndPlayerTurn during a simultaneous rule', () => {
    it('should remove the player and run onPlayerTurnEnd', () => {
      const turnEnd = customMove(1)
      hooks.onPlayerTurnEnd = () => [turnEnd]
      const game = makeGame({ id: R.Sim, players: [1, 2, 3] })
      const rules = new TestRules(game)
      const consequences = rules.play(endPlayerTurn(1))
      expect(game.rule!.players).toEqual([2, 3])
      expect(consequences).toEqual([turnEnd])
    })

    it('should run getMovesAfterPlayersDone when the last player ends', () => {
      const done = customMove(9)
      hooks.getMovesAfterPlayersDone = () => [done]
      const game = makeGame({ id: R.Sim, players: [1] })
      const rules = new TestRules(game)
      const consequences = rules.play(endPlayerTurn(1))
      expect(game.rule!.players).toEqual([])
      expect(consequences).toContainEqual(done)
    })

    it('should warn and do nothing for an already-inactive player', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const game = makeGame({ id: R.Sim, players: [2, 3] })
      const rules = new TestRules(game)
      const consequences = rules.play(endPlayerTurn(1))
      expect(consequences).toEqual([])
      expect(game.rule!.players).toEqual([2, 3])
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe('play - custom moves', () => {
    it('should delegate custom moves to the rule step', () => {
      const consequence = customMove(2)
      hooks.onCustomMove = () => [consequence]
      const rules = new TestRules(makeGame({ id: R.Turn }))
      expect(rules.play(customMove(1))).toEqual([consequence])
    })
  })

  describe('getLegalMoves', () => {
    it('should delegate to the current rule step', () => {
      const legal = customMove(1)
      hooks.getLegalMoves = () => [legal]
      const rules = new TestRules(makeGame({ id: R.Turn }))
      expect(rules.getLegalMoves(1)).toEqual([legal])
    })
  })

  describe('canUndo', () => {
    const action = (over: Partial<Action<Move, number>>): Action<Move, number> =>
      ({ playerId: 1, move: customMove(1), consequences: [], ...over })

    it('should allow undoing a simple action', () => {
      expect(new TestRules(makeGame()).canUndo(action({}), [])).toBe(true)
    })

    it('should block undo when the action rolled a dice', () => {
      expect(new TestRules(makeGame()).canUndo(action({ move: rollCard(0) as any }), [])).toBe(false)
    })

    it('should block undo when a consequence activated another player', () => {
      const a = action({ consequences: [startPlayerTurn(R.Turn, 2)] })
      expect(new TestRules(makeGame()).canUndo(a, [])).toBe(false)
    })

    it('should block undo when a later action by the same player is not a select', () => {
      const a = action({})
      const consecutive = action({ move: customMove(5) })
      expect(new TestRules(makeGame()).canUndo(a, [consecutive])).toBe(false)
    })

    it('should allow undoing consecutive select moves by the same player', () => {
      const a = action({ move: selectCard(0) as any })
      const consecutive = action({ move: selectCard(1) as any })
      expect(new TestRules(makeGame()).canUndo(a, [consecutive])).toBe(true)
    })

    it('should block undo of an action that ended a simultaneous phase', () => {
      const a = action({ move: endPlayerTurn(1), consequences: [startRule(R.Other)] })
      expect(new TestRules(makeGame()).canUndo(a, [])).toBe(false)
    })
  })

  describe('isUnpredictableMove', () => {
    it('should be true for rule changes during a simultaneous phase', () => {
      const game = makeGame()
      const rules = new TestRules(game)
      rules.play(startSimultaneousRule(R.Sim))
      expect(rules.isUnpredictableMove(startRule(R.Other), 1)).toBe(true)
      expect(rules.isUnpredictableMove(endPlayerTurn(1), 1)).toBe(false)
    })

    it('should be true for roll moves', () => {
      const rules = new TestRules(makeGame({ id: R.Turn }))
      expect(rules.isUnpredictableMove(rollCard(0) as any, 1)).toBe(true)
    })

    it('should be false for a plain item move', () => {
      const rules = new TestRules(makeGame({ id: R.Turn }))
      expect(rules.isUnpredictableMove(createCard({ location: { type: L.Board } }) as any, 1)).toBe(false)
    })
  })

  describe('isSequentialMove', () => {
    const rules = () => new TestRules(makeGame({ id: R.Turn }))

    it('should be true for rule moves other than EndPlayerTurn', () => {
      expect(rules().isSequentialMove(startRule(R.Other))).toBe(true)
    })

    it('should be false for EndPlayerTurn', () => {
      expect(rules().isSequentialMove(endPlayerTurn(1))).toBe(false)
    })

    it('should be false for item moves', () => {
      expect(rules().isSequentialMove(createCard({ location: { type: L.Board } }) as any)).toBe(false)
    })
  })

  describe('isOver & giveTime', () => {
    it('should be over when there is no rule', () => {
      expect(new TestRules(makeGame()).isOver()).toBe(true)
      expect(new TestRules(makeGame({ id: R.Turn })).isOver()).toBe(false)
    })

    it('should give the rule-specific time when the rule implements TimeLimit', () => {
      expect(new TestRules(makeGame({ id: R.Timed })).giveTime(1)).toBe(42)
    })

    it('should give the default 60 seconds otherwise', () => {
      expect(new TestRules(makeGame({ id: R.Turn })).giveTime(1)).toBe(60)
      expect(new TestRules(makeGame()).giveTime(1)).toBe(60)
    })
  })
})
