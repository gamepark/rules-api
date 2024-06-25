import isEqual from 'lodash/isEqual'
import { hasEliminations } from './Eliminations'

export abstract class Rules<Game = any, Move = any, PlayerId = any> {
  game: Game

  constructor(game: Game) {
    this.game = game
  }

  get state() { // backward compatibility
    return this.game
  }

  delegate(): Rules<Game, Move, PlayerId> | undefined {
    return
  }

  delegates(): Rules<Game, Move, PlayerId>[] {
    const delegate = this.delegate()
    return delegate ? [delegate] : []
  }

  isTurnToPlay(playerId: PlayerId): boolean {
    const rules = this.delegates()
    if (rules.some(rules => rules.isTurnToPlay(playerId))) {
      return true
    }
    return playerId === this.getActivePlayer()
  }

  getActivePlayer(): PlayerId | undefined {
    for (const delegate of this.delegates()) {
      const activePlayer = delegate.getActivePlayer()
      if (activePlayer !== undefined) return activePlayer
    }
    return
  }

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

  getLegalMoves(playerId: PlayerId): Move[] {
    return this.delegates().flatMap(rules => rules.getLegalMoves(playerId))
  }

  getAutomaticMoves(): Move[] {
    return this.delegates().flatMap(rules => rules.getAutomaticMoves())
  }

  play(move: Move, context?: PlayMoveContext): Move[] {
    return this.delegates().flatMap(rules => rules.play(move, context))
  }

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

  isUnpredictableMove?(move: Move, player: PlayerId): boolean
}

export type PlayMoveContext = {
  local?: boolean
}
