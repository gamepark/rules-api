import { MoveKind } from './MoveKind'
import { MaterialMove } from './MaterialMove'

export type CustomMove<Type extends number = number> = {
  kind: typeof MoveKind.CustomMove
  type: Type
  data?: any
}

export const isCustomMove = <T extends number = number, P extends number = number, M extends number = number, L extends number = number>(
  move: MaterialMove<P, M, L>
): move is CustomMove<T> => move.kind === MoveKind.CustomMove

export function isCustomMoveType<T extends number = number, P extends number = number, M extends number = number, L extends number = number>(
  type: T
): (move: MaterialMove<P, M, L>) => move is CustomMove<T> {
  return (move: MaterialMove<P, M, L>): move is CustomMove<T> => isCustomMove(move) && move.type === type
}
