import isEqual from 'lodash/isEqual'
import { hasEliminations } from './Eliminations'

/**
 * The Rules class is the basic minimal API to implement when adapting a board game on Game Park.
 * It has the ability to tell whether it is a player's turn to play, what moves are legal, what happens when a move is played, and when the game is over.
 *
 * @typeparam Game - Data structure of the game state
 * @typeparam Move - Data structure of a game move
 * @typeparam PlayerId - type of the player's identifiers. Usually a number or a numeric enum.
 */
export abstract class Rules<Game = any, Move = any, PlayerId = any> {
  /**
   * The state of the game
   */
  game: Game

  /**
   * Construct a new instance of the Rules to work on a game state
   * @param game the state of the game to work on
   */
  constructor(game: Game) {
    this.game = game
  }

  /**
   * A shortcut for this.game for backward compatibility
   */
  get state() {
    return this.game
  }

  /**
   * The delegation allows to split the rules in smaller and simpler parts.
   * Override this method to delegate the behavior of the other method to another Rules class.
   *
   * @return the Rule you want to delegate the current game behavior to
   */
  delegate(): Rules<Game, Move, PlayerId> | undefined {
    return
  }

  /**
   * The delegation allows to split the rules in smaller and simpler parts.
   * Default behavior call @see {@link delegate} and returns either an empty array, or an array with the delegate if any.
   * Override this method to delegate the behavior of the other method to multiple Rules class.
   *
   * @return an array of Rules to delegate the current game behavior to
   */
  delegates(): Rules<Game, Move, PlayerId>[] {
    const delegate = this.delegate()
    return delegate ? [delegate] : []
  }

  /**
   * Implement this to tell at any point in the game which player is active or not.
   * When it's a player's turn, his thinking time decreases.
   * A player whose turn it's not can have authorised moves, so this method is not sufficient to prevent a player from playing.
   * Supports delegation: it returns true if any @see {@link delegates} return true.
   *
   * @param playerId - Identifier of a player
   * @returns true if it is this player's turn to play
   */
  isTurnToPlay(playerId: PlayerId): boolean {
    const rules = this.delegates()
    if (rules.some(rules => rules.isTurnToPlay(playerId))) {
      return true
    }
    return playerId === this.getActivePlayer()
  }

  /**
   * When only one player is active at a time, you can implement this method instead of "isTurnToPlay" to tell which player is active.
   * Supports delegation: if any @see {@link delegates} returns an active player, it will return it.
   *
   * @return @typeParam PlayerId - The identifier of the active player
   */
  getActivePlayer(): PlayerId | undefined {
    for (const delegate of this.delegates()) {
      const activePlayer = delegate.getActivePlayer()
      if (activePlayer !== undefined) return activePlayer
    }
    return
  }

  /**
   * This method allows the Game Park server to authorise only valid moves in accordance with the game rules.
   * The default behavior calls @see {@link getLegalMoves}, and returns true when at least one move is equal.
   * Supports delegation with @see {@link delegates}. A move is legal if it is legal for at least one delegate.
   *
   * @param playerId - Identifier of a player
   * @param move - a Move to control
   * @returns true if the move can be played by this player
   */
  isLegalMove(playerId: PlayerId, move: Move): boolean {
    const rules = this.delegates()
    if (rules.some(rules => rules.isLegalMove(playerId, move))) {
      return true
    }
    if (this.getLegalMoves(playerId).some(legalMove => isEqual(move, legalMove))) {
      return true
    }
    if (hasEliminations(this) && this.giveUpMove) {
      return isEqual(move, this.giveUpMove(playerId))
    }
    return false
  }


  /**
   * This method lists all the moves that are legal for a given player.
   * This is optional but convenient: it is used by @see {@link isLegalMove}, @see {@link Dummy} and many UI features from @gamepark/react-game to automatically
   * highlight what can be done on the screen.
   * Beware of the size of the list however: if the game offers to many legal moves, you might have to fall back to implementing {@link isLegalMove} and a
   * custom @see {@link Dummy}.
   *
   * Supports delegation with @see {@link delegates}: by default it will return all the legal moves of each delegate.
   *
   * @param playerId - Identifier of a player
   * @returns the list of the moves
   */
  getLegalMoves(playerId: PlayerId): Move[] {
    return this.delegates().flatMap(rules => rules.getLegalMoves(playerId))
  }

  /**
   * When some game state require automatic actions to be taken by the players, you can return a list of moves to play played automatically.
   * It can be a sequences in the rules where everything is scripted for instance (no choices left for players).
   *
   * @deprecated because of the lifecycle of this method, the game state must never be modified inside it. However, it is a very common mistake, so
   * this method should not be used at all: use @see {@link play} method to return the automatic moves.
   *
   * Supports delegation with @see {@link delegates}: by default it will return all the automatic moves of each delegate.
   *
   * @returns the list of the moves that must be played automatically
   */
  getAutomaticMoves(): Move[] {
    return this.delegates().flatMap(rules => rules.getAutomaticMoves())
  }

  /**
   * Executes a move on current game state.
   * This method is the only one that should mutate the state of the game.
   * When a move is played by a player, or automatically played as a consequence of another move, it will be played by this method, independently on Game Park
   * server and on every player or spectator clients. It can also be replayed in replay or undo features.
   *
   * A move should not change a lot the game state: instead, this method should return new moves to play as consequences.
   * Dividing moves into small parts with consequences is key to producing step-by-step animations in the UI.
   *
   * @see {@link https://en.wikipedia.org/wiki/Command_pattern}
   *
   * Supports delegation with @see {@link delegates}: by default it will play the move on each delegate, and return all the consequences.
   *
   * @param move - the Move to execute on the game state
   * @param context - context of execution: @see {@link PlayMoveContext}
   * @returns A list of moves that should be immediately played as consequences of this move
   */
  play(move: Move, context?: PlayMoveContext): Move[] {
    return this.delegates().flatMap(rules => rules.play(move, context))
  }

  /**
   * This method must return true when the game is over.
   *
   * Supports delegation with @see {@link delegates}: by default it will return true if there is at least one delegate, and every delegate returns true.
   * Default behavior returns true if playersIds is provided, and it is not @see {@link isTurnToPlay} for any player - however this behavior is deprecated.
   *
   * @param playerIds - All the player ids in the game. Do not use (deprecated).
   * @returns true if game is over
   */
  isOver(playerIds?: PlayerId[]): boolean {
    const delegates = this.delegates()
    if (delegates.length > 0 && delegates.every(delegate => delegate.isOver(playerIds))) {
      return true
    }
    if (playerIds) {
      return !playerIds.some(playerId => this.isTurnToPlay(playerId))
    }
    return this.getActivePlayer() === undefined
  }

  /**
   * Implement this method when some moves output cannot be predicted on the client side.
   * Unpredictable moves will not be proceeded by the client, which will wait for the server's response.
   * Examples: rolling dices, drawing a card
   *
   * @param move a move that is going to be played
   * @param player the player that played this move, or the move that triggered it as a consequence
   * @returns true if the move cannot be predicted from the player point of view
   */
  isUnpredictableMove?(move: Move, player: PlayerId): boolean
}

export interface RulesCreator<Game = any, Move = any, Player = number> {
  new(state: Game, client?: { player?: Player }): Rules<Game, Move, Player>
}

/**
 * The context when a move is played.
 */
export type PlayMoveContext = {
  /**
   * true if move is only played locally on a player's client
   */
  local?: boolean
}
