import { MoveKind } from '../MoveKind'
import { LocalMoveType } from './LocalMove'
import { MaterialMove } from '../MaterialMove'

export type CloseTutorialPopup = {
  kind: MoveKind.LocalMove
  type: LocalMoveType.CloseTutorialPopup
}

export function isCloseTutorialPopup(move: MaterialMove): move is CloseTutorialPopup {
  return move.kind === MoveKind.LocalMove && move.type === LocalMoveType.CloseTutorialPopup
}