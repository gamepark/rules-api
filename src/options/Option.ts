import { TFunction } from './TFunction'

export type Option = {
  label: (t: TFunction) => string
  help?: (t: TFunction) => string
  warn?: (t: TFunction) => string
  /**
   * @deprecated Moved to the platform database. Game Park now stores the
   * subscriber gate per option (and per option value) in the board game's
   * options policy, editable in the admin back office, so it can be changed
   * without republishing the game. Existing bundles keep being honoured as a
   * fallback; drop this field from the game code — it will be removed.
   */
  subscriberRequired?: boolean
  /**
   * @deprecated Moved to the platform database — see `subscriberRequired`.
   */
  competitiveDisabled?: boolean
  solo?: boolean
  hide?: (players: number) => boolean
}
