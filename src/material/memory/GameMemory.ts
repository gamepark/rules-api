import { MaterialGame } from '../MaterialGame'

export class GameMemory<Player extends number = number> {
  constructor(private game: MaterialGame<Player>) {
  }

  memorize<T = any>(key: keyof any, value: T | ((lastValue: T) => T)): void {
    if (typeof value === 'function') {
      this.game.memory[key] = (value as (lastValue: T) => T)(this.game.memory[key])
    } else {
      this.game.memory[key] = value
    }
    if (typeof this.game.memory[key] === 'object') {
      this.game.memory[key] = JSON.parse(JSON.stringify(this.game.memory[key]))
    }
  }

  remind<T = any>(key: keyof any): T {
    return this.game.memory[key]
  }

  forget(key: keyof any): void {
    delete this.game.memory[key]
  }
}