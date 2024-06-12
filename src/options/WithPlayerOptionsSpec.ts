import { PlayersOptionsSpec } from './PlayersOptionsSpec'
import { OptionsSpec } from './OptionsSpec'

export type WithPlayerOptionsSpec<P> = { players: PlayersOptionsSpec<P> }

export function isWithPlayerOptions<P, Options>(optionsSpec: OptionsSpec<Options>): optionsSpec is OptionsSpec<Options> & WithPlayerOptionsSpec<P> {
  return typeof (optionsSpec as OptionsSpec<Options> & WithPlayerOptionsSpec<P>).players === 'object'
}