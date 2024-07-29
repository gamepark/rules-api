import { MoveKind } from '../MoveKind'
import { LocalMoveType } from './LocalMove'
import { MaterialMove } from '../MaterialMove'

/**
 * Move object to set a tutorial to a specific step
 */
export type SetTutorialStep = {
  kind: MoveKind.LocalMove
  type: LocalMoveType.SetTutorialStep
  step: number
}

/**
 * Type guard to test if a {@link MaterialMove} is a {@link SetTutorialStep} move
 * @param move Move to test
 * @returns true if move is a {@link SetTutorialStep}
 */
export function isSetTutorialStep(move: MaterialMove): move is SetTutorialStep {
  return move.kind === MoveKind.LocalMove && move.type === LocalMoveType.SetTutorialStep
}