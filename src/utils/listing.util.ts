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

export function listToListing<T extends number>(list: T[]): Partial<Record<T, number>> {
  const listing: Partial<Record<T, number>> = []
  for (const t of list) {
    t in listing ? listing[t]!++ : listing[t] = 1
  }
  return listing
}