export interface Eliminations<Move = string, PlayerId = number> {
  isEliminated(playerId: PlayerId): boolean

  giveUpMove?(playerId: PlayerId): Move | undefined
}

export function hasEliminations<Move, PlayerId>(rules: Object): rules is Eliminations<Move, PlayerId> {
  const test = rules as Eliminations<Move, PlayerId>
  return typeof test.isEliminated === 'function'
}