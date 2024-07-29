import { CustomMove, EndGame, EndPlayerTurn, MoveKind, RuleMoveType, StartPlayerTurn, StartRule, StartSimultaneousRule } from './index'

export namespace MaterialMoveBuilder {

  export const startPlayerTurn = <P extends number = number, R extends number = number>(id: R, player: P): StartPlayerTurn<P, R> =>
    ({ kind: MoveKind.RulesMove, type: RuleMoveType.StartPlayerTurn, id, player })

  export const startSimultaneousRule = <P extends number = number, R extends number = number>(id: R, players?: P[]): StartSimultaneousRule<P, R> => {
    const move: StartSimultaneousRule<P, R> = { kind: MoveKind.RulesMove, type: RuleMoveType.StartSimultaneousRule, id }
    if (players) move.players = players
    return move
  }

  export const endPlayerTurn = <P extends number = number>(player: P): EndPlayerTurn<P> =>
    ({ kind: MoveKind.RulesMove, type: RuleMoveType.EndPlayerTurn, player })

  export const startRule = <R extends number = number>(id: R): StartRule<R> => ({ kind: MoveKind.RulesMove, type: RuleMoveType.StartRule, id })

  export const customMove = <Type extends number = number>(type: Type, data?: any): CustomMove => {
    const move: CustomMove = { kind: MoveKind.CustomMove, type }
    if (data !== undefined) move.data = data
    return move
  }

  export const endGame = (): EndGame => ({ kind: MoveKind.RulesMove, type: RuleMoveType.EndGame })
}
