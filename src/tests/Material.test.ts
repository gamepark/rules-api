import { describe, expect, it, vi } from 'vitest'
import { ItemMoveType, Material, MaterialDeck, MaterialItem, MaterialMoney, MoveKind } from '../material'

enum M { Card = 1 }

enum L { Hand = 1, Board = 2, Deck = 3 }

type Item = MaterialItem<number, L>

// items[3] is a tombstone (quantity 0) and must be excluded from the working entries
const sampleItems = (): Item[] => [
  { location: { type: L.Hand, player: 1, x: 0 }, id: 10 },
  { location: { type: L.Hand, player: 1, x: 1 }, id: 20, selected: true },
  { location: { type: L.Board, player: 2, id: 'a', parent: 5, rotation: 2 }, id: 30 },
  { location: { type: L.Deck }, id: 99, quantity: 0 }
]

const material = (items: Item[] = sampleItems(), processMove?: (m: any) => void) =>
  new Material<number, M, L>(M.Card, items, processMove)

describe('Material / MaterialBase', () => {

  describe('construction & entries', () => {
    it('should exclude tombstones (quantity 0) from the working entries', () => {
      const m = material()
      expect(m.length).toBe(3)
      expect(m.getIndexes()).toEqual([0, 1, 2])
    })

    it('should expose exists', () => {
      expect(material().exists).toBe(true)
      expect(material([]).exists).toBe(false)
    })
  })

  describe('getItems / getItem', () => {
    it('should return all items', () => {
      expect(material().getItems().map(i => i.id)).toEqual([10, 20, 30])
    })

    it('should filter items with a predicate', () => {
      expect(material().getItems(i => i.id === 20)).toHaveLength(1)
    })

    it('should get an item by index', () => {
      expect(material().getItem(1).id).toBe(20)
    })

    it('should throw when the index does not exist', () => {
      expect(() => material().getItem(3)).toThrow(/index 3/)
    })

    it('should get the first item matching a predicate', () => {
      expect(material().getItem(i => i.location.type === L.Board)?.id).toBe(30)
      expect(material().getItem(i => i.id === -1)).toBeUndefined()
    })

    it('should get the first item when called without argument', () => {
      expect(material().getItem()?.id).toBe(10)
      expect(material([]).getItem()).toBeUndefined()
    })

    it('should return the first index or -1', () => {
      expect(material().getIndex()).toBe(0)
      expect(material([]).getIndex()).toBe(-1)
    })
  })

  describe('filters', () => {
    it('should filter by location type', () => {
      expect(material().location(L.Hand).length).toBe(2)
    })

    it('should filter by location predicate', () => {
      expect(material().location(l => l.type === L.Board).getItems().map(i => i.id)).toEqual([30])
    })

    it('should filter by player', () => {
      expect(material().player(1).length).toBe(2)
      expect(material().player(2).getItems().map(i => i.id)).toEqual([30])
      expect(material().player(p => p === 2).length).toBe(1)
    })

    it('should filter by id', () => {
      expect(material().id(30).getItems().map(i => i.id)).toEqual([30])
      expect(material().id(id => (id as number) >= 20).length).toBe(2)
    })

    it('should filter by rotation', () => {
      expect(material().rotation(2).getItems().map(i => i.id)).toEqual([30])
      expect(material().rotation(undefined).length).toBe(2)
    })

    it('should filter by location id and parent', () => {
      expect(material().locationId('a').getItems().map(i => i.id)).toEqual([30])
      expect(material().parent(5).getItems().map(i => i.id)).toEqual([30])
      expect(material().parent(p => p === undefined).length).toBe(2)
    })

    it('should filter selected items', () => {
      expect(material().selected().getItems().map(i => i.id)).toEqual([20])
      expect(material().selected(false).length).toBe(2)
    })

    it('should filter with a raw predicate', () => {
      expect(material().filter((_, index) => index === 2).getItems().map(i => i.id)).toEqual([30])
    })

    it('should chain filters immutably', () => {
      const m = material()
      const filtered = m.location(L.Hand).player(1)
      expect(filtered.length).toBe(2)
      expect(m.length).toBe(3) // original untouched
    })
  })

  describe('index selection', () => {
    it('should select a single index', () => {
      expect(material().index(2).getItems().map(i => i.id)).toEqual([30])
    })

    it('should select a list of indexes', () => {
      expect(material().index([0, 2]).getIndexes()).toEqual([0, 2])
    })

    it('should select indexes with a predicate', () => {
      expect(material().index(i => i > 0).getIndexes()).toEqual([1, 2])
    })

    it('should return an empty instance for undefined', () => {
      expect(material().index(undefined).length).toBe(0)
    })

    it('should support the deprecated indexes()', () => {
      expect(material().indexes([1, 2]).getIndexes()).toEqual([1, 2])
    })
  })

  describe('aggregation', () => {
    it('should count the total quantity (defaulting to 1)', () => {
      expect(material().getQuantity()).toBe(3)
      expect(material([{ location: { type: L.Board }, quantity: 4 }]).getQuantity()).toBe(4)
    })

    it('should keep the item with the minimum / maximum value', () => {
      expect(material().minBy(i => i.id!).getItems().map(i => i.id)).toEqual([10])
      expect(material().maxBy(i => i.id!).getItems().map(i => i.id)).toEqual([30])
    })

    it('should sort items', () => {
      expect(material().sort(i => -i.id!).getItems().map(i => i.id)).toEqual([30, 20, 10])
    })

    it('should limit the number of items', () => {
      expect(material().limit(2).getItems().map(i => i.id)).toEqual([10, 20])
    })
  })

  describe('create moves', () => {
    it('should build a CreateItem move', () => {
      const item: Item = { location: { type: L.Board }, id: 1 }
      expect(material().createItem(item)).toEqual({
        kind: MoveKind.ItemMove, type: ItemMoveType.Create, itemType: M.Card, item
      })
    })

    it('should build several CreateItem moves', () => {
      expect(material().createItems([{ location: { type: L.Board } }, { location: { type: L.Board } }])).toHaveLength(2)
    })

    it('should build a CreateItemsAtOnce move', () => {
      const items: Item[] = [{ location: { type: L.Board } }]
      expect(material().createItemsAtOnce(items)).toEqual({
        kind: MoveKind.ItemMove, type: ItemMoveType.CreateAtOnce, itemType: M.Card, items
      })
    })
  })

  describe('delete moves', () => {
    it('should build a DeleteItem move for a single item', () => {
      expect(material().index(2).deleteItem()).toMatchObject({ type: ItemMoveType.Delete, itemIndex: 2 })
    })

    it('should delete only the first item when several match', () => {
      expect(material().deleteItem()).toMatchObject({ type: ItemMoveType.Delete, itemIndex: 0 })
    })

    it('should include the quantity when provided', () => {
      expect(material().index(0).deleteItem(2)).toMatchObject({ itemIndex: 0, quantity: 2 })
    })

    it('should throw when deleting from an empty material', () => {
      expect(() => material([]).deleteItem()).toThrow(/does not exist/)
    })

    it('should build a DeleteItemsAtOnce move', () => {
      expect(material().deleteItemsAtOnce()).toEqual({
        kind: MoveKind.ItemMove, type: ItemMoveType.DeleteAtOnce, itemType: M.Card, indexes: [0, 1, 2]
      })
    })
  })

  describe('move moves', () => {
    it('should build a MoveItem move to a fixed location', () => {
      expect(material().index(0).moveItem({ type: L.Board })).toMatchObject({
        type: ItemMoveType.Move, itemIndex: 0, location: { type: L.Board }
      })
    })

    it('should compute the location from each item', () => {
      const moves = material().location(L.Hand).moveItems(item => ({ type: L.Board, x: item.location.x! + 10 }))
      expect(moves.map(m => m.location.x)).toEqual([10, 11])
    })

    it('should throw when moving from an empty material', () => {
      expect(() => material([]).moveItem({ type: L.Board })).toThrow(/does not exist/)
    })

    it('should build a MoveItemsAtOnce move', () => {
      expect(material().moveItemsAtOnce({ type: L.Board })).toMatchObject({
        type: ItemMoveType.MoveAtOnce, indexes: [0, 1, 2], location: { type: L.Board }
      })
    })
  })

  describe('select moves', () => {
    it('should build a select move', () => {
      expect(material().index(0).selectItem()).toMatchObject({ type: ItemMoveType.Select, itemIndex: 0 })
      expect(material().index(0).selectItem()).not.toHaveProperty('selected')
    })

    it('should build an unselect move', () => {
      expect(material().index(0).unselectItem()).toMatchObject({ type: ItemMoveType.Select, itemIndex: 0, selected: false })
    })

    it('should carry the quantity', () => {
      expect(material().index(0).selectItems(2)[0]).toMatchObject({ quantity: 2 })
      expect(material().index(0).unselectItems(3)[0]).toMatchObject({ quantity: 3, selected: false })
    })

    it('should throw when selecting from an empty material', () => {
      expect(() => material([]).selectItem()).toThrow()
      expect(() => material([]).unselectItem()).toThrow()
    })
  })

  describe('rotate moves', () => {
    it('should build a MoveItem that sets the rotation and keeps the other location fields', () => {
      const rotate = material().index(0).rotateItem(3)
      expect(rotate.location).toEqual({ type: L.Hand, player: 1, x: 0, rotation: 3 })
    })

    it('should compute the rotation from the item', () => {
      const rotate = material().index(2).rotateItem(item => (item.location.rotation as number) + 1)
      expect(rotate.location.rotation).toBe(3)
    })

    it('should drop the rotation when the value is undefined', () => {
      const rotate = material().index(2).rotateItem()
      expect(rotate.location).not.toHaveProperty('rotation')
    })

    it('should throw when rotating from an empty material', () => {
      expect(() => material([]).rotateItem(1)).toThrow(/does not exist/)
    })
  })

  describe('shuffle & roll moves', () => {
    it('should build a Shuffle move with the item indexes', () => {
      expect(material().location(L.Hand).shuffle()).toEqual({
        kind: MoveKind.ItemMove, type: ItemMoveType.Shuffle, itemType: M.Card, indexes: [0, 1]
      })
    })

    it('should build a RollItem move keeping the current location by default', () => {
      expect(material().index(2).rollItem()).toMatchObject({
        type: ItemMoveType.Roll, itemIndex: 2, location: { type: L.Board }
      })
    })

    it('should build a RollItem move to a given location', () => {
      expect(material().index(0).rollItem({ type: L.Board })).toMatchObject({ location: { type: L.Board } })
    })

    it('should throw when rolling from an empty material', () => {
      expect(() => material([]).rollItem()).toThrow(/does not exist/)
    })
  })

  describe('processMove callback', () => {
    it('should run the processMove callback on every generated move', () => {
      const processMove = vi.fn()
      const m = material(sampleItems(), processMove)
      m.createItem({ location: { type: L.Board } })
      m.location(L.Hand).moveItems({ type: L.Board })
      expect(processMove).toHaveBeenCalledTimes(3) // 1 create + 2 moves
    })
  })

  describe('factory helpers', () => {
    it('should build a MaterialDeck', () => {
      expect(material().deck()).toBeInstanceOf(MaterialDeck)
    })

    it('should build a MaterialMoney', () => {
      expect(material().money([1, 2, 5])).toBeInstanceOf(MaterialMoney)
    })
  })
})
