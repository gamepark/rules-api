export type RuleStep<Player extends number = number, RuleId extends number = number> = {
  id: RuleId
  player?: Player
  players?: Player[]
}