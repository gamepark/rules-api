export interface LocalMovePreview<Move = any> {
  previewMove(move: Move): boolean
}

export function hasLocalMovePreview<Move = any>(rules: Object): rules is LocalMovePreview<Move> {
  return typeof (rules as LocalMovePreview<Move>).previewMove === 'function'
}