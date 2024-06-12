import { MaterialGame } from '../MaterialGame'

export class PlayerMemory<Player extends number = number> {
  constructor(private game: MaterialGame<Player>, private player: Player) {
  }

  memorize<T = any>(key: keyof any, value: T | ((lastValue: T) => T)): void {
    if (!this.game.memory[key]) this.game.memory[key] = {}
    if (typeof value === 'function') {
      this.game.memory[key][this.player] = (value as (lastValue: T) => T)(this.game.memory[key][this.player])
    } else {
      this.game.memory[key][this.player] = value
    }
    if (typeof this.game.memory[key][this.player] === 'object') {
      this.game.memory[key][this.player] = JSON.parse(JSON.stringify(this.game.memory[key][this.player]))
    }
  }

  remind<T = any>(key: keyof any): T {
    return this.game.memory[key]?.[this.player]
  }

  forget(key: keyof any): void {
    delete this.game.memory[key]?.[this.player]
  }
}