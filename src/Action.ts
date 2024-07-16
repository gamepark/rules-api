export type Action<Move = any, PlayerId = any> = {
  id?: string
  playerId: PlayerId
  move: Move
  consequences: Move[]
}
