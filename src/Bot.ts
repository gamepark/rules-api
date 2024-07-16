import { RulesCreator } from './Rules'

export abstract class Bot<Game = any, Move = any, Player = any> {
  protected constructor(protected player: Player) {
  }

  abstract run(game: Game): Move[]
}

export class RandomBot<Game = any, Move = any, Player = any> extends Bot {
  constructor(private Rules: RulesCreator<Game, Move, Player>, player: Player) {
    super(player)
  }

  run(game: Game): Move[] {
    const moves = this.getLegalMoves(game)
    switch (moves.length) {
      case 0:
        console.warn('Random bot requires at least one legal move from getLegalMoves to run')
        return []
      case 1:
        return moves
      default:
        return [moves[Math.floor(Math.random() * moves.length)]]
    }
  }

  protected getLegalMoves(game: Game) {
    return new this.Rules(game).getLegalMoves(this.player)
  }
}