import { MaterialBase } from './MaterialBase'
import { MaterialDeck } from './MaterialDeck'
import { MaterialItem } from './MaterialItem'
import { MaterialMoney } from './MaterialMoney'

/**
 * The Material class is the core helper class that help manipulate the game items in a simple way.
 * It includes two kind of functions: functions to filter items, and functions to build {@link ItemMove} objects.
 * Filter function will all return a new instance of Material with only the filtered items. This class is designed to be immutable.
 *
 * All the filtering and move creation logic lives in {@link MaterialBase}; this class only adds the factory helpers
 * ({@link deck} and {@link money}) that build specialised instances — keeping the dependency arrow one-way and
 * avoiding a circular import with {@link MaterialDeck} / {@link MaterialMoney}.
 *
 * @typeparam P - identifier of a player. Either a number or a numeric enum (eg: PlayerColor)
 * @typeparam M - Numeric enum of the types of material manipulated in the game
 * @typeparam L - Numeric enum of the types of location in the game where the material can be located
 */
export class Material<P extends number = number, M extends number = number, L extends number = number> extends MaterialBase<P, M, L> {

  /**
   * Return a new {@link MaterialDeck} helper class, to deal cards easily.
   *
   * @param selector The sort to apply on the deck. See {@link sort}. Defaults to -item.location.x
   */
  deck(selector: (item: MaterialItem<P, L>) => number = item => -item.location.x!) {
    return new MaterialDeck(this.type, this.items, this.processMove, this.entries).sort(selector)
  }

  /**
   * Return a new {@link MaterialMoney} helper class, to deal with moving money units easily.
   *
   * @param units The different units that exists in stock to count this money
   */
  money<Unit extends number>(units: Unit[]) {
    return new MaterialMoney(this.type, units, this.items, this.processMove, this.entries)
  }
}
