import { TFunction } from './TFunction'
import { OptionSpecOf } from './OptionSpecOf'
import { WithPlayerOptionsSpec } from './WithPlayerOptionsSpec'
import { WithPlayersOptions } from './WithPlayersOptions'

export type OptionsSpec<Options> =
  (Options extends WithPlayersOptions<infer P> ? WithPlayerOptionsSpec<P> : {})
  & { [key in keyof Omit<Options, 'players'>]: OptionSpecOf<Options[key]> }
  & {
    /**
     * @deprecated A function body is opaque to the platform, which therefore keeps the whole game on the legacy path.
     * Declare the constraint in an {@link OptionsSpecV2} instead: a player count range, a value-level `requires`,
     * a `forbidden-combination` rule, or — for team games — `teams`, whose balance the platform guarantees.
     */
    validate?: (options: Partial<Options>, t: TFunction) => void
  }
  & {
    /**
     * @deprecated Moved to the platform database — see `Option.subscriberRequired`.
     */
    subscriberRequired?: boolean
  }
  & {
    /**
     * @deprecated Moved to the platform database — see `Option.subscriberRequired`.
     */
    competitivePlayers?: { min: number, max: number }
  }
