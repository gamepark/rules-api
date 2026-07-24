import { describe, expect, it } from 'vitest'
import { Action } from '../Action'
import {
  HiddenMaterialRules,
  hideFront,
  hideFrontToOthers,
  hideItemId,
  hideItemIdToOthers,
  ItemMoveType,
  MaterialGame,
  MaterialItem,
  MaterialMove,
  MaterialRulesPart,
  MaterialRulesPartCreator,
  MoveKind,
  SecretMaterialRules
} from '../material'

enum M { Card = 1, Token = 2 }

enum L { Deck = 1, Hand = 2, Table = 3 }

enum R { Play = 1 }

type Move = MaterialMove<number, M, L, R>
type Game = MaterialGame<number, M, L, R>

class PlayRule extends MaterialRulesPart<number, M, L, R> {}

// Hidden information: cards in the Deck have their id hidden from everyone
class HiddenRules extends HiddenMaterialRules<number, M, L, R> {
  rules: Record<R, MaterialRulesPartCreator<number, M, L, R>> = { [R.Play]: PlayRule }
  locationsStrategies = {}
  hidingStrategies = { [M.Card]: { [L.Deck]: hideItemId } }

  publicMoveBlocksUndo(move: Move, player?: number) { return this.moveBlocksUndo(move, player) }
  publicMoveRevealedSomething(move: Move) { return this.moveRevealedSomething(move) }
}

// Secret information: the Deck is hidden from everyone, a Hand is hidden from the other players
class SecretRules extends SecretMaterialRules<number, M, L, R> {
  rules: Record<R, MaterialRulesPartCreator<number, M, L, R>> = { [R.Play]: PlayRule }
  locationsStrategies = {}
  hidingStrategies = { [M.Card]: { [L.Deck]: hideItemId, [L.Hand]: hideItemIdToOthers } }
}

const game = (items: Game['items']): Game => ({ players: [1, 2], items, memory: {}, rule: { id: R.Play, player: 1 } })

const moveCard = (itemIndex: number, location: any, extra: any = {}): Move =>
  ({ kind: MoveKind.ItemMove, type: ItemMoveType.Move, itemType: M.Card, itemIndex, location, ...extra })
const createCard = (item: MaterialItem<number, L>): Move =>
  ({ kind: MoveKind.ItemMove, type: ItemMoveType.Create, itemType: M.Card, item })

describe('HiddenMaterialRules', () => {

  describe('itemsCanMerge', () => {
    it('should prevent merging for types with a hiding strategy', () => {
      const rules = new HiddenRules(game({}))
      expect(rules.itemsCanMerge(M.Card)).toBe(false)
      expect(rules.itemsCanMerge(M.Token)).toBe(true)
    })
  })

  describe('getView', () => {
    it('should hide the id of items at a hidden location', () => {
      const rules = new HiddenRules(game({
        [M.Card]: [{ location: { type: L.Deck }, id: 5 }, { location: { type: L.Table }, id: 6 }]
      }))
      const view = rules.getView()
      expect(view.items[M.Card]![0].id).toBeUndefined() // hidden in the deck
      expect(view.items[M.Card]![1].id).toBe(6) // visible on the table
    })

    it('should leave types without a hiding strategy untouched', () => {
      const rules = new HiddenRules(game({ [M.Token]: [{ location: { type: L.Deck }, id: 7 }] }))
      expect(rules.getView().items[M.Token]![0].id).toBe(7)
    })
  })

  describe('isUnpredictableMove', () => {
    it('should be true when creating an item with hidden information', () => {
      const rules = new HiddenRules(game({}))
      expect(rules.isUnpredictableMove(createCard({ location: { type: L.Deck }, id: 1 }), 1)).toBe(true)
      expect(rules.isUnpredictableMove(createCard({ location: { type: L.Table }, id: 1 }), 1)).toBe(false)
    })

    it('should be true when a move reveals hidden information', () => {
      const rules = new HiddenRules(game({ [M.Card]: [{ location: { type: L.Deck }, id: 5 }] }))
      expect(rules.isUnpredictableMove(moveCard(0, { type: L.Table }), 1)).toBe(true) // deck -> table reveals id
      expect(rules.isUnpredictableMove(moveCard(0, { type: L.Deck, x: 1 }), 1)).toBe(false) // stays hidden
    })

    it('should be true for a shuffle', () => {
      const rules = new HiddenRules(game({ [M.Card]: [{ location: { type: L.Deck }, id: 1 }] }))
      expect(rules.isUnpredictableMove({ kind: MoveKind.ItemMove, type: ItemMoveType.Shuffle, itemType: M.Card, indexes: [0] }, 1)).toBe(true)
    })
  })

  describe('randomize', () => {
    it('should flag a revealing move with an empty reveal', () => {
      const rules = new HiddenRules(game({ [M.Card]: [{ location: { type: L.Deck }, id: 5 }] }))
      const randomized: any = rules.randomize(moveCard(0, { type: L.Table }), 1)
      expect(randomized.reveal).toEqual({})
    })

    it('should not flag a non-revealing move', () => {
      const rules = new HiddenRules(game({ [M.Card]: [{ location: { type: L.Deck }, id: 5 }] }))
      const randomized: any = rules.randomize(moveCard(0, { type: L.Deck, x: 1 }), 1)
      expect(randomized.reveal).toBeUndefined()
    })

    it('should not flag anything without a player', () => {
      const rules = new HiddenRules(game({ [M.Card]: [{ location: { type: L.Deck }, id: 5 }] }))
      const randomized: any = rules.randomize(moveCard(0, { type: L.Table }))
      expect(randomized.reveal).toBeUndefined()
    })
  })

  describe('moveRevealedSomething & moveBlocksUndo', () => {
    it('should detect a move flagged with reveal', () => {
      const rules = new HiddenRules(game({}))
      expect(rules.publicMoveRevealedSomething(moveCard(0, { type: L.Table }, { reveal: { id: 5 } }))).toBe(true)
      expect(rules.publicMoveRevealedSomething(moveCard(0, { type: L.Table }))).toBe(false)
    })

    it('should block undo for a move that revealed something', () => {
      const rules = new HiddenRules(game({}))
      expect(rules.publicMoveBlocksUndo(moveCard(0, { type: L.Table }, { reveal: { id: 5 } }))).toBe(true)
    })

    it('should block undo through canUndo for a revealing action', () => {
      const rules = new HiddenRules(game({}))
      const action: Action<Move, number> = { playerId: 1, move: moveCard(0, { type: L.Table }, { reveal: { id: 5 } }), consequences: [] }
      expect(rules.canUndo(action, [])).toBe(false)
    })
  })

  describe('canIgnoreServerDifference', () => {
    it('should ignore a server move that only added a reveal', () => {
      const rules = new HiddenRules(game({}))
      const clientMove = moveCard(0, { type: L.Table })
      const serverMove = { ...clientMove, reveal: { id: 5 } }
      expect(rules.canIgnoreServerDifference(clientMove, serverMove)).toBe(true)
    })

    it('should not ignore a genuine difference', () => {
      const rules = new HiddenRules(game({}))
      expect(rules.canIgnoreServerDifference(moveCard(0, { type: L.Table }), moveCard(0, { type: L.Hand }))).toBe(false)
    })

    it('should return false for non-move moves', () => {
      const rules = new HiddenRules(game({}))
      expect(rules.canIgnoreServerDifference(createCard({ location: { type: L.Deck } }), createCard({ location: { type: L.Deck } }))).toBe(false)
    })
  })

  describe('getMoveView', () => {
    it('should hide the id when creating an item at a hidden location', () => {
      const rules = new HiddenRules(game({}))
      const view: any = rules.getMoveView(createCard({ location: { type: L.Deck }, id: 5 }) as any)
      expect(view.item.id).toBeUndefined()
    })

    it('should keep the id when creating at a visible location', () => {
      const rules = new HiddenRules(game({}))
      const view: any = rules.getMoveView(createCard({ location: { type: L.Table }, id: 5 }) as any)
      expect(view.item.id).toBe(5)
    })

    it('should add the revealed value when a move exposes hidden information', () => {
      const rules = new HiddenRules(game({ [M.Card]: [{ location: { type: L.Deck }, id: 5 }] }))
      const view: any = rules.getMoveView(moveCard(0, { type: L.Table }) as any)
      expect(view.reveal).toEqual({ id: 5 })
    })

    it('should not reveal anything for a move that keeps the item hidden', () => {
      const rules = new HiddenRules(game({ [M.Card]: [{ location: { type: L.Deck }, id: 5 }] }))
      const view: any = rules.getMoveView(moveCard(0, { type: L.Deck, x: 1 }) as any)
      expect(view.reveal).toBeUndefined()
    })

    it('should strip newIndexes when the shuffle result must stay hidden', () => {
      const rules = new HiddenRules(game({ [M.Card]: [{ location: { type: L.Deck }, id: 1 }, { location: { type: L.Deck }, id: 2 }] }))
      const view: any = rules.getMoveView({ kind: MoveKind.ItemMove, type: ItemMoveType.Shuffle, itemType: M.Card, indexes: [0, 1], newIndexes: [1, 0] } as any)
      expect(view.newIndexes).toBeUndefined()
    })

    it('should keep newIndexes when the shuffled items are visible', () => {
      const rules = new HiddenRules(game({ [M.Card]: [{ location: { type: L.Table }, id: 1 }, { location: { type: L.Table }, id: 2 }] }))
      const view: any = rules.getMoveView({ kind: MoveKind.ItemMove, type: ItemMoveType.Shuffle, itemType: M.Card, indexes: [0, 1], newIndexes: [1, 0] } as any)
      expect(view.newIndexes).toEqual([1, 0])
    })

    it('should leave moves of non-hidden types unchanged', () => {
      const rules = new HiddenRules(game({ [M.Token]: [{ location: { type: L.Deck }, id: 9 }] }))
      const move: any = { kind: MoveKind.ItemMove, type: ItemMoveType.Move, itemType: M.Token, itemIndex: 0, location: { type: L.Table } }
      expect(rules.getMoveView(move)).toBe(move)
    })
  })

  describe('play with a client re-hides items', () => {
    it('should re-hide a moved item from the client player', () => {
      const g = game({ [M.Card]: [{ location: { type: L.Hand, player: 1 }, id: 9 }] })
      const rules = new SecretRules(g, { player: 2 })
      rules.play(moveCard(0, { type: L.Hand, player: 1, x: 1 }))
      expect(g.items[M.Card]![0].id).toBeUndefined() // hidden from player 2
    })

    it('should not re-hide without a client', () => {
      const g = game({ [M.Card]: [{ location: { type: L.Hand, player: 1 }, id: 9 }] })
      const rules = new SecretRules(g)
      rules.play(moveCard(0, { type: L.Hand, player: 1, x: 1 }))
      expect(g.items[M.Card]![0].id).toBe(9)
    })
  })
})

describe('hiding strategy helpers', () => {
  const card = (player?: number): MaterialItem<number, L> => ({ location: { type: L.Hand, player }, id: 1 })

  it('hideItemId should hide the whole id', () => {
    expect(hideItemId(card())).toEqual(['id'])
  })

  it('hideFront should hide only the front of a composite id', () => {
    expect(hideFront(card())).toEqual(['id.front'])
  })

  it('hideItemIdToOthers should hide from everyone but the owner', () => {
    expect(hideItemIdToOthers(card(1), 1)).toEqual([]) // owner sees it
    expect(hideItemIdToOthers(card(1), 2)).toEqual(['id']) // opponent does not
    expect(hideItemIdToOthers(card(1))).toEqual(['id']) // spectator does not
  })

  it('hideFrontToOthers should hide the front from everyone but the owner', () => {
    expect(hideFrontToOthers(card(1), 1)).toEqual([])
    expect(hideFrontToOthers(card(1), 2)).toEqual(['id.front'])
  })
})

describe('HiddenMaterialRules - AtOnce variants', () => {
  const createAtOnce = (items: MaterialItem<number, L>[]): Move =>
    ({ kind: MoveKind.ItemMove, type: ItemMoveType.CreateAtOnce, itemType: M.Card, items })
  const moveAtOnce = (indexes: number[], location: any, extra: any = {}): Move =>
    ({ kind: MoveKind.ItemMove, type: ItemMoveType.MoveAtOnce, itemType: M.Card, indexes, location, ...extra })

  it('should be unpredictable when a CreateItemsAtOnce holds a hidden item', () => {
    const rules = new HiddenRules(game({}))
    expect(rules.isUnpredictableMove(createAtOnce([{ location: { type: L.Table }, id: 1 }, { location: { type: L.Deck }, id: 2 }]), 1)).toBe(true)
    expect(rules.isUnpredictableMove(createAtOnce([{ location: { type: L.Table }, id: 1 }]), 1)).toBe(false)
  })

  it('should be unpredictable when a MoveItemsAtOnce reveals information', () => {
    const rules = new HiddenRules(game({ [M.Card]: [{ location: { type: L.Deck }, id: 5 }, { location: { type: L.Deck }, id: 6 }] }))
    expect(rules.isUnpredictableMove(moveAtOnce([0, 1], { type: L.Table }), 1)).toBe(true)
  })

  it('should flag a revealing MoveItemsAtOnce during randomize', () => {
    const rules = new HiddenRules(game({ [M.Card]: [{ location: { type: L.Deck }, id: 5 }] }))
    const randomized: any = rules.randomize(moveAtOnce([0], { type: L.Table }), 1)
    expect(randomized.reveal).toEqual({})
  })

  it('should hide the items of a CreateItemsAtOnce view', () => {
    const rules = new HiddenRules(game({}))
    const view: any = rules.getMoveView(createAtOnce([{ location: { type: L.Deck }, id: 5 }]) as any)
    expect(view.items[0].id).toBeUndefined()
  })

  it('should reveal per-index in a MoveItemsAtOnce view', () => {
    const rules = new HiddenRules(game({ [M.Card]: [{ location: { type: L.Deck }, id: 5 }, { location: { type: L.Deck }, id: 6 }] }))
    const view: any = rules.getMoveView(moveAtOnce([0, 1], { type: L.Table }) as any)
    expect(view.reveal).toEqual({ 0: { id: 5 }, 1: { id: 6 } })
  })

  it('should not reveal for a MoveItemsAtOnce that stays hidden', () => {
    const rules = new HiddenRules(game({ [M.Card]: [{ location: { type: L.Deck }, id: 5 }] }))
    const view: any = rules.getMoveView(moveAtOnce([0], { type: L.Deck, x: 1 }) as any)
    expect(view.reveal).toBeUndefined()
  })

  it('should re-hide items of a MoveItemsAtOnce for the client', () => {
    const g = game({ [M.Card]: [{ location: { type: L.Hand, player: 1 }, id: 9 }, { location: { type: L.Hand, player: 1 }, id: 10 }] })
    const rules = new SecretRules(g, { player: 2 })
    rules.play(moveAtOnce([0, 1], { type: L.Hand, player: 1, x: 1 }))
    expect(g.items[M.Card]![0].id).toBeUndefined()
    expect(g.items[M.Card]![1].id).toBeUndefined()
  })
})

describe('SecretMaterialRules', () => {

  const secret = () => new SecretRules(game({
    [M.Card]: [
      { location: { type: L.Hand, player: 1 }, id: 1 },
      { location: { type: L.Hand, player: 2 }, id: 2 }
    ]
  }))

  describe('getPlayerView', () => {
    it('should show a player their own cards and hide the opponents', () => {
      const view = secret().getPlayerView(1)
      expect(view.items[M.Card]![0].id).toBe(1) // own hand visible
      expect(view.items[M.Card]![1].id).toBeUndefined() // opponent hand hidden
    })

    it('should hide everything from a spectator', () => {
      const view = secret().getPlayerView(undefined as any)
      expect(view.items[M.Card]![0].id).toBeUndefined()
      expect(view.items[M.Card]![1].id).toBeUndefined()
    })
  })

  describe('getPlayerMoveView', () => {
    it('should reveal a card drawn into the owner hand only to that player', () => {
      const rules = new SecretRules(game({ [M.Card]: [{ location: { type: L.Deck }, id: 5 }] }))
      // Deck has no hiding strategy here, Hand hides from others: moving to player 2's hand reveals to player 2
      const viewForOwner: any = rules.getPlayerMoveView(moveCard(0, { type: L.Hand, player: 2 }) as any, 2)
      const viewForOther: any = rules.getPlayerMoveView(moveCard(0, { type: L.Hand, player: 2 }) as any, 1)
      expect(viewForOwner.reveal).toEqual({ id: 5 })
      expect(viewForOther.reveal).toBeUndefined()
    })
  })
})
