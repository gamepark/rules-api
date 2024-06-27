import { MaterialItem } from '../../items'
import { Location } from '../../location'
import { MoveKind } from '../MoveKind'
import { LocalMoveType } from './LocalMove'

export type HelpDisplay<P extends number = number, M extends number = number, L extends number = number, RuleId extends number = number>
  = MaterialHelpDisplay<P, M, L>
  | LocationHelpDisplay<P, L>
  | RulesHelpDisplay<RuleId>

export enum HelpDisplayType {
  Material = 1, Location, Rules
}

export type MaterialHelpDisplay<P extends number = number, M extends number = number, L extends number = number> = {
  type: typeof HelpDisplayType.Material
  itemType: M
  itemIndex?: number
  displayIndex?: number
  item: Partial<MaterialItem<P, L>>
}

export type LocationHelpDisplay<P extends number = number, L extends number = number> = {
  type: typeof HelpDisplayType.Location
  location: Location<P, L>
}

export type RulesHelpDisplay<RuleId extends number = number> = {
  type: typeof HelpDisplayType.Rules
  ruleId: RuleId
}

export type DisplayHelp<P extends number = number, M extends number = number, L extends number = number> = {
  kind: MoveKind.LocalMove
  type: typeof LocalMoveType.DisplayHelp
  helpDisplay: HelpDisplay<P, M, L>
}

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

