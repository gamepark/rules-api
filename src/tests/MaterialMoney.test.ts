import { describe, expect, it } from 'vitest'
import { MaterialItem, MaterialMoney } from '../material'

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
