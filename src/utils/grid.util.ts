export type XYCoordinates = {
  x: number
  y: number
}

export const isXYCoordinates = (coordinates: any): coordinates is XYCoordinates => {
  return typeof coordinates === 'object' && typeof coordinates.x === 'number' && typeof coordinates.y === 'number'
}
