import { MaterialMove } from '../moves'

/**
 * Data structure for the state of the tutorial in a tutorial game implement with {@link MaterialRules}.
 * @property step Current step of the tutorial.
 * @property popupClosed true when the popup has been closed by the player.
 * @property stepComplete if true, the tutorial engine will move on to next step automatically.
 * @property interrupt The automatic consequences that have been interrupted to display some information explaining what is happening.
 */
export type TutorialState<P extends number = number,  M extends number = number,  L extends number = number, RuleId extends number = number> = {
  step: number
  popupClosed: boolean
  stepComplete: boolean
  interrupt?: MaterialMove<P, M, L, RuleId>[]
}
