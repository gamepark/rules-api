import { PlayerEnumOption } from './PlayerEnumOption'
import { WithIdOption } from './WithIdOption'

export type PlayersOptionsSpec<Options> =
  (Options extends WithIdOption<infer Id> ? { id: PlayerEnumOption<Id> } : {})
  & { [key in keyof Omit<Options, 'id'>]: PlayerEnumOption<Options[key]> }
