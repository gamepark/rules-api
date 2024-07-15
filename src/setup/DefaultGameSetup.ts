import { RulesCreator } from '../RulesCreator'
import { GameSetup } from './GameSetup'

export class DefaultGameSetup<Game = any, Move = any, PlayerId = any, Options = any> implements GameSetup<Game, Options> {
  private readonly Rules: RulesCreator<Game, Move, PlayerId, Options>

  constructor(Rules: RulesCreator<Game, Move, PlayerId, Options>) {
    this.Rules = Rules
  }

  setup(options: Options): any {
    const rules = new this.Rules(options)
    return rules.game
  }
}