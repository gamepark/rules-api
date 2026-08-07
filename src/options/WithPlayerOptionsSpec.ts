import { PlayersOptionsSpec } from './PlayersOptionsSpec'
import { OptionsSpec } from './OptionsSpec'

export type WithPlayerOptionsSpec<P> = { players: PlayersOptionsSpec<P> }

/**
 * Whether the spec declares options *per player* — the v1 shape, where `players` maps option names to
 * their specs.
 *
 * A v2 spec is never one of those: it declares `players` as the table size range, `{ min, max }`, and
 * moved player identity to `identities`. The shapes are both objects, so the check has to name the
 * version rather than duck-type it — read as `players` alone, `{ min: 2, max: 4 }` reads as two player
 * options called `min` and `max`, and every caller that walks them then hands a number where an option
 * spec was expected.
 */
export function isWithPlayerOptions<P, Options>(optionsSpec: OptionsSpec<Options>): optionsSpec is OptionsSpec<Options> & WithPlayerOptionsSpec<P> {
  const spec = optionsSpec as OptionsSpec<Options> & WithPlayerOptionsSpec<P> & { specVersion?: number }
  return spec?.specVersion === undefined && typeof spec?.players === 'object'
}
