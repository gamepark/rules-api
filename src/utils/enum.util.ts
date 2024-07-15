export function isEnumValue<T>(value: string | T): value is T {
  return typeof value !== 'string'
}