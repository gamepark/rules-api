/**
 * Minimal structural type for a translation function, compatible with i18next's `TFunction`.
 * Declared locally so this library does not depend on i18next.
 */
export type TFunction = (key: string | string[], options?: Record<string, any>) => string
