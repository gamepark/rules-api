import { TFunction } from 'i18next'
import { OptionSpecOf } from './OptionSpecOf'
import { WithPlayerOptionsSpec } from './WithPlayerOptionsSpec'
import { WithPlayersOptions } from './WithPlayersOptions'

export type OptionsSpec<Options> =
  (Options extends WithPlayersOptions<infer P> ? WithPlayerOptionsSpec<P> : {})
  & { [key in keyof Omit<Options, 'players'>]: OptionSpecOf<Options[key]> }
  & { validate?: (options: Partial<Options>, t: TFunction) => void }
  & { subscriberRequired?: boolean }
