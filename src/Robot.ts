export type Robot<Game, Move = string, PlayerId = number> = (state: Game, playerId: PlayerId) => Promise<Move[]>
