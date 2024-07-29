import { MoveKind } from '../MoveKind'
import { LocalMoveType } from './LocalMove'
import { MaterialMove } from '../MaterialMove'

/**
 * Move object to close the popup during a tutorial
 */
export type CloseTutorialPopup = {
  kind: MoveKind.LocalMove
  type: LocalMoveType.CloseTutorialPopup
}

/**
 * Type guard to test if a {@link MaterialMove} is a {@link CloseTutorialPopup} move
 * @param move Move to test
 * @returns true if move is a {@link CloseTutorialPopup}
 */
export function isCloseTutorialPopup(move: MaterialMove): move is CloseTutorialPopup {
  return move.kind === MoveKind.LocalMove && move.type === LocalMoveType.CloseTutorialPopup
}