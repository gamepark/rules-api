/**
 * A listing is a quantity of items indexed by they identifier
 * Use this function to get a list of items where each item is included as much time as their listed quantity
 * @param listing The listing
 * @returns the list matching the listing
 */
export function listingToList<T extends number>(listing: Partial<Record<T, number>>): T[] {
  const list: T[] = []
  for (const key in listing) {
    const intKey = parseInt(key) as T
    for (let i = 0; i < listing[key]!; i++) {
      list.push(intKey)
    }
  }
  return list
}

/**
 * A listing is a quantity of items indexed by they identifier
 * Use this function to get a listing based on a list with potential duplicates
 * @param list The list
 * @returns the listing matching the list
 */
export function listToListing<T extends number>(list: T[]): Partial<Record<T, number>> {
  const listing: Partial<Record<T, number>> = []
  for (const t of list) {
    t in listing ? listing[t]!++ : listing[t] = 1
  }
  return listing
}