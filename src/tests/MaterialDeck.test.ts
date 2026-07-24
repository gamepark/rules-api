import { describe, expect, it, vi } from 'vitest'
import { ItemMoveType, Material, MaterialDeck, MaterialItem } from '../material'

enum M { Card = 1 }

enum L { Deck = 1, Hand = 2 }

type Item = MaterialItem<number, L>

const cards = (): Item[] => [
  { location: { type: L.Deck, x: 0 }, id: 'a' },
  { location: { type: L.Deck, x: 1 }, id: 'b' },
  { location: { type: L.Deck, x: 2 }, id: 'c' },
  { location: { type: L.Deck, x: 3 }, id: 'd' }
]

// Deck ordered by ascending x => entries a,b,c,d at indexes 0,1,2,3
const deck = (items: Item[] = cards(), processMove?: (m: any) => void) =>
  new Material<number, M, L>(M.Card, items, processMove).deck(item => item.location.x!)

describe('MaterialDeck', () => {

  describe('factory & ordering', () => {
    it('should be a MaterialDeck instance', () => {
      expect(deck()).toBeInstanceOf(MaterialDeck)
    })

    it('should order by -location.x by default (top of the deck first)', () => {
      const defaultDeck = new Material<number, M, L>(M.Card, cards()).deck()
      expect(defaultDeck.getIndexes()).toEqual([3, 2, 1, 0])
    })
  })

  describe('deal', () => {
    it('should move the first N cards and default quantity to 1', () => {
      const d = deck()
      const moves = d.deal({ type: L.Hand, player: 1 })
      expect(moves).toHaveLength(1)
      expect(moves[0]).toMatchObject({ type: ItemMoveType.Move, itemIndex: 0, location: { type: L.Hand, player: 1 } })
    })

    it('should deal successive cards on repeated calls (deck is mutated)', () => {
      const d = deck()
      const first = d.deal({ type: L.Hand, player: 1 }, 2)
      const second = d.deal({ type: L.Hand, player: 2 }, 2)
      expect(first.map(m => m.itemIndex)).toEqual([0, 1])
      expect(second.map(m => m.itemIndex)).toEqual([2, 3])
      expect(d.length).toBe(0)
    })

    it('should compute the location from each dealt card', () => {
      const moves = deck().deal(item => ({ type: L.Hand, x: item.location.x! + 10 }), 2)
      expect(moves.map(m => m.location.x)).toEqual([10, 11])
    })

    it('should deal at most the available cards', () => {
      const d = deck()
      const moves = d.deal({ type: L.Hand, player: 1 }, 100)
      expect(moves).toHaveLength(4)
      expect(d.length).toBe(0)
    })

    it('should not mutate the source items', () => {
      const items = cards()
      deck(items).deal({ type: L.Hand, player: 1 }, 4)
      expect(items.every(item => item.location.type === L.Deck)).toBe(true)
    })
  })

  describe('dealOne', () => {
    it('should deal a single card and shrink the deck', () => {
      const d = deck()
      const move = d.dealOne({ type: L.Hand, player: 1 })
      expect(move).toMatchObject({ type: ItemMoveType.Move, itemIndex: 0 })
      expect(d.length).toBe(3)
    })

    it('should throw when the deck is empty', () => {
      const d = deck([])
      expect(() => d.dealOne({ type: L.Hand, player: 1 })).toThrow(/empty deck/)
    })
  })

  describe('dealAtOnce', () => {
    it('should build a single MoveItemsAtOnce move for the first N cards', () => {
      const d = deck()
      const move = d.dealAtOnce({ type: L.Hand, player: 1 }, 2)
      expect(move).toMatchObject({ type: ItemMoveType.MoveAtOnce, indexes: [0, 1], location: { type: L.Hand, player: 1 } })
      expect(d.length).toBe(2)
    })
  })

  describe('processMove callback', () => {
    it('should run processMove on the generated deal moves', () => {
      const processMove = vi.fn()
      deck(cards(), processMove).deal({ type: L.Hand, player: 1 }, 3)
      expect(processMove).toHaveBeenCalledTimes(3)
    })
  })
})
