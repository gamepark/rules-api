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

/**
 * Test if 2 items are neighbors in a ring array
 * @param item1 First item
 * @param item2 Second item
 * @param array Array to search the neighbors in
 * @returns true if items are neighbors in the array
 */

export function areNeighbors<T extends string | number | boolean | object>(item1: T, item2: T, array: T[]): boolean {
  const distance = Math.abs(array.indexOf(item1) - array.indexOf(item2))
  return distance === 1 || distance === array.length - 1
}
