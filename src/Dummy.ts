import { RulesCreator } from './RulesCreator'

export class Dummy<Game, Move = string, PlayerId = number> {

  Rules: RulesCreator<Game, Move, PlayerId>

  constructor(Rules: RulesCreator<Game, Move, PlayerId>) {
    this.Rules = Rules
  }

  getRandomMove(state: Game, playerId: PlayerId): Promise<Move[]> {
    let moves = this.getLegalMoves(state, playerId)
    if (!moves.length) return Promise.resolve([])
    return Promise.resolve([moves[Math.floor(Math.random() * moves.length)]])
  }

  getLegalMoves(state: Game, player: PlayerId): Move[] {
    const rules = new this.Rules(state, { player })
    if (rules.getLegalMoves) {
      return rules.getLegalMoves(player)
    } else {
      console.error('Dummy player cannot work if getLegalMoves is not implemented!')
      return []
    }
  }
}
