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
        } else {
          groups[y][x] = adjacentGroups[0]
          groups[y][x].values.push(value)
          groups[y][x].coordinates.push({ x, y })
          for (let i = 1; i < adjacentGroups.length; i++) {
            adjacentGroups[0].values.push(...adjacentGroups[i].values)
            for (const { x, y } of adjacentGroups[i].coordinates) {
              groups[y][x] = adjacentGroups[0]
            }
          }
        }
      }
    }
  }
  return groups
}
