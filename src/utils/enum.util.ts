/**
 * Generic type for typescript enum objects
 */
export type Enum<E> = Record<keyof E, number | string> & { [k: number]: string }

/**
 * Get the keys of an enum at run time.
 * Credits to https://github.com/tranvansang/enum-for
 *
 * @param enumType The enumeration
 * @returns returns the list of the keys of the enum
 */
export function getEnumKeys<E extends Enum<E>>(enumType: E): Array<keyof E> {
  return Object.keys(enumType).filter(key => isNaN(Number(key))) as Array<keyof E>
}

/**
 * Get the values of an enum at run time.
 * Credits to https://github.com/tranvansang/enum-for
 *
 * @param enumType The enumeration
 * @returns returns the list of the values of the enum
 */
export function getEnumValues<E extends Enum<E>>(enumType: E): Array<E[keyof E]> {
  return getEnumKeys(enumType).map(key => enumType[key])
}

/**
 * Get the entries of an enum at run time.
 * Credits to https://github.com/tranvansang/enum-for
 *
 * @param enumType The enumeration
 * @returns returns the list of the entries of the enum
 */
export function getEnumEntries<E extends Enum<E>>(enumType: E): Array<[keyof E, E[keyof E]]> {
  return getEnumKeys(enumType).map(key => [key, enumType[key]])
}

/**
 * @deprecated Use getEnumValues instead
 */
export function isEnumValue<T>(value: string | T): value is T {
  return typeof value !== 'string'
}
