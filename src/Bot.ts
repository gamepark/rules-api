import { RulesCreator } from './Rules'

/**
 * A Bot is a player controlled by a machine for a game.
 * Used to replace players that quit a game, or for opponents in tutorials.
 * Could be used to create AI players.
 */
export abstract class Bot<Game = any, Move = any, Player = any> {
  protected constructor(protected player: Player) {
  }

  /**
   * When to bot run, it must return a list of moves to execute given the current game state.
   * @param game Current game state
   * @returns The moves that the bot plays
   */
  abstract run(game: Game): Move[]
}

/**
 * A random bot picks a random move to play amongst all the legal moves.
 * Most board games can list efficiently all the legal moves all the time, which allows to have random bot to replace any missing opponent.
 */
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

  /**
   * The legal moves for this player at this game state.
   * Can be overridden if you need to further restrict the moves you want the bot to play.
   *
   * @param game The game state
   * @protected
   */
  protected getLegalMoves(game: Game) {
    return new this.Rules(game).getLegalMoves(this.player)
  }
}