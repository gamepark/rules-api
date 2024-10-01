/**
 * Type for any object with XY number coordinates
 */
export type XYCoordinates = {
  x: number
  y: number
}

/**
 * Type guard to know if we have an object with XY coordinates
 * @param coordinates The object
 * @returns true if coordinates is a {@link XYCoordinates}
 */
export const isXYCoordinates = (coordinates: any): coordinates is XYCoordinates => {
  return typeof coordinates === 'object' && typeof coordinates.x === 'number' && typeof coordinates.y === 'number'
}

/**
 * Boundaries for a two dimension grid
 */
export type GridBoundaries = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}
