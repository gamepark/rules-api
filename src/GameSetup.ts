export interface GameSetup<Game = any, Options = any> {
  setup(options: Options): Game
}

export interface GameSetupCreator<Game = any, Options = any> {
  new(): GameSetup<Game, Options>
}
