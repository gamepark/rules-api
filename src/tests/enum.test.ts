import { describe, expect, it } from 'vitest'
import { getEnumEntries, getEnumKeys, getEnumValues, isEnumValue } from '../utils'

enum Color { Red = 1, Green, Blue }

enum Direction { North, South, East, West }

describe('enum.util', () => {

  describe('getEnumKeys', () => {
    it('should return only the string keys', () => {
      expect(getEnumKeys(Color)).toEqual(['Red', 'Green', 'Blue'])
    })

    it('should work with a zero-based enum', () => {
      expect(getEnumKeys(Direction)).toEqual(['North', 'South', 'East', 'West'])
    })
  })

  describe('getEnumValues', () => {
    it('should return the numeric values', () => {
      expect(getEnumValues(Color)).toEqual([1, 2, 3])
      expect(getEnumValues(Direction)).toEqual([0, 1, 2, 3])
    })
  })

  describe('getEnumEntries', () => {
    it('should return key/value pairs', () => {
      expect(getEnumEntries(Color)).toEqual([['Red', 1], ['Green', 2], ['Blue', 3]])
    })
  })

  describe('isEnumValue', () => {
    it('should be true for non-string values', () => {
      expect(isEnumValue(Color.Red)).toBe(true)
      expect(isEnumValue(0)).toBe(true)
    })

    it('should be false for string values', () => {
      expect(isEnumValue('Red')).toBe(false)
    })
  })
})
