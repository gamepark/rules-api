import { MaterialGame } from '../MaterialGame'

/**
 * Utility class to manipulate a player's memory in a {@link MaterialGame}.
 */
export class PlayerMemory<Player extends number = number> {
  /**
   * @constructor
   * @param {MaterialGame} game Current state of the game
   * @param player The player to work with
   */
  constructor(private game: MaterialGame<Player>, private player: Player) {
  }

  /**
   * Save a new value inside the memory
   * @param key The key to index the memorized value
   * @param value Any JSON serializable value to store, or a function that takes previous stored value and returns the new value to store
   */
  memorize<T = any>(key: keyof any, value: T | ((lastValue: T) => T)): T {
    if (!this.game.memory[key]) this.game.memory[key] = {}
    if (typeof value === 'function') {
      this.game.memory[key][this.player] = (value as (lastValue: T) => T)(this.game.memory[key][this.player])
    } else {
      this.game.memory[key][this.player] = value
    }
    return this.game.memory[key][this.player]
  }

  /**
   * Get a value stored in the memory
   * @param key The key to index the memorized value
   * @returns the value stored (or undefined is nothing was stored under this key yet)
   */
  remind<T = any>(key: keyof any): T {
    return this.game.memory[key]?.[this.player]
  }

  /**
   * Delete a value from the memory
   * @param key Key of the value to delete
   */
  forget(key: keyof any): void {
    delete this.game.memory[key]?.[this.player]
  }
}