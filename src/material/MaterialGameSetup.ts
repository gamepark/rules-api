import { GameSetup } from '../GameSetup'
import { applyAutomaticMoves, hasRandomMove } from '../utils'
import { Material } from './items'
import { MaterialGame } from './MaterialGame'
import { MaterialRules, MaterialRulesCreator } from './MaterialRules'
import { GameMemory, PlayerMemory } from './memory'
import { MaterialMove, MaterialMoveBuilder } from './moves'

/**
 * Helper class to implement {@link GameSetup} when using the {@link MaterialRules} approach.
 */
export abstract class MaterialGameSetup<P extends number = number, M extends number = number, L extends number = number, Options = any>
  implements GameSetup<MaterialGame<P, M, L>, Options> {

  /**
   * The rules of the game
   */
  abstract Rules: MaterialRulesCreator<P, M, L>

  /**
   * The game setup state we are working on
   * @protected
   */
  protected game: MaterialGame<P, M, L> = { players: [], items: {}, memory: {} }

  /**
   * Get an instance of the rules of the game
   */
  get rules(): MaterialRules<P, M, L> {
    return new this.Rules(this.game)
  }

  /**
   * Entry point for {@link GameSetup}
   * @param options Options of the game
   */
  setup(options: Options): MaterialGame<P, M, L> {
    this.game = { players: getPlayerIds(options), items: {}, memory: {} }
    this.setupMaterial(options)
    this.start(options)
    return this.game
  }

  /**
   * @returns array of the player ids (shortcut for this.game.players)
   */
  get players(): P[] {
    return this.game.players
  }

  /**
   * Override this function if you need to set up some material before the game starts. Called by {@link setup}.
   * @param _options Options of the game
   */
  setupMaterial(_options: Options): void {
  }

  /**
   * Help function to execute a move immediately on the game state.
   * When the game is on, the moves should never be played directly: the framework takes care of playing the moves when necessary
   * (on te server, on the clients, during replays...).
   * However, during the setup, the moves must be played immediately in the game state to provide the initial game state to the framework.
   * This help function allows to easily play a {@link MaterialMove}, using the rules provided in {@link Rules}, including the consequences.
   *
   * @param move The MaterialMove to play
   * @protected
   */
  protected playMove(move: MaterialMove<P, M, L>) {
    if (hasRandomMove(this.rules)) {
      move = this.rules.randomize(move)
    }
    const consequences = this.rules.play(JSON.parse(JSON.stringify(move)))
    applyAutomaticMoves(this.rules, consequences)
  }

  /**
   * Helper function to manipulate the items of the game. See {@link Material}.
   * @param type The type of Material we want to work on
   * @returns a Material instance to manipulate all the material of that type in current game state.
   */
  material(type: M): Material<P, M, L> {
    if (!this.game.items[type]) this.game.items[type] = []
    const items = this.game.items[type]!
    return new Material(type, Array.from(items.entries()).filter(entry => entry[1].quantity !== 0), move => this.playMove(move))
  }

  /**
   * Utility function to access the memory tool for the game or on player.
   * this.game.memory can be used to store any data that is not available through the state of the material, or current rule.
   *
   * @param player Optional, identifier of the player if we want to manipulate a specific player's memory
   * @returns {@link GameMemory} or {@link PlayerMemory} utility
   * @protected
   */
  protected getMemory(player?: P): GameMemory<P> | PlayerMemory<P> {
    return player === undefined ? new GameMemory(this.game) : new PlayerMemory(this.game, player)
  }

  /**
   * Helper function to memorize some information that does not fit in an item or the rules state, in the game state
   * @param key Key under which the memory is store. Usually a value of a numeric enum named "Memory".
   * @param value Value to memorize
   * @param player optional, if we need to memorize a different value for each player.
   */
  memorize<T = any>(key: keyof any, value: T | ((lastValue: T) => T), player?: P): void {
    this.getMemory(player).memorize(key, value)
  }

  /**
   * Implement this function to provide the first rules step of the game (see {@link MaterialRules.rules}). Called by {@link setup}.
   * You can use {@link startPlayerTurn} or {@link startSimultaneousRule} for instance.
   * @param options Options of the game
   */
  abstract start(options: Options): void

  /**
   * Helper function to play a {@link StartPlayerTurn} move on the game setup state.
   * @param id Rule id to start
   * @param player Player that starts the game (default value: this.game.players[0])
   */
  startPlayerTurn<RuleId extends number = number>(id: RuleId, player: P = this.game.players[0]) {
    this.playMove(MaterialMoveBuilder.startPlayerTurn(id, player))
  }

  /**
   * Helper function to play a {@link StartSimultaneousRule} move on the game setup state.
   * @param id Rule id to start
   * @param players Players that are active (all the players by default)
   */
  startSimultaneousRule<RuleId extends number = number>(id: RuleId, players?: P[]) {
    this.playMove(MaterialMoveBuilder.startSimultaneousRule(id, players))
  }

  /**
   * Helper function to play a {@link StartRule} move on the game setup state.
   * @param id Rule id to start
   */
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
