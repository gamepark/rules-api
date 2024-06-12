import { Rules } from './Rules'

export interface RandomMove<Move = any, RandomizedMove = any> {
  randomize(move: Move): Move & RandomizedMove

  play(move: Move & RandomizedMove): Move[]
}

export function hasRandomMove<Game, Move, RandomizedMove>(
  rules: Rules<Game, Move>
): rules is Rules<Game, Move> & RandomMove<Move, RandomizedMove> {
  const test = rules as Rules<Game, Move> & RandomMove<Move, RandomizedMove>
  return typeof test.randomize === "function"
}

export function randomizeMoves<Game, Move, RandomizedMove = Move>(
  rules: Rules<Game, Move>,
  moves: Move[]
) {
  return hasRandomMove<Game, Move, RandomizedMove>(rules)
    ? moves.map((move) => rules.randomize(move))
    : (moves as (Move & RandomizedMove)[])
}
