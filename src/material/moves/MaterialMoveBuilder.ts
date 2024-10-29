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

/**
 * Common namespaces for all the helper function that creates the different types of {@link MaterialMove} objects.
 */
export namespace MaterialMoveBuilder {

  /**
   * Creates a {@link StartPlayerTurn} object
   */
  export const startPlayerTurn = <P extends number = number, R extends number = number>(id: R, player: P): StartPlayerTurn<P, R> =>
    ({ kind: MoveKind.RulesMove, type: RuleMoveType.StartPlayerTurn, id, player })

  /**
   * Creates a {@link StartSimultaneousRule} object
   */
  export const startSimultaneousRule = <P extends number = number, R extends number = number>(id: R, players?: P[]): StartSimultaneousRule<P, R> => {
    const move: StartSimultaneousRule<P, R> = { kind: MoveKind.RulesMove, type: RuleMoveType.StartSimultaneousRule, id }
    if (players) move.players = players
    return move
  }

  /**
   * Creates a {@link EndPlayerTurn} object
   */
  export const endPlayerTurn = <P extends number = number>(player: P): EndPlayerTurn<P> =>
    ({ kind: MoveKind.RulesMove, type: RuleMoveType.EndPlayerTurn, player })

  /**
   * Creates a {@link StartRule} object
   */
  export const startRule = <R extends number = number>(id: R): StartRule<R> => ({ kind: MoveKind.RulesMove, type: RuleMoveType.StartRule, id })

  /**
   * Creates a {@link CustomMove} object
   */
  export const customMove = <Type extends number = number>(type: Type, data?: any): CustomMove => {
    const move: CustomMove = { kind: MoveKind.CustomMove, type }
    if (data !== undefined) move.data = data
    return move
  }

  /**
   * Creates a {@link EndGame} object
   */
  export const endGame = (): EndGame => ({ kind: MoveKind.RulesMove, type: RuleMoveType.EndGame })

  /**
   * Creates a {@link DisplayHelp} object
   */
  export const displayHelp = <P extends number = number, M extends number = number, L extends number = number>
  (helpDisplay?: HelpDisplay<P, M, L>): DisplayHelp<P, M, L> =>
    ({ kind: MoveKind.LocalMove, type: LocalMoveType.DisplayHelp, helpDisplay })

  /**
   * Creates a {@link DisplayHelp} object holding a {@link MaterialHelpDisplay}
   */
  export const displayMaterialHelp = <P extends number = number, M extends number = number, L extends number = number>
  (itemType: M, item: Partial<MaterialItem<P, L>> = {}, itemIndex?: number, displayIndex?: number): DisplayHelp<P, M, L> =>
    displayHelp({ type: HelpDisplayType.Material, itemType, itemIndex, displayIndex, item })

  /**
   * Creates a {@link DisplayHelp} object holding a {@link LocationHelpDisplay}
   */
  export const displayLocationHelp = <P extends number = number, M extends number = number, L extends number = number>
  (location: Location<P, L>): DisplayHelp<P, M, L> =>
    displayHelp({ type: HelpDisplayType.Location, location })

  /**
   * Creates a {@link DisplayHelp} object holding a {@link RulesHelpDisplay}
   */
  export const displayRulesHelp = <P extends number = number, M extends number = number, L extends number = number, RuleId extends number = number>
  (ruleId: RuleId): DisplayHelp<P, M, L> =>
    displayHelp({ type: HelpDisplayType.Rules, ruleId })

  /**
   * Creates a {@link DropItem} object
   */
  export function dropItemMove<M extends number = number>(type: M, index: number, displayIndex: number): DropItem<M> {
    return { kind: MoveKind.LocalMove, type: LocalMoveType.DropItem, item: { type, index, displayIndex } }
  }
}
