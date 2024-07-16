/**
 * @deprecated
 * When It's a Wonderful World was implemented, we wanted to be able to remove completely a player from the game:
 * if a players quit or is ejected, instead of being replaced by a random bot, he no longer plays, and we do not deal cards to him.
 * We had to know when a player was ejected, so this interface was created to provide a custom move automatically played when the player leaves.
 *
 * However, we could work out this feature without this extra interface, by doing this:
 * 1. allow a custom "Quit" move everytime necessary in the legal moves
 * 2. implement a custom {@link Bot} for the game that plays the "Quit" move by default if available
 *
 * Choose this solution instead of implementing the deprecated Eliminations interface if necessary.
 */
export interface Eliminations<Move = string, PlayerId = number> {
  isEliminated(playerId: PlayerId): boolean

  giveUpMove?(playerId: PlayerId): Move | undefined
}

/**
 * Type guard for {@link Eliminations} interface
 * @param rules Rules of a game
 * @returns true if the Rules implements {@link Eliminations}
 */
export function hasEliminations<Move, PlayerId>(rules: Object): rules is Eliminations<Move, PlayerId> {
  const test = rules as Eliminations<Move, PlayerId>
  return typeof test.isEliminated === 'function'
}