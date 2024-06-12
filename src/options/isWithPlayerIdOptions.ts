import { OptionsSpec } from './OptionsSpec'
import { PlayersOptionsSpec } from './PlayersOptionsSpec'
import { WithIdOption } from './WithIdOption'
import { WithPlayerOptionsSpec } from './WithPlayerOptionsSpec'

export function isWithPlayerIdOptions<Id, P extends WithIdOption<Id>, Options>(optionsSpec: OptionsSpec<Options>): optionsSpec is OptionsSpec<Options> & WithPlayerOptionsSpec<P> {
  const playersOptions = (optionsSpec as OptionsSpec<Options> & WithPlayerOptionsSpec<P>)?.players
  if (!playersOptions) return false
  const idOptions = (playersOptions as PlayersOptionsSpec<P> & WithIdOption<Id>).id
  return !!idOptions
}