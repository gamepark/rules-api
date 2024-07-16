/**
 * Each game must provide the initial game state when a new game is created.
 * Create a class that implements this interface to provide it.
 * The constructor must not have any arguments (see {@link GameSetupCreator}).
 */
export interface GameSetup<Game = any, Options = any> {
  /**
   * Create a new game base on the options chosen by the players
   *
   * @param options Options of the game (see {@link OptionsSpec})
   * @returns the initial game state
   */
  setup(options: Options): Game
}

/**
 * Creator interface for {@link GameSetup}.
 */
export interface GameSetupCreator<Game = any, Options = any> {
  new(): GameSetup<Game, Options>
}
