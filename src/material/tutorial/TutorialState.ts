import { MaterialMove } from '../moves'

export type TutorialState<P extends number = number,  M extends number = number,  L extends number = number> = {
  step: number
  popupClosed: boolean
  stepComplete: boolean
  interrupt?: MaterialMove<P, M, L>[]
}
