import { describe, expect, it } from 'vitest'
import { FillGapStrategy, Material, MaterialItem, PositiveSequenceStrategy, StackingStrategy } from '../material'

enum M { X = 1 }

enum L { Line = 1 }

type Item = MaterialItem<number, L>

const mat = (items: Item[]) => new Material<number, M, L>(M.X, items)
const at = (coords: Partial<{ x: number, y: number, z: number }>, id?: any): Item => ({ location: { type: L.Line, ...coords }, id })

describe('PositiveSequenceStrategy', () => {
  const strategy = new PositiveSequenceStrategy<number, M, L>()

  describe('addItem', () => {
    it('should append at the end of the sequence when no coordinate is given', () => {
      const item = at({})
      strategy.addItem(mat([at({ x: 0 }), at({ x: 1 })]), item)
      expect(item.location.x).toBe(2)
    })

    it('should shift existing items when inserting at a used position', () => {
      const items = [at({ x: 0 }), at({ x: 1 }), at({ x: 2 })]
      const item = at({ x: 1 })
      strategy.addItem(mat(items), item)
      expect(items.map(i => i.location.x)).toEqual([0, 2, 3])
      expect(item.location.x).toBe(1)
    })
  })

  describe('removeItem', () => {
    it('should pack the sequence back down', () => {
      const items = [at({ x: 0 }), at({ x: 2 }), at({ x: 3 })]
      strategy.removeItem(mat(items), at({ x: 1 }))
      expect(items.map(i => i.location.x)).toEqual([0, 1, 2])
    })

    it('should do nothing when the removed item has no coordinate', () => {
      const items = [at({ x: 0 })]
      strategy.removeItem(mat(items), at({}))
      expect(items[0].location.x).toBe(0)
    })
  })

  describe('moveItem', () => {
    it('should shift items down when moving forward', () => {
      const items = [at({ x: 0 }, 'A'), at({ x: 1 }, 'B'), at({ x: 2 }, 'C')]
      strategy.moveItem(mat(items), at({ x: 2 }, 'A'), 0)
      expect(items[1].location.x).toBe(0) // B
      expect(items[2].location.x).toBe(1) // C
    })

    it('should shift items up when moving backward', () => {
      const items = [at({ x: 0 }, 'A'), at({ x: 1 }, 'B'), at({ x: 2 }, 'C')]
      strategy.moveItem(mat(items), at({ x: 0 }, 'C'), 2)
      expect(items[0].location.x).toBe(1) // A
      expect(items[1].location.x).toBe(2) // B
    })

    it('should default a missing coordinate to the last position', () => {
      const items = [at({ x: 0 }), at({ x: 1 })]
      const item = at({})
      strategy.moveItem(mat(items), item, 0)
      expect(item.location.x).toBe(1) // material.length - 1
    })

    it('should do nothing when the moved item had no coordinate', () => {
      const items = [at({}), at({ x: 5 })]
      strategy.moveItem(mat(items), at({ x: 2 }), 0)
      expect(items[1].location.x).toBe(5)
    })
  })
})

describe('FillGapStrategy', () => {
  const strategy = new FillGapStrategy<number, M, L>()

  it('should place the first item at position 0', () => {
    const item = at({})
    strategy.addItem(mat([]), item)
    expect(item.location.x).toBe(0)
  })

  it('should append after a full sequence', () => {
    const item = at({})
    strategy.addItem(mat([at({ x: 0 }), at({ x: 1 }), at({ x: 2 })]), item)
    expect(item.location.x).toBe(3)
  })

  it('should fill the first gap in the middle', () => {
    const item = at({})
    strategy.addItem(mat([at({ x: 0 }), at({ x: 2 })]), item)
    expect(item.location.x).toBe(1)
  })

  it('should fill a gap at the start', () => {
    const item = at({})
    strategy.addItem(mat([at({ x: 1 }), at({ x: 2 })]), item)
    expect(item.location.x).toBe(0)
  })

  it('should leave an explicit coordinate untouched', () => {
    const item = at({ x: 7 })
    strategy.addItem(mat([at({ x: 0 })]), item)
    expect(item.location.x).toBe(7)
  })
})

describe('StackingStrategy', () => {
  const strategy = new StackingStrategy()

  describe('addItem', () => {
    it('should stack on top (z) of items sharing the same x/y', () => {
      const item = at({ x: 0, y: 0 })
      strategy.addItem(mat([at({ x: 0, y: 0, z: 0 }), at({ x: 0, y: 0, z: 1 })]), item)
      expect(item.location.z).toBe(2)
    })

    it('should ignore items at other x/y positions', () => {
      const item = at({ x: 0, y: 0 })
      strategy.addItem(mat([at({ x: 0, y: 0, z: 0 }), at({ x: 1, y: 1, z: 0 })]), item)
      expect(item.location.z).toBe(1)
    })
  })

  describe('removeItem', () => {
    it('should pack the stack down for the same x/y', () => {
      const items = [at({ x: 0, y: 0, z: 0 }), at({ x: 0, y: 0, z: 2 })]
      strategy.removeItem(mat(items), at({ x: 0, y: 0, z: 1 }))
      expect(items.map(i => i.location.z)).toEqual([0, 1])
    })
  })

  describe('moveItem', () => {
    it('should re-stack within the same x/y', () => {
      const items = [at({ x: 0, y: 0, z: 0 }, 'A'), at({ x: 0, y: 0, z: 1 }, 'B'), at({ x: 0, y: 0, z: 2 }, 'C')]
      strategy.moveItem(mat(items), at({ x: 0, y: 0, z: 2 }, 'A'), 0)
      expect(items[1].location.z).toBe(0) // B
      expect(items[2].location.z).toBe(1) // C
    })

    it('should unstack the origin and stack on the destination for a different x/y', () => {
      const items = [at({ x: 0, y: 0, z: 0 }, 'A'), at({ x: 0, y: 0, z: 1 }, 'B'), at({ x: 1, y: 1, z: 0 }, 'D')]
      const item = at({ x: 1, y: 1 }, 'A')
      strategy.moveItem(mat(items), item, 0)
      expect(items[1].location.z).toBe(0) // B packed down at origin
      expect(item.location.z).toBe(1) // A stacked on top of D at destination
    })
  })
})
