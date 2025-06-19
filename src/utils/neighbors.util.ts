/**
 * Given an item and an array, returns the 2 neighbors of the item.
 * If the item starts or ends the array, the other starting of ending item is considered a neighbor.
 * Example usage: getNeighbors(player, game.players)
 * @param search Item to search for, or predicate to find the item
 * @param array Array to search the neighbors in
 * @returns the neighbors of the item in the array
 */
export function getNeighbors<T extends string | number | boolean | object>(search: T | ((t: T) => boolean), array: T[]): T[] {
  const index = array.findIndex((item) => typeof search === 'function' ? search(item) : item === search)
  if (index === -1) return []
  return array.filter((_, i) => {
    const distance = Math.abs(index - i)
    return distance === 1 || distance === array.length - 1
  })
}
