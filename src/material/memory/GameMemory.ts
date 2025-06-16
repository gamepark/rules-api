import { MaterialGame } from '../MaterialGame'

/**
 * Utility class to manipulate the memory in a {@link MaterialGame}.
 */
export class GameMemory<Player extends number = number> {
  /**
   * @constructor
   * @param {MaterialGame} game Current state of the game
   */
  constructor(private game: MaterialGame<Player>) {
  }

  /**
   * Save a new value inside the memory
   * @param key The key to index the memorized value
   * @param value Any JSON serializable value to store, or a function that takes previous stored value and returns the new value to store
   */
  memorize<T = any>(key: keyof any, value: T | ((lastValue: T) => T)): void {
    if (typeof value === 'function') {
      this.game.memory[key] = (value as (lastValue: T) => T)(this.game.memory[key])
    } else {
      this.game.memory[key] = value
    }
  }

  /**
   * Get a value stored in the memory
   * @param key The key to index the memorized value
   * @returns the value stored (or undefined is nothing was stored under this key yet)
   */
  remind<T = any>(key: keyof any): T {
    return this.game.memory[key]
  }

  /**
   * Delete a value from the memory
   * @param key Key of the value to delete
   */
  forget(key: keyof any): void {
    delete this.game.memory[key]
  }
}