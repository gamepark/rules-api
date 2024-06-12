import { MoveKind } from '../MoveKind'
import { LocalMoveType } from './LocalMove'

export type DropItem<M extends number = number> = {
  kind: MoveKind.LocalMove
  type: typeof LocalMoveType.DropItem
  item: DisplayedItem<M>
}

export type DisplayedItem<M extends number = number> = {
  type: M
  index: number
  displayIndex: number
}

export function dropItemMove<M extends number = number>(type: M, index: number, displayIndex: number): DropItem<M> {
  return { kind: MoveKind.LocalMove, type: LocalMoveType.DropItem, item: { type, index, displayIndex } }
}