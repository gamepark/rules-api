import { MaterialItem } from '../items'
import { Location } from '../location'
import {
  CustomMove, DisplayHelp, DropItem,
  EndGame,
  EndPlayerTurn,
  HelpDisplay, HelpDisplayType,
  LocalMoveType,
  MoveKind,
  RuleMoveType,
  StartPlayerTurn,
  StartRule,
  StartSimultaneousRule
} from './index'

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

  export const displayHelp = <P extends number = number, M extends number = number, L extends number = number>
  (helpDisplay: HelpDisplay<P, M, L>): DisplayHelp<P, M, L> =>
    ({ kind: MoveKind.LocalMove, type: LocalMoveType.DisplayHelp, helpDisplay })

  export const displayMaterialHelp = <P extends number = number, M extends number = number, L extends number = number>
  (itemType: M, item: Partial<MaterialItem<P, L>> = {}, itemIndex?: number, displayIndex?: number): DisplayHelp<P, M, L> =>
    displayHelp({ type: HelpDisplayType.Material, itemType, itemIndex, displayIndex, item })

  export const displayLocationHelp = <P extends number = number, M extends number = number, L extends number = number>
  (location: Location<P, L>): DisplayHelp<P, M, L> =>
    displayHelp({ type: HelpDisplayType.Location, location })

  export const displayRulesHelp = <P extends number = number, M extends number = number, L extends number = number, RuleId extends number = number>
  (ruleId: RuleId): DisplayHelp<P, M, L> =>
    displayHelp({ type: HelpDisplayType.Rules, ruleId })

  export function dropItemMove<M extends number = number>(type: M, index: number, displayIndex: number): DropItem<M> {
    return { kind: MoveKind.LocalMove, type: LocalMoveType.DropItem, item: { type, index, displayIndex } }
  }
}
