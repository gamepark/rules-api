import { describe, expect, it, vi } from 'vitest'
import { ConsolidateOption, ItemMoveType, MaterialItem, MaterialMoney } from '../material'

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

    it('rend la monnaie exacte quand il faut casser une pièce en plusieurs unités inférieures', () => {
      const materialMoney = new MaterialMoney(1, [6, 3, 1], [{ id: 6, location: { type: 1 }, quantity: 1 }])
      expect(materialMoney['getSpendMap'](1)).toEqual({ 6: -1, 3: 1, 1: 2 })
      materialMoney.removeMoney(1, { type: 1 })
      expect(materialMoney.count).toBe(5)
    })
  })

  describe('consolidate', () => {
    it('ne produit aucun mouvement quand la location est vide', () => {
      const materialMoney = new MaterialMoney(1, [5, 1], [])
      expect(materialMoney.consolidate({ type: 1 })).toEqual([])
    })

    it('ne produit aucun mouvement quand la location est déjà minimale', () => {
      const items: MaterialItem[] = [
        { id: 5, location: { type: 1 }, quantity: 1 },
        { id: 1, location: { type: 1 }, quantity: 2 }
      ]
      const materialMoney = new MaterialMoney(1, [5, 1], items)
      expect(materialMoney.consolidate({ type: 1 })).toEqual([])
    })

    it('échange 5 pièces de 1 contre 1 pièce de 5', () => {
      const items: MaterialItem[] = [
        { id: 1, location: { type: 1 }, quantity: 5 }
      ]
      const materialMoney = new MaterialMoney(1, [5, 1], items)
      materialMoney.consolidate({ type: 1 })
      expect(materialMoney.count).toBe(5)
      expect(materialMoney.id(5).getQuantity()).toBe(1)
      expect(materialMoney.id(1).getQuantity()).toBe(0)
    })

    it('ne consolide que la location ciblée', () => {
      const items: MaterialItem[] = [
        { id: 1, location: { type: 1, player: 1 }, quantity: 5 },
        { id: 1, location: { type: 1, player: 2 }, quantity: 5 }
      ]
      const materialMoney = new MaterialMoney(1, [5, 1], items)
      materialMoney.consolidate({ type: 1, player: 1 })
      expect(materialMoney.location(l => l.player === 1).id(5).getQuantity()).toBe(1)
      expect(materialMoney.location(l => l.player === 1).id(1).getQuantity()).toBe(0)
      expect(materialMoney.location(l => l.player === 2).id(1).getQuantity()).toBe(5)
    })
  })

  describe('moveMoney', () => {
    it('échange direct : origine donne 5, cible rend 3', () => {
      const items: MaterialItem[] = [
        { id: 5, location: { type: 1, player: 1 }, quantity: 1 },
        { id: 1, location: { type: 1, player: 2 }, quantity: 3 }
      ]
      const materialMoney = new MaterialMoney(1, [5, 1], items)
      const moves = materialMoney.moveMoney(
        { type: 1, player: 1 },
        { type: 1, player: 2 },
        2
      )
      expect(moves).toHaveLength(2)
      expect(materialMoney.location(l => l.player === 1).count).toBe(3)
      expect(materialMoney.location(l => l.player === 1).id(5).getQuantity()).toBe(0)
      expect(materialMoney.location(l => l.player === 1).id(1).getQuantity()).toBe(3)
      expect(materialMoney.location(l => l.player === 2).count).toBe(5)
      expect(materialMoney.location(l => l.player === 2).id(5).getQuantity()).toBe(1)
      expect(materialMoney.location(l => l.player === 2).id(1).getQuantity()).toBe(0)
    })

    it('finalise la cible en distribution optimale via échange direct', () => {
      const items: MaterialItem[] = [
        { id: 5, location: { type: 1, player: 1 }, quantity: 1 },
        { id: 1, location: { type: 1, player: 2 }, quantity: 4 }
      ]
      const materialMoney = new MaterialMoney(1, [5, 1], items)
      const moves = materialMoney.moveMoney(
        { type: 1, player: 1 },
        { type: 1, player: 2 },
        1
      )
      expect(moves).toHaveLength(2)
      expect(materialMoney.location(l => l.player === 1).count).toBe(4)
      expect(materialMoney.location(l => l.player === 1).id(1).getQuantity()).toBe(4)
      expect(materialMoney.location(l => l.player === 2).count).toBe(5)
      expect(materialMoney.location(l => l.player === 2).id(5).getQuantity()).toBe(1)
      expect(materialMoney.location(l => l.player === 2).id(1).getQuantity()).toBe(0)
    })

    it('fait appel à la banque quand l\'échange direct n\'est pas possible', () => {
      const items: MaterialItem[] = [
        { id: 5, location: { type: 1, player: 1 }, quantity: 1 }
      ]
      const materialMoney = new MaterialMoney(1, [5, 1], items)
      materialMoney.moveMoney(
        { type: 1, player: 1 },
        { type: 1, player: 2 },
        2
      )
      expect(materialMoney.location(l => l.player === 1).count).toBe(3)
      expect(materialMoney.location(l => l.player === 2).count).toBe(2)
    })

    it('transfert simple par dénomination identique', () => {
      const items: MaterialItem[] = [
        { id: 5, location: { type: 1, player: 1 }, quantity: 2 }
      ]
      const materialMoney = new MaterialMoney(1, [5, 1], items)
      const moves = materialMoney.moveMoney(
        { type: 1, player: 1 },
        { type: 1, player: 2 },
        5
      )
      expect(moves).toHaveLength(1)
      expect(materialMoney.location(l => l.player === 1).id(5).getQuantity()).toBe(1)
      expect(materialMoney.location(l => l.player === 2).id(5).getQuantity()).toBe(1)
    })
  })

  describe('addMoney consolidation', () => {
    it('ne consolide pas par défaut', () => {
      const items: MaterialItem[] = [
        { id: 1, location: { type: 1 }, quantity: 1 }
      ]
      const materialMoney = new MaterialMoney(1, [5, 1], items)
      materialMoney.addMoney(4, { type: 1 })
      expect(materialMoney.id(5).getQuantity()).toBe(0)
      expect(materialMoney.id(1).getQuantity()).toBe(5)
    })

    it('consolide quand consolidate=true', () => {
      const items: MaterialItem[] = [
        { id: 1, location: { type: 1 }, quantity: 1 }
      ]
      const materialMoney = new MaterialMoney(1, [5, 1], items)
      materialMoney.addMoney(4, { type: 1 }, { consolidate: true })
      expect(materialMoney.count).toBe(5)
      expect(materialMoney.id(5).getQuantity()).toBe(1)
      expect(materialMoney.id(1).getQuantity()).toBe(0)
    })

    it('prend la pièce supérieure avant de rendre les pièces par défaut : 1+1, gagne 1 => prend 3, rend 1+1', () => {
      const items: MaterialItem[] = [
        { id: 1, location: { type: 1 }, quantity: 2 }
      ]
      const materialMoney = new MaterialMoney(1, [6, 3, 1], items)
      const moves = materialMoney.addMoney(1, { type: 1 }, { consolidate: true })
      expect(moves).toMatchObject([
        { type: ItemMoveType.Create, item: { id: 3, location: { type: 1 }, quantity: 1 } },
        { type: ItemMoveType.Delete, itemIndex: 0, quantity: 2 }
      ])
      expect(materialMoney.count).toBe(3)
    })

    it('order giveFirst : 1+1, gagne 1 => rend 1+1, prend 3', () => {
      const materialMoney = new MaterialMoney(1, [6, 3, 1], [{ id: 1, location: { type: 1 }, quantity: 2 }])
      const moves = materialMoney.addMoney(1, { type: 1 }, { consolidate: true, order: 'giveFirst' })
      expect(moves).toMatchObject([
        { type: ItemMoveType.Delete, itemIndex: 0, quantity: 2 },
        { type: ItemMoveType.Create, item: { id: 3, location: { type: 1 }, quantity: 1 } }
      ])
      expect(materialMoney.count).toBe(3)
    })

    it('order afterwards : 1+1, gagne 1 => prend 1, puis prend 3 et rend 1+1+1', () => {
      const materialMoney = new MaterialMoney(1, [6, 3, 1], [{ id: 1, location: { type: 1 }, quantity: 2 }])
      const moves = materialMoney.addMoney(1, { type: 1 }, { consolidate: true, order: 'afterwards' })
      expect(moves).toMatchObject([
        { type: ItemMoveType.Create, item: { id: 1, location: { type: 1 }, quantity: 1 } },
        { type: ItemMoveType.Create, item: { id: 3, location: { type: 1 }, quantity: 1 } },
        { type: ItemMoveType.Delete, itemIndex: 0, quantity: 3 }
      ])
      expect(materialMoney.count).toBe(3)
      expect(materialMoney.id(1).getQuantity()).toBe(0)
    })

    it('order afterwards ne convertit rien quand le gain est déjà minimal', () => {
      const materialMoney = new MaterialMoney(1, [6, 3, 1], [{ id: 1, location: { type: 1 }, quantity: 1 }])
      const moves = materialMoney.addMoney(1, { type: 1 }, { consolidate: true, order: 'afterwards' })
      expect(moves).toHaveLength(1)
    })

    it('consolide aussi deux 3 en un 6', () => {
      const items: MaterialItem[] = [
        { id: 3, location: { type: 1 }, quantity: 1 },
        { id: 1, location: { type: 1 }, quantity: 2 }
      ]
      const materialMoney = new MaterialMoney(1, [6, 3, 1], items)
      materialMoney.addMoney(1, { type: 1 }, { consolidate: true })
      expect(materialMoney.count).toBe(6)
      expect(materialMoney.id(6).getQuantity()).toBe(1)
      expect(materialMoney.id(3).getQuantity()).toBe(0)
      expect(materialMoney.id(1).getQuantity()).toBe(0)
    })

    it('enchaîne plusieurs gains consolidés sur la même instance', () => {
      const materialMoney = new MaterialMoney(1, [6, 3, 1], [])
      materialMoney.addMoney(2, { type: 1 }, { consolidate: true })
      materialMoney.addMoney(2, { type: 1 }, { consolidate: true })
      expect(materialMoney.count).toBe(4)
      expect(materialMoney.id(3).getQuantity()).toBe(1)
      expect(materialMoney.id(1).getQuantity()).toBe(1)
    })

    it('le prédicat ne consolide qu\'au franchissement du seuil', () => {
      const consolidate: ConsolidateOption = items =>
        items.reduce((sum, i) => sum + (i.quantity ?? 1), 0) > 4
      const materialMoney = new MaterialMoney(1, [5, 1], [])

      materialMoney.addMoney(3, { type: 1 }, { consolidate })
      expect(materialMoney.count).toBe(3)
      expect(materialMoney.id(5).getQuantity()).toBe(0)
      expect(materialMoney.id(1).getQuantity()).toBe(3)

      materialMoney.addMoney(3, { type: 1 }, { consolidate })
      expect(materialMoney.count).toBe(6)
      expect(materialMoney.id(5).getQuantity()).toBe(1)
      expect(materialMoney.id(1).getQuantity()).toBe(1)
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
