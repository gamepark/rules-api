import { MoveKind } from '../MoveKind'
import { LocalMoveType } from './LocalMove'
import { MaterialMove } from '../MaterialMove'

/**
 * Move object to close the popup during a tutorial
 */
export type ChangeView<View extends number = number> = {
  kind: MoveKind.LocalMove
  type: LocalMoveType.ChangeView
  view: View
}

/**
 * Type guard to test if a {@link MaterialMove} is a {@link ChangeView} move
 * @param move Move to test
 * @returns true if move is a {@link ChangeView}
 */
export function isChangeView(move: MaterialMove): move is ChangeView {
  return move.kind === MoveKind.LocalMove && move.type === LocalMoveType.ChangeView
}