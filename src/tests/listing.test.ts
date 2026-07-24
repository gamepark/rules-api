import { describe, expect, it } from 'vitest'
import { listingToList, listToListing } from '../utils'

describe('listing.util', () => {

  describe('listingToList', () => {
    it('should expand a listing into a list with repetitions', () => {
      expect(listingToList({ 1: 2, 3: 1 })).toEqual([1, 1, 3])
    })

    it('should return an empty list for an empty listing', () => {
      expect(listingToList({})).toEqual([])
    })

    it('should skip keys with a zero quantity', () => {
      expect(listingToList({ 1: 0, 2: 2 })).toEqual([2, 2])
    })
  })

  describe('listToListing', () => {
    it('should count duplicates', () => {
      // listToListing returns an array-like structure indexed by value
      expect({ ...listToListing([1, 1, 3]) }).toEqual({ 1: 2, 3: 1 })
    })

    it('should return an empty listing for an empty list', () => {
      expect({ ...listToListing([]) }).toEqual({})
    })
  })

  it('should round-trip a listing through a list', () => {
    const listing = { 1: 3, 2: 1, 5: 2 }
    expect({ ...listToListing(listingToList(listing)) }).toEqual(listing)
  })
})
