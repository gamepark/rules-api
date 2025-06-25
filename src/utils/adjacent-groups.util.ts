import { HexGridSystem } from './grid.hex.util'
import { XYCoordinates } from './grid.util'

export type AdjacentGroup<T = number> = {
  values: T[]
  coordinates: XYCoordinates[]
}

function getPreviousAdjacentCoordinates({ x, y }: XYCoordinates, hexGridSystem?: HexGridSystem) {
  const adjacentCoordinates: XYCoordinates[] = []
  if (hexGridSystem === undefined) {
    if (x > 0) adjacentCoordinates.push({ x: x - 1, y })
    if (y > 0) adjacentCoordinates.push({ x, y: y - 1 })
    return adjacentCoordinates
  }
  switch (hexGridSystem) {
    case HexGridSystem.Axial:
      if (x > 0) adjacentCoordinates.push({ x: x - 1, y })
      if (y > 0) adjacentCoordinates.push({ x, y: y - 1 }, { x: x + 1, y: y - 1 })
      return adjacentCoordinates
    case HexGridSystem.OddQ:
    case HexGridSystem.EvenQ:
      if (x > 0) adjacentCoordinates.push({ x: x - 1, y })
      if (y > 0) {
        if (hexGridSystem === (x % 2 ? HexGridSystem.OddQ : HexGridSystem.EvenQ)) {
          adjacentCoordinates.push({ x, y: y - 1 })
        } else {
          if (x > 0) {
            adjacentCoordinates.push({ x: x - 1, y: y - 1 })
          }
          adjacentCoordinates.push({ x, y: y - 1 }, { x: x + 1, y: y - 1 })
        }
      }
      return adjacentCoordinates
    default:
      throw new Error('Not implemented')
  }
}

type CreateAdjacentGroupsOptions<T = number> = {
  isEmpty?: (value: T) => boolean
  hexGridSystem?: HexGridSystem
}

export function createAdjacentGroups<T = number>(map: T[][], options?: CreateAdjacentGroupsOptions<T>): AdjacentGroup<T>[][] {
  const isEmpty = options?.isEmpty ?? ((value: T) => !value)
  const groups: AdjacentGroup<T>[][] = []
  for (let y = 0; y < map.length; y++) {
    groups.push([])
    for (let x = 0; x < map[y].length; x++) {
      const value = map[y][x]
      if (isEmpty(value)) {
        groups[y][x] = { values: [], coordinates: [] }
      } else {
        const previousAdjacentCoordinates = getPreviousAdjacentCoordinates({ x, y }, options?.hexGridSystem)
        const adjacentGroups: AdjacentGroup<T>[] = []
        for (const { x, y } of previousAdjacentCoordinates) {
          if (groups[y]?.[x]?.values.length && !adjacentGroups.includes(groups[y][x])) {
            adjacentGroups.push(groups[y][x])
          }
        }
        if (!adjacentGroups.length) {
          groups[y][x] = { values: [value], coordinates: [{ x, y }] }
        } else if (adjacentGroups.length === 1) {
          adjacentGroups[0].values.push(value)
          adjacentGroups[0].coordinates.push({ x, y })
          groups[y][x] = adjacentGroups[0]
        } else {
          const fusionGroup: AdjacentGroup<T> = { values: [value], coordinates: [{ x, y }] }
          groups[y][x] = fusionGroup
          for (let i = 0; i < adjacentGroups.length; i++) {
            fusionGroup.values.push(...adjacentGroups[i].values)
            for (const { x, y } of adjacentGroups[i].coordinates) {
              fusionGroup.coordinates.push({ x, y })
              groups[y][x] = fusionGroup
            }
          }
        }
      }
    }
  }
  return groups
}
