import { describe, expect, it, vi } from 'vitest'
import {
  ItemMoveType,
  LocationStrategy,
  MaterialItem,
  MaterialMutator,
  MoveKind,
  PositiveSequenceStrategy
} from '../material'

enum M { Card = 1, Token = 2 }

enum L { Hand = 1, Board = 2, Deck = 3 }

type Item = MaterialItem<number, L>

const create = (item: Item, itemType: M = M.Card) =>
  ({ kind: MoveKind.ItemMove as const, type: ItemMoveType.Create as const, itemType, item })

const createAtOnce = (items: Item[], itemType: M = M.Card) =>
  ({ kind: MoveKind.ItemMove as const, type: ItemMoveType.CreateAtOnce as const, itemType, items })

const move = (itemIndex: number, location: Partial<Item['location']>, extra: { quantity?: number, reveal?: any } = {}) =>
  ({ kind: MoveKind.ItemMove as const, type: ItemMoveType.Move as const, itemType: M.Card, itemIndex, location, ...extra })

const moveAtOnce = (indexes: number[], location: Partial<Item['location']>, reveal?: Record<number, any>) =>
  ({ kind: MoveKind.ItemMove as const, type: ItemMoveType.MoveAtOnce as const, itemType: M.Card, indexes, location, reveal })

const del = (itemIndex: number, quantity?: number) =>
  ({ kind: MoveKind.ItemMove as const, type: ItemMoveType.Delete as const, itemType: M.Card, itemIndex, quantity })

const deleteAtOnce = (indexes: number[]) =>
  ({ kind: MoveKind.ItemMove as const, type: ItemMoveType.DeleteAtOnce as const, itemType: M.Card, indexes })

const roll = (itemIndex: number, location: Item['location']) =>
  ({ kind: MoveKind.ItemMove as const, type: ItemMoveType.Roll as const, itemType: M.Card, itemIndex, location })

const select = (itemIndex: number, extra: { quantity?: number, selected?: boolean } = {}) =>
  ({ kind: MoveKind.ItemMove as const, type: ItemMoveType.Select as const, itemType: M.Card, itemIndex, ...extra })

const mutator = (items: Item[], canMerge = true, strategies = {}) =>
  new MaterialMutator<number, M, L>(M.Card, items, strategies, canMerge)

describe('MaterialMutator (non-simultaneous)', () => {

  describe('create', () => {
    it('should append a new item as a deep copy', () => {
      const items: Item[] = []
      const source: Item = { location: { type: L.Board, x: 1 } }
      mutator(items).applyMove(create(source))
      expect(items).toHaveLength(1)
      expect(items[0]).toEqual(source)
      // mutating the original must not affect the stored item (deep copy)
      source.location.x = 99
      expect(items[0].location.x).toBe(1)
    })

    it('should merge a new item into an identical existing item', () => {
      const items: Item[] = [{ location: { type: L.Board }, id: 7 }]
      mutator(items).applyMove(create({ location: { type: L.Board }, id: 7 }))
      expect(items).toHaveLength(1)
      expect(items[0].quantity).toBe(2)
    })

    it('should sum quantities when merging', () => {
      const items: Item[] = [{ location: { type: L.Board }, id: 7, quantity: 3 }]
      mutator(items).applyMove(create({ location: { type: L.Board }, id: 7, quantity: 2 }))
      expect(items[0].quantity).toBe(5)
    })

    it('should reuse a tombstone slot instead of growing the array', () => {
      const items: Item[] = [{ location: { type: L.Board }, quantity: 0 }]
      mutator(items).applyMove(create({ location: { type: L.Hand }, id: 1 }))
      expect(items).toHaveLength(1)
      expect(items[0].location.type).toBe(L.Hand)
    })

    it('should not merge when canMerge is false', () => {
      const items: Item[] = [{ location: { type: L.Board }, id: 7 }]
      mutator(items, false).applyMove(create({ location: { type: L.Board }, id: 7 }))
      expect(items).toHaveLength(2)
    })

    it('should create every item of a CreateAtOnce move', () => {
      const items: Item[] = []
      mutator(items).applyMove(createAtOnce([
        { location: { type: L.Board }, id: 1 },
        { location: { type: L.Board }, id: 2 }
      ]))
      expect(items.map(i => i.id)).toEqual([1, 2])
    })
  })

  describe('move', () => {
    it('should relocate an item in place for a full move', () => {
      const items: Item[] = [{ location: { type: L.Hand, player: 1 }, id: 5 }]
      mutator(items).applyMove(move(0, { type: L.Board }))
      expect(items).toHaveLength(1)
      expect(items[0].location.type).toBe(L.Board)
      expect(items[0].id).toBe(5)
    })

    it('should split the stack when moving part of a quantity', () => {
      const items: Item[] = [{ location: { type: L.Deck }, id: 5, quantity: 3 }]
      mutator(items).applyMove(move(0, { type: L.Hand, player: 1 }, { quantity: 1 }))
      expect(items).toHaveLength(2)
      expect(items[0].quantity).toBe(2)
      expect(items[1].location.type).toBe(L.Hand)
      expect(items[1].quantity).toBe(1)
    })

    it('should move the whole quantity when the move has none', () => {
      const items: Item[] = [{ location: { type: L.Deck }, id: 5, quantity: 3 }]
      mutator(items).applyMove(move(0, { type: L.Hand, player: 1 }))
      expect(items).toHaveLength(1)
      expect(items[0].location.type).toBe(L.Hand)
      expect(items[0].quantity).toBe(3)
    })

    it('should move the whole quantity into an identical item at the destination', () => {
      const items: Item[] = [
        { location: { type: L.Deck }, id: 9, quantity: 3 },
        { location: { type: L.Hand, player: 1 }, id: 9, quantity: 2 }
      ]
      mutator(items).applyMove(move(0, { type: L.Hand, player: 1 }))
      expect(items[0].quantity).toBe(0) // source becomes a tombstone
      expect(items[1].quantity).toBe(5)
    })

    it('should merge into an identical item at the destination', () => {
      const items: Item[] = [
        { location: { type: L.Board }, id: 9 },
        { location: { type: L.Hand, player: 1 }, id: 9, quantity: 3 }
      ]
      mutator(items).applyMove(move(0, { type: L.Hand, player: 1 }))
      expect(items[0].quantity).toBe(0) // source becomes a tombstone
      expect(items[1].quantity).toBe(4)
    })

    it('should only change the given coordinate for a partial (type-less) move', () => {
      const items: Item[] = [{ location: { type: L.Board, x: 0, y: 5 }, id: 1 }]
      mutator(items).applyMove(move(0, { x: 3 }))
      expect(items[0].location).toEqual({ type: L.Board, x: 3, y: 5 })
    })

    it('should apply reveal information during a move', () => {
      const items: Item[] = [{ location: { type: L.Deck } }]
      mutator(items).applyMove(move(0, { type: L.Hand, player: 1 }, { reveal: { id: 42 } }))
      expect(items[0].id).toBe(42)
    })

    it('should throw when moving an item with quantity 0', () => {
      const items: Item[] = [{ location: { type: L.Board }, quantity: 0 }]
      expect(() => mutator(items).applyMove(move(0, { type: L.Hand }))).toThrow(/quantity 0/)
    })
  })

  describe('roll', () => {
    it('should move the item to the new location, keeping its other properties', () => {
      const items: Item[] = [{ location: { type: L.Board }, id: 3 }]
      mutator(items).applyMove(roll(0, { type: L.Board, rotation: 4 }))
      expect(items[0].id).toBe(3)
      expect(items[0].location.rotation).toBe(4)
    })
  })

  describe('delete', () => {
    it('should turn an item into a tombstone', () => {
      const items: Item[] = [{ location: { type: L.Board }, id: 1 }]
      mutator(items).applyMove(del(0))
      expect(items[0].quantity).toBe(0)
    })

    it('should delete the whole quantity when no quantity is given', () => {
      const items: Item[] = [{ location: { type: L.Board }, id: 1, quantity: 5 }]
      mutator(items).applyMove(del(0))
      expect(items[0].quantity).toBe(0)
    })

    it('should decrement the quantity for a partial delete', () => {
      const items: Item[] = [{ location: { type: L.Board }, id: 1, quantity: 5 }]
      mutator(items).applyMove(del(0, 2))
      expect(items[0].quantity).toBe(3)
    })

    it('should never go below zero', () => {
      const items: Item[] = [{ location: { type: L.Board }, id: 1, quantity: 2 }]
      mutator(items).applyMove(del(0, 10))
      expect(items[0].quantity).toBe(0)
    })

    it('should throw when deleting an item with quantity 0', () => {
      const items: Item[] = [{ location: { type: L.Board }, quantity: 0 }]
      expect(() => mutator(items).applyMove(del(0))).toThrow(/quantity 0/)
    })

    it('should turn every listed item into a tombstone for DeleteAtOnce', () => {
      const items: Item[] = [
        { location: { type: L.Board }, id: 1, quantity: 4 },
        { location: { type: L.Board }, id: 2 },
        { location: { type: L.Board }, id: 3 }
      ]
      mutator(items).applyMove(deleteAtOnce([0, 2]))
      expect(items[0].quantity).toBe(0)
      expect(items[1].quantity).toBeUndefined()
      expect(items[2].quantity).toBe(0)
    })
  })

  describe('moveAtOnce', () => {
    it('should move every listed item to the same location', () => {
      const items: Item[] = [
        { location: { type: L.Hand, player: 1 }, id: 1 },
        { location: { type: L.Board }, id: 2 }
      ]
      mutator(items).applyMove(moveAtOnce([0, 1], { type: L.Deck }))
      expect(items[0].location.type).toBe(L.Deck)
      expect(items[1].location.type).toBe(L.Deck)
    })

    it('should apply per-index reveal information', () => {
      const items: Item[] = [
        { location: { type: L.Deck } },
        { location: { type: L.Deck } }
      ]
      mutator(items).applyMove(moveAtOnce([0, 1], { type: L.Hand, player: 1 }, { 1: { id: 8 } }))
      expect(items[0].id).toBeUndefined()
      expect(items[1].id).toBe(8)
    })
  })

  describe('shuffle', () => {
    it('should do nothing when the move is not randomized', () => {
      const items: Item[] = [{ location: { type: L.Deck }, id: 1 }, { location: { type: L.Deck }, id: 2 }]
      mutator(items).applyMove({ kind: MoveKind.ItemMove, type: ItemMoveType.Shuffle, itemType: M.Card, indexes: [0, 1] })
      expect(items.map(i => i.id)).toEqual([1, 2])
    })

    it('should swap item data while keeping each slot location when randomized', () => {
      const items: Item[] = [
        { location: { type: L.Deck, x: 0 }, id: 1 },
        { location: { type: L.Deck, x: 1 }, id: 2 }
      ]
      mutator(items).applyMove({
        kind: MoveKind.ItemMove, type: ItemMoveType.Shuffle, itemType: M.Card, indexes: [0, 1], newIndexes: [1, 0]
      })
      expect(items[0].id).toBe(2)
      expect(items[0].location.x).toBe(0) // slot location is preserved
      expect(items[1].id).toBe(1)
      expect(items[1].location.x).toBe(1)
    })
  })

  describe('select', () => {
    it('should select an item', () => {
      const items: Item[] = [{ location: { type: L.Hand } }]
      mutator(items).applyMove(select(0))
      expect(items[0].selected).toBe(true)
    })

    it('should select a specific quantity', () => {
      const items: Item[] = [{ location: { type: L.Hand }, quantity: 5 }]
      mutator(items).applyMove(select(0, { quantity: 3 }))
      expect(items[0].selected).toBe(3)
    })

    it('should unselect an item', () => {
      const items: Item[] = [{ location: { type: L.Hand }, selected: true }]
      mutator(items).applyMove(select(0, { selected: false }))
      expect(items[0].selected).toBeUndefined()
    })
  })

  describe('findMergeIndex', () => {
    it('should return the index of a mergeable item', () => {
      const items: Item[] = [{ location: { type: L.Board }, id: 1 }]
      expect(mutator(items).findMergeIndex({ location: { type: L.Board }, id: 1 })).toBe(0)
    })

    it('should ignore tombstones and quantity-0 candidates', () => {
      const items: Item[] = [{ location: { type: L.Board }, id: 1, quantity: 0 }]
      expect(mutator(items).findMergeIndex({ location: { type: L.Board }, id: 1 })).toBe(-1)
      expect(mutator(items).findMergeIndex({ location: { type: L.Board }, id: 1, quantity: 0 })).toBe(-1)
    })

    it('should always return -1 when merging is disabled', () => {
      const items: Item[] = [{ location: { type: L.Board }, id: 1 }]
      expect(mutator(items, false).findMergeIndex({ location: { type: L.Board }, id: 1 })).toBe(-1)
    })
  })

  describe('getItemCreationIndex', () => {
    it('should return the merge index when a merge is possible', () => {
      const items: Item[] = [{ location: { type: L.Board }, id: 1 }]
      expect(mutator(items).getItemCreationIndex({ location: { type: L.Board }, id: 1 })).toBe(0)
    })

    it('should return the first tombstone index otherwise', () => {
      const items: Item[] = [{ location: { type: L.Board }, id: 1 }, { location: { type: L.Board }, quantity: 0 }]
      expect(mutator(items).getItemCreationIndex({ location: { type: L.Hand }, id: 2 })).toBe(1)
    })

    it('should return the array length when there is no tombstone', () => {
      const items: Item[] = [{ location: { type: L.Board }, id: 1 }]
      expect(mutator(items).getItemCreationIndex({ location: { type: L.Hand }, id: 2 })).toBe(1)
    })
  })

  describe('getItemAfterMove', () => {
    it('should set the quantity when the move specifies one', () => {
      const items: Item[] = [{ location: { type: L.Deck }, id: 1, quantity: 5 }]
      const after = mutator(items).getItemAfterMove(move(0, { type: L.Hand }, { quantity: 2 }))
      expect(after.quantity).toBe(2)
      expect(after.location.type).toBe(L.Hand)
    })

    it('should keep the whole quantity when the move has none', () => {
      const items: Item[] = [{ location: { type: L.Deck }, id: 1, quantity: 5 }]
      const after = mutator(items).getItemAfterMove(move(0, { type: L.Hand }))
      expect(after.quantity).toBe(5)
    })
  })

  describe('location strategies', () => {
    it('should invoke the strategy hooks on create, move and delete', () => {
      const strategy: LocationStrategy<number, M, L> = {
        addItem: vi.fn(),
        moveItem: vi.fn(),
        removeItem: vi.fn()
      }
      const items: Item[] = []
      const m = new MaterialMutator<number, M, L>(M.Card, items, { [L.Hand]: strategy })

      // create in a strategy-managed location => addItem
      m.applyMove(create({ location: { type: L.Hand, player: 1 } }))
      expect(strategy.addItem).toHaveBeenCalledTimes(1)

      // move inside the same area (only coordinates change) => moveItem
      m.applyMove(move(0, { type: L.Hand, player: 1, x: 2 }))
      expect(strategy.moveItem).toHaveBeenCalledTimes(1)

      // delete the item => removeItem
      m.applyMove(del(0))
      expect(strategy.removeItem).toHaveBeenCalledTimes(1)
    })

    it('should maintain a positive sequence with PositiveSequenceStrategy', () => {
      const items: Item[] = []
      const m = new MaterialMutator<number, M, L>(M.Card, items, { [L.Hand]: new PositiveSequenceStrategy() })
      m.applyMove(create({ location: { type: L.Hand, player: 1 }, id: 1 }))
      m.applyMove(create({ location: { type: L.Hand, player: 1 }, id: 2 }))
      m.applyMove(create({ location: { type: L.Hand, player: 1 }, id: 3 }))
      expect(items.map(i => i.location.x)).toEqual([0, 1, 2])

      // Removing the middle card re-packs the sequence
      m.applyMove(del(1))
      const live = items.filter(i => i.quantity !== 0)
      expect(live.map(i => i.location.x).sort()).toEqual([0, 1])
    })
  })
})
