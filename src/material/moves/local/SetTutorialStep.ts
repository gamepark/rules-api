import { MoveKind } from '../MoveKind'
import { LocalMoveType } from './LocalMove'
import { MaterialMove } from '../MaterialMove'

export type SetTutorialStep = {
  kind: MoveKind.LocalMove
  type: LocalMoveType.SetTutorialStep
  step: number
}

export function isSetTutorialStep(move: MaterialMove): move is SetTutorialStep {
  return move.kind === MoveKind.LocalMove && move.type === LocalMoveType.SetTutorialStep
}