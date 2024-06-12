import { GameSetup } from './GameSetup'

export interface GameSetupCreator<Game = any, Options = any> {
  new(): GameSetup<Game, Options>
}