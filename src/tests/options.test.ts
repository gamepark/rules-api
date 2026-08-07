import { describe, expect, it } from 'vitest'
import {
  generatePlayersOption,
  getPlayersAvailableValues,
  getPlayersMandatoryValues,
  isEnumArrayOption,
  isEnumOption,
  isWithPlayerIdOptions,
  isWithPlayerOptions,
  OptionsValidationError,
  PlayerEnumOption
} from '../options'

enum Color { Red = 1, Blue, Green, Yellow }

const colorOption = (over: Partial<PlayerEnumOption<Color>> = {}): PlayerEnumOption<Color> => ({
  label: () => 'Color',
  values: [Color.Red, Color.Blue, Color.Green, Color.Yellow],
  valueSpec: () => ({ label: () => '' }),
  ...over
})

describe('options', () => {

  describe('OptionsValidationError', () => {
    it('should carry a message and fields', () => {
      const error = new OptionsValidationError('bad', ['a', 'b'])
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('bad')
      expect(error.fields).toEqual(['a', 'b'])
    })

    it('should default fields to an empty array', () => {
      expect(new OptionsValidationError('oops').fields).toEqual([])
    })
  })

  describe('isEnumOption / isEnumArrayOption', () => {
    it('should detect an enum option by its values array', () => {
      expect(isEnumOption(colorOption() as any)).toBe(true)
      expect(isEnumOption({} as any)).toBe(false)
    })

    it('should detect an enum array option by its size', () => {
      expect(isEnumArrayOption({ ...colorOption(), size: 2 } as any)).toBe(true)
      expect(isEnumArrayOption(colorOption() as any)).toBe(false) // no size
      expect(isEnumArrayOption({ size: 2 } as any)).toBe(false) // no values
    })
  })

  describe('isWithPlayerOptions / isWithPlayerIdOptions', () => {
    it('should detect a spec with player options', () => {
      expect(isWithPlayerOptions({ players: { color: colorOption() } } as any)).toBe(true)
      expect(isWithPlayerOptions({} as any)).toBe(false)
    })

    it('should not take a v2 player count range for player options', () => {
      expect(isWithPlayerOptions({ specVersion: 2, players: { min: 2, max: 4 } } as any)).toBe(false)
    })

    it('should detect a spec with a player id option', () => {
      expect(isWithPlayerIdOptions({ players: { id: colorOption() } } as any)).toBe(true)
      expect(isWithPlayerIdOptions({ players: { color: colorOption() } } as any)).toBe(false) // no id
      expect(isWithPlayerIdOptions({} as any)).toBe(false) // no players
    })
  })

  describe('getPlayersMandatoryValues', () => {
    it('should return the mandatory values for the player count', () => {
      const option = colorOption({ mandatory: (players) => players >= 3 ? [Color.Red] : [] })
      expect(getPlayersMandatoryValues(option, 3)).toEqual([Color.Red])
      expect(getPlayersMandatoryValues(option, 2)).toEqual([])
    })

    it('should return an empty array without a mandatory function', () => {
      expect(getPlayersMandatoryValues(colorOption(), 4)).toEqual([])
    })
  })

  describe('getPlayersAvailableValues', () => {
    it('should filter out unavailable values', () => {
      const option = colorOption({ unavailable: () => [Color.Yellow] })
      expect(getPlayersAvailableValues(option, 4)).toEqual([Color.Red, Color.Blue, Color.Green])
    })

    it('should return all values without an unavailable function', () => {
      expect(getPlayersAvailableValues(colorOption(), 4)).toEqual([Color.Red, Color.Blue, Color.Green, Color.Yellow])
    })
  })

  describe('generatePlayersOption', () => {
    it('should fill missing choices with distinct available values when not optional', () => {
      const result = generatePlayersOption([null, null, null], colorOption())
      expect(result).toHaveLength(3)
      expect(result.every(c => c !== null)).toBe(true)
      expect(new Set(result).size).toBe(3) // all distinct (4 values for 3 players)
      expect(result.every(c => colorOption().values.includes(c))).toBe(true)
    })

    it('should always include mandatory values', () => {
      const option = colorOption({ mandatory: () => [Color.Green] })
      const result = generatePlayersOption([null, null, null], option)
      expect(result).toContain(Color.Green)
    })

    it('should drop values that are not available', () => {
      const option = colorOption({ unavailable: () => [Color.Red] })
      const result = generatePlayersOption([Color.Red, Color.Blue, null], option)
      expect(result).not.toContain(Color.Red)
    })

    it('should de-duplicate choices when sharing is not allowed', () => {
      const option = colorOption({ optional: true }) // keep nulls to observe dedup only
      const result = generatePlayersOption([Color.Blue, Color.Blue, null], option)
      expect(result.filter(c => c === Color.Blue)).toHaveLength(1)
    })

    it('should allow duplicate choices when sharing is allowed', () => {
      const option = colorOption({ share: true, optional: true })
      const result = generatePlayersOption([Color.Blue, Color.Blue, null], option)
      expect(result.filter(c => c === Color.Blue)).toHaveLength(2)
    })

    it('should keep nulls when the option is optional', () => {
      const option = colorOption({ optional: true })
      const result = generatePlayersOption([Color.Red, null, null], option)
      expect(result.filter(c => c === null)).toHaveLength(2)
    })
  })
})
