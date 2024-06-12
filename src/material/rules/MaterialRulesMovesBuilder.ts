import { MaterialGame } from '../MaterialGame'
import { CustomMove, EndGame, EndPlayerTurn, MoveKind, RuleMoveType, StartPlayerTurn, StartRule, StartSimultaneousRule } from '../moves'

export class MaterialRulesMovesBuilder<Player extends number = number,
  MaterialType extends number = number,
  LocationType extends number = number> {
  game: MaterialGame<Player, MaterialType, LocationType>

  constructor(game: MaterialGame<Player, MaterialType, LocationType>) {
    this.game = game
  }

  startPlayerTurn<RuleId extends number = number>(id: RuleId, player: Player): StartPlayerTurn<Player, RuleId> {
    return { kind: MoveKind.RulesMove, type: RuleMoveType.StartPlayerTurn, id, player }
  }

  startSimultaneousRule<RuleId extends number = number>(id: RuleId, players?: Player[]): StartSimultaneousRule<Player, RuleId> {
    const move: StartSimultaneousRule<Player, RuleId> = { kind: MoveKind.RulesMove, type: RuleMoveType.StartSimultaneousRule, id }
    if (players) move.players = players
    return move
  }

  endPlayerTurn(player: Player): EndPlayerTurn<Player> {
    return { kind: MoveKind.RulesMove, type: RuleMoveType.EndPlayerTurn, player }
  }

  startRule<RuleId extends number = number>(id: RuleId): StartRule<RuleId> {
    return { kind: MoveKind.RulesMove, type: RuleMoveType.StartRule, id }
  }

  customMove<Type extends number = number>(type: Type, data?: any): CustomMove {
    const move: CustomMove = { kind: MoveKind.CustomMove, type }
    if (data !== undefined) move.data = data
    return move
  }

  endGame(): EndGame {
    return { kind: MoveKind.RulesMove, type: RuleMoveType.EndGame }
  }
}
