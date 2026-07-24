import { describe, expect, it } from 'vitest'
import { loopWithFuse } from '../utils'

describe('loops.util', () => {

  describe('loopWithFuse', () => {
    it('should stop when the repeat function returns false', () => {
      let count = 0
      loopWithFuse(() => {
        count++
        return count < 5
      })
      expect(count).toBe(5)
    })

    it('should not run the body when repeat is immediately false', () => {
      let count = 0
      loopWithFuse(() => {
        count++
        return false
      })
      expect(count).toBe(1)
    })

    it('should throw after the given number of attempts', () => {
      expect(() => loopWithFuse(() => true, { attempts: 10 })).toThrow('Infinite loop detected')
    })

    it('should throw the custom error provided by errorFn', () => {
      expect(() => loopWithFuse(() => true, { attempts: 3, errorFn: () => new Error('boom') })).toThrow('boom')
    })
  })
})
