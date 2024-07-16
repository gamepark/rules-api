import { GameSetup } from '../GameSetup'
import { hasRandomMove } from '../RandomMove'
import { applyAutomaticMoves } from '../utils'
import { Material } from './items'
import { MaterialGame } from './MaterialGame'
import { MaterialRules, MaterialRulesCreator } from './MaterialRules'
import { GameMemory, PlayerMemory } from './memory'
import { MaterialMove } from './moves'
import { MaterialMoveBuilder } from './rules'

export abstract class MaterialGameSetup<P extends number = number, M extends number = number, L extends number = number, Options = any>
  implements GameSetup<MaterialGame<P, M, L>, Options> {

  abstract Rules: MaterialRulesCreator<P, M, L>

  protected game: MaterialGame<P, M, L> = { players: [], items: {}, memory: {} }

  get rules(): MaterialRules<P, M, L> {
    return new this.Rules(this.game)
  }

  setup(options: Options): MaterialGame<P, M, L> {
    this.game = { players: getPlayerIds(options), items: {}, memory: {} }
    this.setupMaterial(options)
    this.start(options)
    return this.game
  }

  get players(): P[] {
    return this.game.players
  }

  setupMaterial(_options: Options): void {
  }

  protected playMove(move: MaterialMove<P, M, L>) {
    if (hasRandomMove(this.rules)) {
      move = this.rules.randomize(move)
    }
    const consequences = this.rules.play(JSON.parse(JSON.stringify(move)))
    applyAutomaticMoves(this.rules, consequences)
  }

  material(type: M): Material<P, M, L> {
    if (!this.game.items[type]) this.game.items[type] = []
    const items = this.game.items[type]!
    return new Material(type, Array.from(items.entries()).filter(entry => entry[1].quantity !== 0), move => this.playMove(move))
  }

  protected getMemory(player?: P) {
    return player === undefined ? new GameMemory(this.game) : new PlayerMemory(this.game, player)
  }

  memorize<T = any>(key: keyof any, value: T | ((lastValue: T) => T), player?: P): void {
    this.getMemory(player).memorize(key, value)
  }

  abstract start(options: Options): void

  startPlayerTurn<RuleId extends number = number>(id: RuleId, player: P) {
    this.playMove(MaterialMoveBuilder.startPlayerTurn(id, player))
  }

  startSimultaneousRule<RuleId extends number = number>(id: RuleId, players?: P[]) {
    this.playMove(MaterialMoveBuilder.startSimultaneousRule(id, players))
  }

  startRule<RuleId extends number = number>(id: RuleId) {
    this.playMove(MaterialMoveBuilder.startRule(id))
  }
}

function getPlayerIds<Player extends number = number>(options: any): Player[] {
  if (Array.isArray(options.players)) {
    return options.players.map((player: any, index: number) => player.id ?? index + 1)
  } else {
    const numberOfPlayers = options.players ?? 2
    return Array.from(Array(numberOfPlayers).keys()).map(index => (index + 1) as Player)
  }
}
