import { Location } from '../location'
import { MoveItem } from '../moves'
import { Material } from './Material'
import { MaterialItem } from './MaterialItem'

/**
 * This subclass of {@link Material} is design to solve one major issue: when creating moves, the material items remains unchanged (Material is immutable),
 * so you cannot easily deal cards to multiple players at once: you will deal the first X cards all the time if you try to move items multiple time one
 * the same Material instance.
 *
 * MaterialDeck is designed to mutate every time the {@link deal}, {@link dealOne} or {@link dealAtOnce} function are executed, allowing to deal cards
 * successively to the players, without having to remove the previously dealt card all the time.
 *
 * @example
 * In this example, we deal the first 5 cards to the player 1, then the next 5 cards to player 2.
 * Using "move" instead of "deal" would give the 5 same cards to both players,
 * so player 1 would get the cards for a very short time, then player 2 would receive them.
 * ```
 * const deck = this.material(MaterialType.Card).deck()
 * return [
 *   deck.deal({type: LocationType.PlayerHand, player: player1}, 5)
 *   deck.deal({type: LocationType.PlayerHand, player: player2}, 5)
 * ]
 * ```
 */
export class MaterialDeck<P extends number = number, M extends number = number, L extends number = number> extends Material<P, M, L> {
  /**
   * Prepare moves that will change the location of the first X items AND mutate this MaterialDeck instance to remove the items that will move.
   *
   * @param {Location | function} arg The new location of the item. It can be a function to process the location based on the item current state.
   * @param quantity The number of items to move
   * @returns {MoveItem[]} the move that will change the location of the item (or a part of its quantity) when executed
   */
  deal(arg: ((item: MaterialItem<P, L>) => Location<P, L>) | Location<P, L>, quantity: number = 1): MoveItem<P, M, L>[] {
    return this.new(this.entries.splice(0, quantity)).moveItems(arg)
  }

  /**
   * Prepare a move that will change the location of the first item AND mutate this MaterialDeck instance to remove this items
   *
   * @param {Location | function} arg The new location of the item. It can be a function to process the location based on the item current state.
   * @returns {MoveItem} the move that will change the location of the item (or a part of its quantity) when executed
   */
  dealOne(arg: ((item: MaterialItem<P, L>) => Location<P, L>) | Location<P, L>): MoveItem<P, M, L> {
    const deal = this.deal(arg)
    if (deal.length === 0) {
      throw new Error('You are trying to deal one card from an empty deck')
    }
    return deal[0]
  }

  dealAtOnce(arg: Location<P, L>, quantity: number = 1) {
    return this.new(this.entries.splice(0, quantity)).moveItemsAtOnce(arg)
  }
}