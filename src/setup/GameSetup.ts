export interface GameSetup<Game = any, Options = any> {
  setup(options: Options): Game
}

