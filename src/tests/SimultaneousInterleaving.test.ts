import { describe, expect, it } from 'vitest'
import {
  CreateItem,
  ItemMoveType,
  MaterialGame,
  MaterialItem,
  MaterialMove,
  MaterialMutator,
  MaterialRules,
  MaterialRulesPartCreator,
  MoveKind,
  RuleMoveType,
  SimultaneousContext,
  SimultaneousRule
} from '../material'

// Test enums
enum TestMaterial { Card = 1, Token = 2 }

enum TestLocation { Hand = 1, Board = 2 }

enum TestRule { Simultaneous = 1, PlayerTurn = 2 }

type TestGame = MaterialGame<number, TestMaterial, TestLocation, TestRule>

// Helper to create a CreateItem move
function createItemMove<M extends TestMaterial>(itemType: M, item: MaterialItem<number, TestLocation>): CreateItem<number, M, TestLocation> {
  return { kind: MoveKind.ItemMove, type: ItemMoveType.Create, itemType, item }
}

// Helper to create a StartSimultaneousRule move
function startSimultaneous(players?: number[]) {
  return { kind: MoveKind.RulesMove as const, type: RuleMoveType.StartSimultaneousRule as const, id: TestRule.Simultaneous, players }
}

// Helper to create an EndPlayerTurn move
function endPlayerTurn(player: number) {
  return { kind: MoveKind.RulesMove as const, type: RuleMoveType.EndPlayerTurn as const, player }
}

describe('MaterialMutator with SimultaneousContext', () => {

  describe('addItem with interleaving', () => {
    it('should place items at interleaved slots based on item location.player', () => {
      const items: MaterialItem<number, TestLocation>[] = []
      const ctx: SimultaneousContext = { availableIndexes: [0], players: [1, 2] }
      const mutator = new MaterialMutator(TestMaterial.Card, items, {}, true, '', ctx)

      const move1 = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 1 } })
      mutator.applyMove(move1)
      expect(items.length).toBe(1)
      expect(items[0].location.player).toBe(1)

      const move2 = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 1 }, id: 2 })
      mutator.applyMove(move2)
      // Player 1 has rank 0 in [1,2]: positions 0, 2, 4... => indexes 0, 2, 4...
      expect(items.length).toBe(3) // slot 0 used, slot 1 placeholder, slot 2 used
      expect(items[0].location.player).toBe(1)
      expect(items[1].quantity).toBe(0) // placeholder
      expect(items[2].id).toBe(2)
    })

    it('should place items at interleaved slots for second player', () => {
      const items: MaterialItem<number, TestLocation>[] = []
      const ctx: SimultaneousContext = { availableIndexes: [0], players: [1, 2] }
      const mutator = new MaterialMutator(TestMaterial.Card, items, {}, true, '', ctx)

      const move1 = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 2 } })
      mutator.applyMove(move1)
      // Player 2 has rank 1 in [1,2]: position 1 => index 1
      expect(items.length).toBe(2)
      expect(items[0].quantity).toBe(0) // placeholder
      expect(items[1].location.player).toBe(2)
    })

    it('should append after existing items when no tombstones', () => {
      const items: MaterialItem<number, TestLocation>[] = [
        { location: { type: TestLocation.Board } },
        { location: { type: TestLocation.Board } }
      ]
      // availableIndexes=[2] means no tombstones, next free slot is at index 2
      const ctx: SimultaneousContext = { availableIndexes: [2], players: [1, 2] }
      const mutator = new MaterialMutator(TestMaterial.Card, items, {}, true, '', ctx)

      const move = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 1 } })
      mutator.applyMove(move)
      expect(items.length).toBe(3)
      expect(items[2].location.player).toBe(1)
    })

    it('should reuse tombstones listed in availableIndexes', () => {
      const items: MaterialItem<number, TestLocation>[] = [
        { location: { type: TestLocation.Board }, quantity: 0 }, // tombstone at index 0
        { location: { type: TestLocation.Board } }
      ]
      // availableIndexes=[0, 2] means tombstone at 0 and next free at 2
      const ctx: SimultaneousContext = { availableIndexes: [0, 2], players: [1, 2] }
      const mutator = new MaterialMutator(TestMaterial.Card, items, {}, true, '', ctx)

      const move = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 1 } })
      mutator.applyMove(move)
      // Tombstone at index 0 should be reused
      expect(items.length).toBe(2) // no growth!
      expect(items[0].location.player).toBe(1)
    })

    it('should distribute tombstones among players', () => {
      const items: MaterialItem<number, TestLocation>[] = [
        { location: { type: TestLocation.Board }, quantity: 0 }, // tombstone 0
        { location: { type: TestLocation.Board } },              // live item 1
        { location: { type: TestLocation.Board }, quantity: 0 }, // tombstone 2
        { location: { type: TestLocation.Board } }               // live item 3
      ]
      // 2 tombstones (0, 2) + array end (4)
      const available = [0, 2, 4]

      // Same mutator, but items for different players get different slots
      const ctx: SimultaneousContext = { availableIndexes: available, players: [1, 2] }
      const mut = new MaterialMutator(TestMaterial.Card, items, {}, false, '', ctx)

      // Player 1 (rank 0) gets positions 0, 2 => indexes 0, 4
      mut.applyMove(createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 1 }, id: 10 }))

      // Player 2 (rank 1) gets positions 1, 3 => indexes 2, 5
      mut.applyMove(createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 2 }, id: 20 }))

      expect(items[0].id).toBe(10) // player 1 reused tombstone at 0
      expect(items[2].id).toBe(20) // player 2 reused tombstone at 2
      expect(items.length).toBe(4) // no growth!
    })

    it('should fall back to normal addItem when item has no location.player', () => {
      const items: MaterialItem<number, TestLocation>[] = []
      const ctx: SimultaneousContext = { availableIndexes: [0], players: [1, 2] }
      const mutator = new MaterialMutator(TestMaterial.Card, items, {}, true, '', ctx)

      // Create without player - should warn and use normal behavior
      const move = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Board } })
      mutator.applyMove(move)
      expect(items.length).toBe(1)
      expect(items[0].location.type).toBe(TestLocation.Board)
    })
  })

  describe('commutativity', () => {
    it('should produce same result regardless of player order (2 players)', () => {
      const player1Item: MaterialItem<number, TestLocation> = { location: { type: TestLocation.Hand, player: 1 } }
      const player2Item: MaterialItem<number, TestLocation> = { location: { type: TestLocation.Hand, player: 2 } }
      const available = [0]

      // Order A: player 1 first, then player 2 (same mutator, player determined from item)
      const itemsA: MaterialItem<number, TestLocation>[] = []
      const mutatorA = new MaterialMutator(TestMaterial.Card, itemsA, {}, true, '', { availableIndexes: available, players: [1, 2] })
      mutatorA.applyMove(createItemMove(TestMaterial.Card, player1Item))
      mutatorA.applyMove(createItemMove(TestMaterial.Card, player2Item))

      // Order B: player 2 first, then player 1
      const itemsB: MaterialItem<number, TestLocation>[] = []
      const mutatorB = new MaterialMutator(TestMaterial.Card, itemsB, {}, true, '', { availableIndexes: available, players: [1, 2] })
      mutatorB.applyMove(createItemMove(TestMaterial.Card, player2Item))
      mutatorB.applyMove(createItemMove(TestMaterial.Card, player1Item))

      // Both should produce same state
      expect(itemsA).toEqual(itemsB)
      expect(itemsA[0].location.player).toBe(1) // rank 0 -> index 0
      expect(itemsA[1].location.player).toBe(2) // rank 1 -> index 1
    })

    it('should produce same result with multiple items per player', () => {
      const p1Items = [
        { location: { type: TestLocation.Hand, player: 1 }, id: 1 } as MaterialItem<number, TestLocation>,
        { location: { type: TestLocation.Hand, player: 1 }, id: 2 } as MaterialItem<number, TestLocation>
      ]
      const p2Items = [
        { location: { type: TestLocation.Hand, player: 2 }, id: 3 } as MaterialItem<number, TestLocation>,
        { location: { type: TestLocation.Hand, player: 2 }, id: 4 } as MaterialItem<number, TestLocation>
      ]
      const available = [0]

      // Order A: P1 creates 2, then P2 creates 2
      const itemsA: MaterialItem<number, TestLocation>[] = []
      const mutA = new MaterialMutator(TestMaterial.Card, itemsA, {}, false, '', { availableIndexes: available, players: [1, 2] })
      mutA.applyMove(createItemMove(TestMaterial.Card, p1Items[0]))
      mutA.applyMove(createItemMove(TestMaterial.Card, p1Items[1]))
      mutA.applyMove(createItemMove(TestMaterial.Card, p2Items[0]))
      mutA.applyMove(createItemMove(TestMaterial.Card, p2Items[1]))

      // Order B: P2 creates 2, then P1 creates 2
      const itemsB: MaterialItem<number, TestLocation>[] = []
      const mutB = new MaterialMutator(TestMaterial.Card, itemsB, {}, false, '', { availableIndexes: available, players: [1, 2] })
      mutB.applyMove(createItemMove(TestMaterial.Card, p2Items[0]))
      mutB.applyMove(createItemMove(TestMaterial.Card, p2Items[1]))
      mutB.applyMove(createItemMove(TestMaterial.Card, p1Items[0]))
      mutB.applyMove(createItemMove(TestMaterial.Card, p1Items[1]))

      expect(itemsA).toEqual(itemsB)
      // P1 (rank 0): indices 0, 2
      // P2 (rank 1): indices 1, 3
      expect(itemsA[0].id).toBe(1)
      expect(itemsA[1].id).toBe(3)
      expect(itemsA[2].id).toBe(2)
      expect(itemsA[3].id).toBe(4)
    })

    it('should produce same result with 3 players', () => {
      const makeItem = (player: number, id: number): MaterialItem<number, TestLocation> =>
        ({ location: { type: TestLocation.Hand, player }, id })
      const available = [0]

      const applyForPlayer = (items: MaterialItem<number, TestLocation>[], player: number, id: number) => {
        const ctx: SimultaneousContext = { availableIndexes: available, players: [1, 2, 3] }
        const mutator = new MaterialMutator(TestMaterial.Card, items, {}, false, '', ctx)
        mutator.applyMove(createItemMove(TestMaterial.Card, makeItem(player, id)))
      }

      // Order A: P1, P2, P3
      const itemsA: MaterialItem<number, TestLocation>[] = []
      applyForPlayer(itemsA, 1, 10)
      applyForPlayer(itemsA, 2, 20)
      applyForPlayer(itemsA, 3, 30)

      // Order B: P3, P1, P2
      const itemsB: MaterialItem<number, TestLocation>[] = []
      applyForPlayer(itemsB, 3, 30)
      applyForPlayer(itemsB, 1, 10)
      applyForPlayer(itemsB, 2, 20)

      // Order C: P2, P3, P1
      const itemsC: MaterialItem<number, TestLocation>[] = []
      applyForPlayer(itemsC, 2, 20)
      applyForPlayer(itemsC, 3, 30)
      applyForPlayer(itemsC, 1, 10)

      expect(itemsA).toEqual(itemsB)
      expect(itemsA).toEqual(itemsC)
    })

    it('should be commutative with merge', () => {
      // Both players create items that merge with existing ones
      const existingItems: () => MaterialItem<number, TestLocation>[] = () => [
        { location: { type: TestLocation.Board, player: 1 }, quantity: 3 },
        { location: { type: TestLocation.Board, player: 2 }, quantity: 5 }
      ]
      const available = [2]

      // Order A: P1 adds 2 to their stack, then P2 adds 3 to their stack
      const itemsA = existingItems()
      const mutA = new MaterialMutator(TestMaterial.Token, itemsA, {}, true, '', { availableIndexes: available, players: [1, 2] })
      mutA.applyMove(createItemMove(TestMaterial.Token, { location: { type: TestLocation.Board, player: 1 }, quantity: 2 }))
      mutA.applyMove(createItemMove(TestMaterial.Token, { location: { type: TestLocation.Board, player: 2 }, quantity: 3 }))

      // Order B: P2 first, then P1
      const itemsB = existingItems()
      const mutB = new MaterialMutator(TestMaterial.Token, itemsB, {}, true, '', { availableIndexes: available, players: [1, 2] })
      mutB.applyMove(createItemMove(TestMaterial.Token, { location: { type: TestLocation.Board, player: 2 }, quantity: 3 }))
      mutB.applyMove(createItemMove(TestMaterial.Token, { location: { type: TestLocation.Board, player: 1 }, quantity: 2 }))

      expect(itemsA).toEqual(itemsB)
      expect(itemsA[0].quantity).toBe(5) // 3 + 2
      expect(itemsA[1].quantity).toBe(8) // 5 + 3
    })
  })

  describe('without interleaving (no simultaneous context)', () => {
    it('should use normal addItem behavior', () => {
      const items: MaterialItem<number, TestLocation>[] = [
        { location: { type: TestLocation.Board }, quantity: 0 } // tombstone
      ]
      const mutator = new MaterialMutator(TestMaterial.Card, items, {}, true, '')

      const move = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 1 } })
      mutator.applyMove(move)

      // Without interleaving, tombstone at index 0 should be reused
      expect(items.length).toBe(1)
      expect(items[0].location.player).toBe(1)
    })

})
})

// Integration test with MaterialRules
class TestSimultaneousRule extends SimultaneousRule<number, TestMaterial, TestLocation, TestRule> {
  getActivePlayerLegalMoves(_player: number): MaterialMove<number, TestMaterial, TestLocation, TestRule>[] {
    return []
  }

  getMovesAfterPlayersDone(): MaterialMove<number, TestMaterial, TestLocation, TestRule>[] {
    return []
  }
}

class TestRules extends MaterialRules<number, TestMaterial, TestLocation, TestRule> {
  rules: Record<TestRule, MaterialRulesPartCreator<number, TestMaterial, TestLocation, TestRule>> = {
    [TestRule.Simultaneous]: TestSimultaneousRule,
    [TestRule.PlayerTurn]: TestSimultaneousRule // placeholder
  }
  locationsStrategies = {}
}

function createTestGame(players: number[]): TestGame {
  return {
    players,
    items: {},
    memory: {}
  }
}

describe('MaterialRules interleaving integration', () => {

  it('should initialize interleaving on StartSimultaneousRule', () => {
    const game = createTestGame([1, 2, 3])
    const rules = new TestRules(game)
    rules.play(startSimultaneous())

    expect(game.rule).toBeDefined()
    expect(game.rule!.interleaving).toBeDefined()
    expect(game.rule!.interleaving!.players).toEqual([1, 2, 3])
    // availableIndexes is empty when no items exist yet
    expect(game.rule!.interleaving!.availableIndexes).toEqual({})
  })

  it('should initialize interleaving with subset of players', () => {
    const game = createTestGame([1, 2, 3])
    const rules = new TestRules(game)
    rules.play(startSimultaneous([3, 1]))

    expect(game.rule!.interleaving!.players).toEqual([1, 3]) // sorted
    expect(game.rule!.players).toEqual([3, 1]) // original order preserved
  })

  it('should eagerly initialize availableIndexes on StartSimultaneousRule', () => {
    const game = createTestGame([1, 2])
    game.items = { [TestMaterial.Card]: [{ location: { type: TestLocation.Board } }] }
    const rules = new TestRules(game)
    rules.play(startSimultaneous())

    // availableIndexes should be eagerly computed for existing types
    expect(game.rule!.interleaving!.availableIndexes[TestMaterial.Card]).toEqual([1])

    // Create an item for player 1
    const createMove = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 1 } })
    rules.play(createMove, { player: 1 })

    // availableIndexes should remain the same (computed at phase start)
    expect(game.rule!.interleaving!.availableIndexes[TestMaterial.Card]).toEqual([1])
  })

  it('should collect existing tombstones in availableIndexes at phase start', () => {
    const game = createTestGame([1, 2])
    game.items = {
      [TestMaterial.Card]: [
        { location: { type: TestLocation.Board }, quantity: 0 }, // tombstone at 0
        { location: { type: TestLocation.Board } },              // live at 1
        { location: { type: TestLocation.Board }, quantity: 0 }, // tombstone at 2
      ]
    }
    const rules = new TestRules(game)
    rules.play(startSimultaneous())

    // Should have eagerly collected tombstones at 0 and 2, plus array length 3
    expect(game.rule!.interleaving!.availableIndexes[TestMaterial.Card]).toEqual([0, 2, 3])

    // Create an item for player 1
    const createMove = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 1 } })
    rules.play(createMove, { player: 1 })

    // Player 1 (rank 0) should have used index 0 (first available for rank 0)
    expect(game.items[TestMaterial.Card]![0].location.player).toBe(1)
    expect(game.items[TestMaterial.Card]!.length).toBe(3) // no growth!
  })

  it('should produce commutative results through MaterialRules.play', () => {
    const player1Card = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 1 }, id: 1 })
    const player2Card = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 2 }, id: 2 })

    // Order A: player 1 then player 2
    const gameA = createTestGame([1, 2])
    const rulesA = new TestRules(gameA)
    rulesA.play(startSimultaneous())
    rulesA.play(player1Card, { player: 1 })
    rulesA.play(player2Card, { player: 2 })

    // Order B: player 2 then player 1
    const gameB = createTestGame([1, 2])
    const rulesB = new TestRules(gameB)
    rulesB.play(startSimultaneous())
    rulesB.play(player2Card, { player: 2 })
    rulesB.play(player1Card, { player: 1 })

    expect(gameA.items[TestMaterial.Card]).toEqual(gameB.items[TestMaterial.Card])
  })

  it('should not use interleaving without location.player', () => {
    const game = createTestGame([1, 2])
    const rules = new TestRules(game)
    rules.play(startSimultaneous())

    // Create without player (e.g., from onRuleStart consequences for shared items)
    const createMove = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Board } })
    rules.play(createMove)

    // Should use normal behavior (no interleaving)
    expect(game.items[TestMaterial.Card]!.length).toBe(1)
    expect(game.items[TestMaterial.Card]![0].location.type).toBe(TestLocation.Board)
  })

  it('should clear interleaving on rule change', () => {
    const game = createTestGame([1, 2])
    const rules = new TestRules(game)
    rules.play(startSimultaneous())
    expect(game.rule!.interleaving).toBeDefined()

    // Change to player turn
    rules.play({
      kind: MoveKind.RulesMove,
      type: RuleMoveType.StartPlayerTurn,
      id: TestRule.PlayerTurn,
      player: 1
    })
    expect(game.rule!.interleaving).toBeUndefined()
  })

  it('should keep interleaving players stable after EndPlayerTurn', () => {
    const game = createTestGame([1, 2, 3])
    const rules = new TestRules(game)
    rules.play(startSimultaneous())

    const originalInterleavingPlayers = [...game.rule!.interleaving!.players]

    // Player 1 ends their turn
    rules.play(endPlayerTurn(1))

    // The interleaving.players should NOT change (ranks must remain stable)
    expect(game.rule!.interleaving!.players).toEqual(originalInterleavingPlayers)
    // But rule.players should change
    expect(game.rule!.players).toEqual([2, 3])
  })

  it('should handle split MoveItem (quantity) during simultaneous phase', () => {
    const game = createTestGame([1, 2])
    game.items = {
      [TestMaterial.Token]: [
        { location: { type: TestLocation.Board, player: 1 }, quantity: 5 },
        { location: { type: TestLocation.Board, player: 2 }, quantity: 5 }
      ]
    }
    const rules = new TestRules(game)
    rules.play(startSimultaneous())

    // Player 1 moves 2 tokens from their stack to hand (splits the item)
    const moveP1 = {
      kind: MoveKind.ItemMove as const,
      type: ItemMoveType.Move as const,
      itemType: TestMaterial.Token,
      itemIndex: 0,
      location: { type: TestLocation.Hand, player: 1 },
      quantity: 2
    }

    // Player 2 moves 3 tokens from their stack to hand (splits the item)
    const moveP2 = {
      kind: MoveKind.ItemMove as const,
      type: ItemMoveType.Move as const,
      itemType: TestMaterial.Token,
      itemIndex: 1,
      location: { type: TestLocation.Hand, player: 2 },
      quantity: 3
    }

    // Order A
    const gameA = createTestGame([1, 2])
    gameA.items = {
      [TestMaterial.Token]: [
        { location: { type: TestLocation.Board, player: 1 }, quantity: 5 },
        { location: { type: TestLocation.Board, player: 2 }, quantity: 5 }
      ]
    }
    const rulesA = new TestRules(gameA)
    rulesA.play(startSimultaneous())
    rulesA.play(moveP1, { player: 1 })
    rulesA.play(moveP2, { player: 2 })

    // Order B
    const gameB = createTestGame([1, 2])
    gameB.items = {
      [TestMaterial.Token]: [
        { location: { type: TestLocation.Board, player: 1 }, quantity: 5 },
        { location: { type: TestLocation.Board, player: 2 }, quantity: 5 }
      ]
    }
    const rulesB = new TestRules(gameB)
    rulesB.play(startSimultaneous())
    rulesB.play(moveP2, { player: 2 })
    rulesB.play(moveP1, { player: 1 })

    expect(gameA.items[TestMaterial.Token]).toEqual(gameB.items[TestMaterial.Token])
  })

  it('should use item destination player for interleaving, not context.player', () => {
    // This tests the bug fix: when player A's action creates items for player B,
    // the items should use player B's interleaving slots, not player A's.
    const game = createTestGame([1, 2])
    const rules = new TestRules(game)
    rules.play(startSimultaneous())

    // Create items for BOTH players using context.player=1
    // (simulates onRuleStart triggered by player 1's EndTurn)
    const createForP1 = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 1 }, id: 10 })
    const createForP2 = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 2 }, id: 20 })
    rules.play(createForP1, { player: 1 })
    rules.play(createForP2, { player: 1 }) // Note: context.player=1 but item is for player 2

    // Player 1 (rank 0) should be at index 0
    // Player 2 (rank 1) should be at index 1
    expect(game.items[TestMaterial.Card]![0].id).toBe(10)
    expect(game.items[TestMaterial.Card]![0].location.player).toBe(1)
    expect(game.items[TestMaterial.Card]![1].id).toBe(20)
    expect(game.items[TestMaterial.Card]![1].location.player).toBe(2)

    // Now do the same but all with context.player=2 and verify same result
    const game2 = createTestGame([1, 2])
    const rules2 = new TestRules(game2)
    rules2.play(startSimultaneous())
    rules2.play(createForP1, { player: 2 }) // context.player=2 but item is for player 1
    rules2.play(createForP2, { player: 2 })

    expect(game2.items[TestMaterial.Card]).toEqual(game.items[TestMaterial.Card])
  })
})

describe('Index efficiency with tombstone reuse', () => {
  it('should reuse tombstones across simultaneous phases, keeping array compact', () => {
    const game = createTestGame([1, 2, 3, 4])
    const rules = new TestRules(game)

    // Phase 1: each player creates 3 tokens
    rules.play(startSimultaneous())
    for (const player of [1, 2, 3, 4]) {
      for (let i = 0; i < 3; i++) {
        rules.play(
          createItemMove(TestMaterial.Token, { location: { type: TestLocation.Hand, player }, id: player * 100 + i }),
          { player }
        )
      }
    }
    expect(game.items[TestMaterial.Token]!.length).toBe(12) // 4 players * 3 items

    // Simulate end of phase: delete half the tokens (6 items become tombstones)
    rules.play({ kind: MoveKind.RulesMove, type: RuleMoveType.StartPlayerTurn, id: TestRule.PlayerTurn, player: 1 })
    for (let i = 0; i < 6; i++) {
      rules.play({
        kind: MoveKind.ItemMove, type: ItemMoveType.Delete, itemType: TestMaterial.Token, itemIndex: i
      })
    }

    // Phase 2: new simultaneous phase, each player creates 3 more tokens
    rules.play(startSimultaneous())
    for (const player of [1, 2, 3, 4]) {
      for (let i = 0; i < 3; i++) {
        rules.play(
          createItemMove(TestMaterial.Token, { location: { type: TestLocation.Hand, player }, id: player * 1000 + i }),
          { player }
        )
      }
    }

    // With the old system (baseIndex), array would grow to 12 + 12 = 24
    // With tombstone reuse, 6 tombstones are reused, so array grows by only 6
    expect(game.items[TestMaterial.Token]!.length).toBe(18) // 12 + 6 new (6 reused tombstones)

    // Verify all new items exist
    const liveItems = game.items[TestMaterial.Token]!.filter(item => item.quantity !== 0)
    expect(liveItems.length).toBe(18) // 6 survived from phase 1 + 12 new from phase 2
  })

  it('should be commutative with tombstone reuse across phases', () => {
    // Phase 1: create items, then delete some, then phase 2 creates more
    const setupGame = () => {
      const game = createTestGame([1, 2])
      const rules = new TestRules(game)
      rules.play(startSimultaneous())
      // Each player creates 2 items
      for (const player of [1, 2]) {
        for (let i = 0; i < 2; i++) {
          rules.play(
            createItemMove(TestMaterial.Token, { location: { type: TestLocation.Hand, player }, id: player * 10 + i }),
            { player }
          )
        }
      }
      // End phase, delete items at index 0 and 2
      rules.play({ kind: MoveKind.RulesMove, type: RuleMoveType.StartPlayerTurn, id: TestRule.PlayerTurn, player: 1 })
      rules.play({ kind: MoveKind.ItemMove, type: ItemMoveType.Delete, itemType: TestMaterial.Token, itemIndex: 0 })
      rules.play({ kind: MoveKind.ItemMove, type: ItemMoveType.Delete, itemType: TestMaterial.Token, itemIndex: 2 })
      // Start new simultaneous phase
      rules.play(startSimultaneous())
      return { game, rules }
    }

    // Order A: player 1 first
    const { game: gameA, rules: rulesA } = setupGame()
    rulesA.play(createItemMove(TestMaterial.Token, { location: { type: TestLocation.Hand, player: 1 }, id: 100 }), { player: 1 })
    rulesA.play(createItemMove(TestMaterial.Token, { location: { type: TestLocation.Hand, player: 2 }, id: 200 }), { player: 2 })

    // Order B: player 2 first
    const { game: gameB, rules: rulesB } = setupGame()
    rulesB.play(createItemMove(TestMaterial.Token, { location: { type: TestLocation.Hand, player: 2 }, id: 200 }), { player: 2 })
    rulesB.play(createItemMove(TestMaterial.Token, { location: { type: TestLocation.Hand, player: 1 }, id: 100 }), { player: 1 })

    expect(gameA.items[TestMaterial.Token]).toEqual(gameB.items[TestMaterial.Token])
    // Tombstones should have been reused, no array growth
    expect(gameA.items[TestMaterial.Token]!.length).toBe(4)
  })
})

describe('Delete then create commutativity (production phase scenario)', () => {
  it('should be commutative when players delete and create items in the same phase', () => {
    // This test reproduces the bug where lazy availableIndexes initialization
    // caused different indices depending on move order, because deletes during
    // the phase created new tombstones that were picked up by lazy init.

    const setupGame = () => {
      const game = createTestGame([1, 2])
      // Each player starts with 3 resource cubes
      game.items = {
        [TestMaterial.Token]: [
          { location: { type: TestLocation.Board, player: 1 }, id: 1 },
          { location: { type: TestLocation.Board, player: 1 }, id: 2 },
          { location: { type: TestLocation.Board, player: 1 }, id: 3 },
          { location: { type: TestLocation.Board, player: 2 }, id: 4 },
          { location: { type: TestLocation.Board, player: 2 }, id: 5 },
          { location: { type: TestLocation.Board, player: 2 }, id: 6 },
        ]
      }
      const rules = new TestRules(game)
      rules.play(startSimultaneous())
      return { game, rules }
    }

    // Simulate: each player deletes 2 cubes then creates 1 cube (like producing resources)
    const deleteP1_0: MaterialMove<number, TestMaterial, TestLocation, TestRule> = {
      kind: MoveKind.ItemMove, type: ItemMoveType.Delete, itemType: TestMaterial.Token, itemIndex: 0
    }
    const deleteP1_1: MaterialMove<number, TestMaterial, TestLocation, TestRule> = {
      kind: MoveKind.ItemMove, type: ItemMoveType.Delete, itemType: TestMaterial.Token, itemIndex: 1
    }
    const createP1 = createItemMove(TestMaterial.Token, { location: { type: TestLocation.Hand, player: 1 }, id: 100 })

    const deleteP2_0: MaterialMove<number, TestMaterial, TestLocation, TestRule> = {
      kind: MoveKind.ItemMove, type: ItemMoveType.Delete, itemType: TestMaterial.Token, itemIndex: 3
    }
    const deleteP2_1: MaterialMove<number, TestMaterial, TestLocation, TestRule> = {
      kind: MoveKind.ItemMove, type: ItemMoveType.Delete, itemType: TestMaterial.Token, itemIndex: 4
    }
    const createP2 = createItemMove(TestMaterial.Token, { location: { type: TestLocation.Hand, player: 2 }, id: 200 })

    // Order A: player 1 first
    const { game: gameA, rules: rulesA } = setupGame()
    rulesA.play(deleteP1_0, { player: 1 })
    rulesA.play(deleteP1_1, { player: 1 })
    rulesA.play(createP1, { player: 1 })
    rulesA.play(deleteP2_0, { player: 2 })
    rulesA.play(deleteP2_1, { player: 2 })
    rulesA.play(createP2, { player: 2 })

    // Order B: player 2 first
    const { game: gameB, rules: rulesB } = setupGame()
    rulesB.play(deleteP2_0, { player: 2 })
    rulesB.play(deleteP2_1, { player: 2 })
    rulesB.play(createP2, { player: 2 })
    rulesB.play(deleteP1_0, { player: 1 })
    rulesB.play(deleteP1_1, { player: 1 })
    rulesB.play(createP1, { player: 1 })

    // Must produce the same result regardless of order
    expect(gameA.items[TestMaterial.Token]).toEqual(gameB.items[TestMaterial.Token])
  })
})

describe('isUnpredictableMove during simultaneous phase', () => {
  it('should mark rule-changing moves as unpredictable during simultaneous phase', () => {
    const game = createTestGame([1, 2])
    const rules = new TestRules(game)
    rules.play(startSimultaneous())

    // StartPlayerTurn should be unpredictable during simultaneous phase
    const startPlayerTurnMove = {
      kind: MoveKind.RulesMove as const,
      type: RuleMoveType.StartPlayerTurn as const,
      id: TestRule.PlayerTurn,
      player: 1
    }
    expect(rules.isUnpredictableMove(startPlayerTurnMove, 1)).toBe(true)

    // StartRule should be unpredictable
    const startRuleMove = {
      kind: MoveKind.RulesMove as const,
      type: RuleMoveType.StartRule as const,
      id: TestRule.PlayerTurn
    }
    expect(rules.isUnpredictableMove(startRuleMove, 1)).toBe(true)

    // EndGame should be unpredictable
    const endGameMove = {
      kind: MoveKind.RulesMove as const,
      type: RuleMoveType.EndGame as const
    }
    expect(rules.isUnpredictableMove(endGameMove, 1)).toBe(true)

    // EndPlayerTurn should NOT be unpredictable (it's the player's own move)
    expect(rules.isUnpredictableMove(endPlayerTurn(1), 1)).toBe(false)

    // Item moves should NOT be unpredictable (unless roll)
    const createMove = createItemMove(TestMaterial.Card, { location: { type: TestLocation.Hand, player: 1 } })
    expect(rules.isUnpredictableMove(createMove, 1)).toBe(false)
  })

  it('should NOT mark rule-changing moves as unpredictable outside simultaneous phase', () => {
    const game = createTestGame([1, 2])
    const rules = new TestRules(game)

    // Start a player turn (not simultaneous)
    rules.play({
      kind: MoveKind.RulesMove,
      type: RuleMoveType.StartPlayerTurn,
      id: TestRule.PlayerTurn,
      player: 1
    })

    // StartPlayerTurn consequence should NOT be unpredictable
    const startPlayerTurnMove = {
      kind: MoveKind.RulesMove as const,
      type: RuleMoveType.StartPlayerTurn as const,
      id: TestRule.PlayerTurn,
      player: 2
    }
    expect(rules.isUnpredictableMove(startPlayerTurnMove, 1)).toBe(false)
  })

  it('should still mark rule moves as unpredictable after all players ended turn (interleaving persists)', () => {
    const game = createTestGame([1, 2])
    const rules = new TestRules(game)
    rules.play(startSimultaneous())

    // Both players end their turn
    rules.play(endPlayerTurn(1))
    rules.play(endPlayerTurn(2))

    // interleaving is still present even though players is empty
    expect(game.rule!.interleaving).toBeDefined()
    expect(game.rule!.players).toEqual([])

    // Rule change should still be unpredictable
    const startPlayerTurnMove = {
      kind: MoveKind.RulesMove as const,
      type: RuleMoveType.StartPlayerTurn as const,
      id: TestRule.PlayerTurn,
      player: 1
    }
    expect(rules.isUnpredictableMove(startPlayerTurnMove, 1)).toBe(true)
  })
})
