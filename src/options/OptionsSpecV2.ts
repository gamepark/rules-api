/**
 * Structural declaration of a game's option space — spec v2.
 *
 * A game exports one of these instead of an `OptionsSpec`, and two properties are
 * enforced by the shape below rather than left to convention:
 *
 * - **Plain JSON, no functions.** The platform snapshots the declaration in its
 *   database when the bundle is prepared, so every screen reads it from there
 *   instead of downloading and evaluating a game bundle to show three labels.
 * - **No human-readable text.** Labels, help and images belong to the game's own
 *   presentation document, published beside the translations it already serves:
 *   `https://<gameId>.game-park.com/options/<locale>.json`, keyed by convention —
 *   `option.<option>`, `option.<option>.<value>`, `identities.<value>`, and their
 *   `.help` variants. Subscription and competitive gates belong to the platform
 *   database. Only keys here.
 *
 * Replaces `OptionsSpec` and, with it, `validate`: a declaration the platform can
 * read is one it can search, so an impossible combination comes back as the rule
 * that forbids it instead of as an exception thrown from inside a game.
 */

/** Inclusive bounds. An absent bound is unbounded. */
export type OptionsRange = { min?: number, max?: number }

/** What an option can hold. Values are addressed by `optionValueKey`. */
export type OptionValue = string | number | boolean

/**
 * A term over another option: it holds when that option's value is one of
 * `values`. The same primitive expresses a positive dependency (`requires`) and a
 * forbidden one (`OptionsCrossRule.when`).
 */
export type OptionRequirement = { option: string, values: OptionValue[] }

export type OptionValueSpec = {
  value: OptionValue
  /** Table sizes at which this value exists at all. */
  playerCount?: OptionsRange
  /** Other options that must all hold one of the given values for this to exist. */
  requires?: OptionRequirement[]
}

/** A bare value is sugar for `{ value }` with every default. */
export type OptionValueDeclaration = OptionValue | OptionValueSpec

export type BooleanOptionSpec = {
  kind: 'boolean'
  playerCount?: OptionsRange
  requires?: OptionRequirement[]
  /** Defaults to `[false, true]`. Declared only to constrain a side. */
  values?: OptionValueDeclaration[]
}

export type EnumOptionSpec = {
  kind: 'enum'
  playerCount?: OptionsRange
  requires?: OptionRequirement[]
  values: OptionValueDeclaration[]
}

export type EnumSetOptionSpec = {
  kind: 'enum-set'
  playerCount?: OptionsRange
  requires?: OptionRequirement[]
  values: OptionValueDeclaration[]
  /** How many values are picked. A number is sugar for `{ min: n, max: n }`. */
  size: number | OptionsRange
}

export type OptionSpecV2 = BooleanOptionSpec | EnumOptionSpec | EnumSetOptionSpec

export type IdentityValue =
  | OptionValue
  | {
      value: OptionValue
      playerCount?: OptionsRange
      /** Other options that must all hold one of the given values for this identity to exist. */
      requires?: OptionRequirement[]
      /** Exactly one player must take it wherever it is available. */
      required?: boolean
    }

/** An identity is unique by construction: it is what links a user to a player. */
export type IdentitiesSpec = { values: IdentityValue[] }

/**
 * Teams are the only structural constraint on the table size itself: a table that
 * cannot be split into equal teams is not a legal table, so the platform derives
 * the legal player counts from `values.length × size` and assigns balanced teams.
 * Neither rule is a game's to restate.
 */
export type TeamsSpec = {
  values: OptionValue[]
  /** Players per team. Omitted: the table is split equally between the teams. */
  size?: number
}

/**
 * A combination of values the game refuses. All terms matching at once is what is
 * forbidden, so "at least one of three decks" reads as "not all three false".
 * `message` is an i18n key resolved in the game's namespace, never text.
 */
export type OptionsCrossRule = {
  type: 'forbidden-combination'
  when: OptionRequirement[]
  message: string
}

export type OptionsSpecV2 = {
  specVersion: 2
  /** Legal table sizes: the root every other range narrows. */
  players: { min: number, max: number }
  identities?: IdentitiesSpec
  teams?: TeamsSpec
  options?: { [key: string]: OptionSpecV2 }
  rules?: OptionsCrossRule[]
}

/** Stable address of a value, shared with the platform's option policy and the game's presentation document. */
export function optionValueKey(value: unknown): string {
  return String(value)
}

/** The value a declaration carries, whether it was written bare or as a spec. */
export function optionValueOf(value: OptionValueDeclaration | IdentityValue): OptionValue {
  return typeof value === 'object' ? value.value : value
}
