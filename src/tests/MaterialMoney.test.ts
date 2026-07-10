import { describe, expect, it } from 'vitest'
import { ConsolidateOption, MaterialItem, MaterialMoney } from '../material'

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
