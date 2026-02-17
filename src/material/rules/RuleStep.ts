/**
 * Common data structure for any step of the rules
 */
export type RuleStep<Player extends number = number, RuleId extends number = number> = {
  id: RuleId
  player?: Player
  players?: Player[]
  interleaving?: {
    players: Player[]
    availableIndexes: Record<number, number[]>
  }
}