import { describe, expect, it, vi } from 'vitest'
import { ItemMoveType, MaterialItem, MaterialMoney } from '../material'

describe('MaterialMoney', () => {
  describe('getSpendMap', () => {
    it('doit dépenser 10 de valeur exactement', () => {
      const units = [5, 3, 1]

      const items: MaterialItem[] = [
        { id: 5, location: { type: 1 }, quantity: 1 },
        { id: 3, location: { type: 1 }, quantity: 1 },
        { id: 1, location: { type: 1 }, quantity: 4 }
      ]

      const materialMoney = new MaterialMoney(1, units, items)

      const amountToSpend = 10
      const result = materialMoney['getSpendMap'](amountToSpend) // Appel direct de la méthode privée pour test

      expect(result).toEqual({
        1: -2, // 2 pièces de 1
        3: -1,  // 1 pièce de 3
        5: -1  // 1 pièces de 5
      })
    })
  })
})

enum M { Coin = 1 }

enum L { Stock = 1, Bank = 2 }

type Item = MaterialItem<number, L>

const stock = { type: L.Stock, player: 1 }
const bank = { type: L.Bank, player: 1 }

// Sum the face value carried by the create moves in a list
const createdValue = (moves: any[]) =>
  moves.reduce((sum, move) => move.type === ItemMoveType.Create ? sum + move.item.id * (move.item.quantity ?? 1) : sum, 0)

const money = (units: number[], items: Item[] = []) =>
  new MaterialMoney<number, M, L>(M.Coin, units, items)

describe('MaterialMoney - operations', () => {

  describe('construction', () => {
    it('should sort units from highest to 1 when 1 comes first', () => {
      expect(money([1, 2, 5]).units).toEqual([5, 2, 1])
    })

    it('should warn when there is no unit of value 1', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      money([5, 2])
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe('count', () => {
    it('should sum id * quantity over the items', () => {
      const items: Item[] = [
        { location: stock, id: 5, quantity: 2 },
        { location: stock, id: 1, quantity: 3 }
      ]
      expect(money([5, 2, 1], items).count).toBe(13)
    })

    it('should default a missing id to 1', () => {
      const items: Item[] = [{ location: stock, quantity: 4 }]
      expect(money([5, 2, 1], items).count).toBe(4)
    })
  })

  describe('addMoney', () => {
    it('should return no move for a zero amount', () => {
      expect(money([5, 2, 1]).addMoney(0, stock)).toEqual([])
    })

    it('should create coins prioritising the highest units', () => {
      const moves = money([5, 2, 1]).addMoney(7, stock)
      expect(moves).toHaveLength(2) // one 5 + one 2
      expect(moves.every(move => move.type === ItemMoveType.Create)).toBe(true)
      expect(createdValue(moves)).toBe(7)
    })

    it('should update the tracked count after adding', () => {
      const m = money([5, 2, 1])
      m.addMoney(7, stock)
      expect(m.count).toBe(7)
    })

    it('should delegate a negative amount to removeMoney', () => {
      const m = money([5, 2, 1], [{ location: stock, id: 1, quantity: 5 }])
      m.addMoney(-3, stock)
      expect(m.count).toBe(2)
    })
  })

  describe('removeMoney', () => {
    it('should return no move for a zero amount', () => {
      expect(money([5, 2, 1]).removeMoney(0, stock)).toEqual([])
    })

    it('should delete the exact coins when no change is needed', () => {
      const items: Item[] = [
        { location: stock, id: 5, quantity: 2 },
        { location: stock, id: 1, quantity: 3 }
      ]
      const m = money([5, 2, 1], items)
      m.removeMoney(3, stock)
      expect(m.count).toBe(10)
    })

    it('should make change when the exact coins are not available', () => {
      const m = money([5, 1], [{ location: stock, id: 5, quantity: 1 }])
      m.removeMoney(3, stock)
      expect(m.count).toBe(2)
    })

    it('should delegate a negative amount to addMoney', () => {
      const m = money([5, 2, 1])
      m.removeMoney(-7, stock)
      expect(m.count).toBe(7)
    })
  })

  describe('moveMoney', () => {
    it('should return no move for a zero amount', () => {
      expect(money([5, 2, 1]).moveMoney(stock, bank, 0)).toEqual([])
    })

    it('should transfer an amount from origin to target', () => {
      const m = money([5, 2, 1], [{ location: stock, id: 1, quantity: 5 }])
      m.moveMoney(stock, bank, 3)
      expect(m.location(l => l.type === L.Bank).count).toBe(3)
    })

    it('should leave the remainder at the origin', () => {
      const m = money([5, 2, 1], [{ location: stock, id: 1, quantity: 5 }])
      m.moveMoney(stock, bank, 3)
      expect(m.location(l => l.type === L.Stock).count).toBe(2)
    })

    it('should conserve the total value', () => {
      const m = money([5, 2, 1], [{ location: stock, id: 1, quantity: 5 }])
      m.moveMoney(stock, bank, 3)
      expect(m.count).toBe(5)
    })

    it('should swap origin and target for a negative amount', () => {
      const m = money([5, 2, 1], [{ location: bank, id: 1, quantity: 4 }])
      m.moveMoney(stock, bank, -3) // same as moveMoney(bank, stock, 3)
      expect(m.location(l => l.type === L.Stock).count).toBe(3)
    })
  })

  describe('pending moves & filtering', () => {
    it('should warn when applying pending moves on a filtered instance', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const items: Item[] = [
        { location: stock, id: 1, quantity: 3 },
        { location: bank, id: 1, quantity: 3 }
      ]
      const filtered = money([5, 2, 1], items).location(l => l.type === L.Stock)
      filtered.addMoney(2, stock)
      // Accessing count applies the pending move on a filtered instance => warning
      void filtered.count
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('filtered'))
      spy.mockRestore()
    })
  })
})
