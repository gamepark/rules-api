/**
 * The four operations anyone reading a v2 spec needs: enumerate, restrict, generate, locate.
 *
 * Lives here rather than in the platform because the platform is not the only reader: a game running
 * locally must resolve its options the same way, and two implementations of "what is a legal set of
 * options" would drift — the drift showing up as "it worked in local play".
 *
 * Everything here is a pure function of a stored spec: no bundle is evaluated, no
 * game code runs, no text is produced. That is the whole point of the snapshot —
 * these operations work for every game, whether the spec was authored by the game
 * or derived from its v1 declaration.
 *
 * Two shapes travel through this module and must not be confused:
 *
 * - a **selection**, what a form produces: a value, a set of acceptable values,
 *   an in/out map, or nothing at all ("surprise me").
 * - **resolved options**, what a game receives: exactly one value per available
 *   option, an array for `enum-set`.
 *
 * `resolveOptions` is the conversion, and it is a constraint walk rather than the
 * v1 retry loop: because the vocabulary is closed and
 * every domain finite, a combination that satisfies the declaration is found by
 * search, and its absence is a fact we can report instead of an exception thrown
 * from game code.
 */
import { generatePlayersOption, PlayerEnumOption } from './PlayerEnumOption'
import {
  EnumSetOptionSpec,
  OptionRequirement,
  OptionsRange,
  OptionSpecV2,
  OptionsSpecV2,
  OptionValue,
  OptionValueDeclaration,
  optionValueKey,
  OptionValueSpec
} from './OptionsSpecV2'

/** One resolved option: a single value, or the picked set for `enum-set`. */
export type ResolvedOptionValue = OptionValue | OptionValue[]

export type ResolvedOptions = { [key: string]: ResolvedOptionValue }

/**
 * What a form submits for one option:
 * - a value — fixed;
 * - an array — any of these, chosen by the platform (v1's "several values ticked");
 * - an in/out map keyed by `optionValueKey`, for `enum-set` only;
 * - `undefined` — no constraint at all.
 */
export type OptionSelection = OptionValue | OptionValue[] | { [valueKey: string]: 'in' | 'out' }

export type OptionsSelection = { [key: string]: OptionSelection | undefined }

export type OptionsIssueCode =
  | 'player-count'
  | 'option-missing'
  | 'option-unavailable'
  | 'illegal-value'
  | 'duplicate-value'
  /** A resolved set of the wrong length — a platform mistake, not a user one. */
  | 'enum-set-size'
  /** More values ticked than the option picks. */
  | 'enum-set-too-many'
  /** Too many values refused for the option to reach its size. */
  | 'enum-set-too-few'
  | 'unknown-option'
  | 'forbidden-combination'
  | 'no-valid-combination'
  | 'team-count'
  | 'identity-count'

/**
 * A located problem. `options` is the list of fields to highlight, which is what
 * `OptionsValidationError.fields` carried and what a cross rule's `when` already
 * spells out. `message` is set only when the spec supplies an i18n key.
 */
export type OptionsIssue = { code: OptionsIssueCode; options: string[]; value?: ResolvedOptionValue; message?: string }

type Random = () => number

/* ------------------------------------------------------------------ reading */

export function valueSpecOf(value: OptionValueDeclaration): OptionValueSpec {
  return typeof value === 'object' ? value : { value }
}

/** A boolean option declares values only to constrain a side; both exist otherwise. */
export function optionValueSpecs(option: OptionSpecV2): OptionValueSpec[] {
  if (option.kind === 'boolean') return (option.values ?? [false, true]).map(valueSpecOf)
  return option.values.map(valueSpecOf)
}

export function inRange(range: OptionsRange | undefined, count: number): boolean {
  if (!range) return true
  return (range.min === undefined || count >= range.min) && (range.max === undefined || count <= range.max)
}

export function sizeRange(size: number | OptionsRange): OptionsRange {
  return typeof size === 'number' ? { min: size, max: size } : size
}

/** Declared options in declaration order. */
export function listOptions(spec: OptionsSpecV2): { key: string; option: OptionSpecV2 }[] {
  return Object.entries(spec.options ?? {}).map(([key, option]) => ({ key, option }))
}

/**
 * A term holds when the option it names has been given one of its values.
 *
 * An option that is absent — not yet decided, or unavailable at this table size —
 * satisfies nothing. That is what makes evaluating a rule against a partial
 * assignment safe: it can reveal a real violation, never invent one.
 */
export function requirementHolds(requirement: OptionRequirement, resolved: ResolvedOptions): boolean {
  const value = resolved[requirement.option]
  if (value === undefined) return false
  if (Array.isArray(value)) return value.some((entry) => requirement.values.includes(entry))
  return requirement.values.includes(value)
}

export function requirementsHold(requirements: OptionRequirement[] | undefined, resolved: ResolvedOptions): boolean {
  return (requirements ?? []).every((requirement) => requirementHolds(requirement, resolved))
}

/** Does this option exist at all, at this table size and under this assignment? */
export function isOptionAvailable(option: OptionSpecV2, playerCount: number, resolved: ResolvedOptions): boolean {
  return inRange(option.playerCount, playerCount) && requirementsHold(option.requires, resolved)
}

/** The values this option may take. Both axes of §4 apply to values too. */
export function availableValues(option: OptionSpecV2, playerCount: number, resolved: ResolvedOptions): OptionValue[] {
  return optionValueSpecs(option)
    .filter((value) => inRange(value.playerCount, playerCount) && requirementsHold(value.requires, resolved))
    .map((value) => value.value)
}

/**
 * Table sizes the declaration allows: the game's own range, narrowed by teams.
 *
 * Teams are the only structural constraint on the table size itself — a table
 * that cannot be split into equal teams is not a legal table, which is the rule
 * kitsu and zenith both hand-write in `validate` today (§6).
 */
export function legalPlayerCounts(spec: OptionsSpecV2): number[] {
  const counts: number[] = []
  for (let count = spec.players.min; count <= spec.players.max; count++) {
    if (spec.teams && count % teamModulus(spec.teams.values.length, spec.teams.size) !== 0) continue
    counts.push(count)
  }
  return counts
}

function teamModulus(teamCount: number, size?: number): number {
  return teamCount * (size ?? 1)
}

/* ---------------------------------------------------------------- ordering */

/**
 * Options ordered so that each one comes after everything it depends on.
 *
 * The `requires` graph is a dependency graph, so its topological order is also
 * the natural order to *ask* the questions in — a presentation layer that
 * declares no order gets a sensible one for free (§4). A cycle cannot occur in a
 * spec that passed `validateOptionsSpec`; if one does, the remaining options keep
 * their declaration order rather than hanging the walk.
 */
export function optionOrder(spec: OptionsSpecV2): string[] {
  const keys = listOptions(spec).map(({ key }) => key)
  const known = new Set(keys)
  const dependencies = new Map<string, Set<string>>()
  for (const { key, option } of listOptions(spec)) {
    const dependsOn = new Set<string>()
    for (const requirement of option.requires ?? []) if (known.has(requirement.option)) dependsOn.add(requirement.option)
    for (const value of optionValueSpecs(option)) {
      for (const requirement of value.requires ?? []) if (known.has(requirement.option)) dependsOn.add(requirement.option)
    }
    dependsOn.delete(key)
    dependencies.set(key, dependsOn)
  }

  const ordered: string[] = []
  const placed = new Set<string>()
  let progressed = true
  while (progressed && ordered.length < keys.length) {
    progressed = false
    for (const key of keys) {
      if (placed.has(key)) continue
      const dependsOn = dependencies.get(key)!
      if ([...dependsOn].every((dependency) => placed.has(dependency))) {
        ordered.push(key)
        placed.add(key)
        progressed = true
      }
    }
  }
  for (const key of keys) if (!placed.has(key)) ordered.push(key)
  return ordered
}

/* ---------------------------------------------------------------- validate */

/**
 * Every way a resolved options object can disagree with the declaration, located
 * on the options responsible.
 *
 * Returning a list rather than throwing on the first problem is the point: a form
 * highlights all the offending fields at once, which `OptionsValidationError`
 * could not support (§9.4).
 */
export function validateOptions(spec: OptionsSpecV2, resolved: ResolvedOptions, playerCount: number): OptionsIssue[] {
  const issues: OptionsIssue[] = []
  if (!legalPlayerCounts(spec).includes(playerCount)) issues.push({ code: 'player-count', options: [] })

  for (const { key, option } of listOptions(spec)) {
    const value = resolved[key]
    if (!isOptionAvailable(option, playerCount, resolved)) {
      if (value !== undefined) issues.push({ code: 'option-unavailable', options: [key], value })
      continue
    }
    if (value === undefined) {
      issues.push({ code: 'option-missing', options: [key] })
      continue
    }
    const legal = availableValues(option, playerCount, resolved)
    if (option.kind === 'enum-set') {
      issues.push(...validateSet(key, option, value, legal))
    } else if (Array.isArray(value) || !legal.includes(value)) {
      issues.push({ code: 'illegal-value', options: [key], value })
    }
  }

  const declared = new Set(listOptions(spec).map(({ key }) => key))
  for (const key of Object.keys(resolved)) if (!declared.has(key)) issues.push({ code: 'unknown-option', options: [key], value: resolved[key] })

  issues.push(...violatedRules(spec, resolved))
  return issues
}

function validateSet(key: string, option: EnumSetOptionSpec, value: ResolvedOptionValue, legal: OptionValue[]): OptionsIssue[] {
  if (!Array.isArray(value)) return [{ code: 'illegal-value', options: [key], value }]
  const issues: OptionsIssue[] = []
  const size = sizeRange(option.size)
  if (!inRange(size, value.length)) issues.push({ code: 'enum-set-size', options: [key], value })
  if (new Set(value.map(optionValueKey)).size !== value.length) issues.push({ code: 'duplicate-value', options: [key], value })
  for (const entry of value) if (!legal.includes(entry)) issues.push({ code: 'illegal-value', options: [key], value: entry })
  return issues
}

/**
 * Cross rules broken by this assignment. Safe on a partial one: a term over an
 * option with no value yet never holds, so a rule is reported only once every
 * option it names has been decided.
 */
export function violatedRules(spec: OptionsSpecV2, resolved: ResolvedOptions): OptionsIssue[] {
  return (spec.rules ?? [])
    .filter((rule) => rule.when.length > 0 && rule.when.every((term) => requirementHolds(term, resolved)))
    .map((rule) => ({ code: 'forbidden-combination' as const, options: rule.when.map((term) => term.option), message: rule.message }))
}

/* ----------------------------------------------------------------- resolve */

export type ResolveResult = { options: ResolvedOptions; issues: OptionsIssue[] }

/**
 * Turns a selection into one valid resolved options object, or explains why none
 * exists.
 *
 * The search assigns options in dependency order and backtracks: a value that
 * looked fine can be refused by a cross rule involving an option not yet decided,
 * and a game must not be created on a combination it declares illegal. Domains
 * hold a handful of values and specs a handful of options, so exhaustive search
 * costs nothing — and unlike the v1 retry loop it terminates with an answer
 * either way, instead of eventually rethrowing whatever the game complained
 * about last.
 */
export function resolveOptions(
  spec: OptionsSpecV2,
  selection: OptionsSelection,
  playerCount: number,
  { random = Math.random }: { random?: Random } = {}
): ResolveResult {
  const order = optionOrder(spec)
  const options = spec.options ?? {}

  const walk = (index: number, resolved: ResolvedOptions): ResolvedOptions | null => {
    if (index === order.length) return resolved
    const key = order[index]
    const option = options[key]
    // An unavailable option is not a failure: it is a question that is not asked
    // at this table size or under this selection, and it gets no value at all.
    if (!isOptionAvailable(option, playerCount, resolved)) return walk(index + 1, resolved)
    for (const candidate of candidateValues(option, selection[key], playerCount, resolved, random)) {
      const next = { ...resolved, [key]: candidate }
      if (violatedRules(spec, next).length) continue
      const done = walk(index + 1, next)
      if (done) return done
    }
    return null
  }

  const resolved = walk(0, {})
  if (resolved) return { options: resolved, issues: [] }
  return { options: {}, issues: diagnose(spec, selection, playerCount) }
}

/**
 * Why no combination exists, stated on the user's own input.
 *
 * The walk knows only that it ran out of candidates, which is useless in a form.
 * So the failure is explained by validating what the selection actually fixes —
 * two forced values that a cross rule forbids come back as that rule, with its
 * message and the fields to highlight.
 */
function diagnose(spec: OptionsSpecV2, selection: OptionsSelection, playerCount: number): OptionsIssue[] {
  const fixed: ResolvedOptions = {}
  const issues: OptionsIssue[] = []
  for (const { key, option } of listOptions(spec)) {
    const chosen = selection[key]
    if (chosen === undefined) continue
    if (option.kind === 'enum-set') {
      issues.push(...diagnoseSet(key, option, chosen, playerCount, fixed))
    } else if (typeof chosen !== 'object') {
      // A single value is the only part of a selection that is already decided:
      // an array still leaves the platform a choice, so it cannot be the culprit.
      fixed[key] = chosen
    }
  }
  // Only what the selection pins down is validated: an option left free cannot be
  // the reason nothing works, and reporting it as missing would bury the cause.
  issues.push(...validateOptions(spec, fixed, playerCount).filter((issue) => issue.code !== 'option-missing'))
  // Always say something: an empty domain can come from a value range rather than
  // from anything the selection states, and silence would read as success.
  return issues.length ? issues : [{ code: 'no-valid-combination', options: [] }]
}

/**
 * What is wrong with an in/out map, and what of it can be treated as decided.
 *
 * Both directions are user mistakes and both are named, because the two messages
 * already exist and say different things: too many values ticked, or too many
 * refused to reach the size. The set is handed to the cross-rule check only when
 * it is complete enough to be a real value.
 */
function diagnoseSet(key: string, option: EnumSetOptionSpec, chosen: OptionSelection, playerCount: number, fixed: ResolvedOptions): OptionsIssue[] {
  const issues: OptionsIssue[] = []
  const states = typeof chosen === 'object' && !Array.isArray(chosen) ? chosen : {}
  const wanted = Object.entries(states)
    .filter(([, state]) => state === 'in')
    .map(([valueKey]) => valueKey)
  const available = availableValues(option, playerCount, fixed)
  const availableKeys = new Set(available.map(optionValueKey))
  for (const valueKey of wanted) if (!availableKeys.has(valueKey)) issues.push({ code: 'illegal-value', options: [key], value: valueKey })
  const size = sizeRange(option.size)
  const reachable = available.filter((value) => states[optionValueKey(value)] !== 'out').length
  if (size.max !== undefined && wanted.length > size.max) issues.push({ code: 'enum-set-too-many', options: [key] })
  else if (reachable < (size.min ?? 0)) issues.push({ code: 'enum-set-too-few', options: [key] })
  const values = available.filter((value) => wanted.includes(optionValueKey(value)))
  if (inRange(size, values.length)) fixed[key] = values
  return issues
}

/**
 * The values an option may take, filtered by the selection and shuffled.
 *
 * Shuffling is what makes "no preference" mean random, and it is done here rather
 * than by the caller so that backtracking explores alternatives in a random order
 * too — otherwise a conflict would always be resolved in favour of the same value.
 */
function candidateValues(option: OptionSpecV2, selection: OptionSelection | undefined, playerCount: number, resolved: ResolvedOptions, random: Random) {
  const available = availableValues(option, playerCount, resolved)
  if (option.kind === 'enum-set') return shuffle(candidateSets(option, selection, available, random), random)
  if (selection === undefined) return shuffle(available, random)
  const accepted = Array.isArray(selection) ? selection : [selection]
  return shuffle(
    available.filter((value) => accepted.includes(value)),
    random
  )
}

/** Guard against a combinatorial explosion no real spec produces (§10 caps `size`). */
const MAX_CANDIDATE_SETS = 2000

/**
 * Subsets of the available values that honour the in/out map and the declared
 * size. `in` values must all appear, `out` values never do; the rest is free.
 */
function candidateSets(option: EnumSetOptionSpec, selection: OptionSelection | undefined, available: OptionValue[], random: Random): OptionValue[][] {
  const states = selection && !Array.isArray(selection) && typeof selection === 'object' ? (selection as Record<string, 'in' | 'out'>) : {}
  const stateOf = (value: OptionValue) => states[optionValueKey(value)]
  const included = available.filter((value) => stateOf(value) === 'in')
  const free = available.filter((value) => stateOf(value) === undefined)
  // An 'in' value the option no longer offers is a contradiction, not a hint: the
  // set would silently come back one value short.
  const includedKeys = new Set(included.map(optionValueKey))
  for (const [key, state] of Object.entries(states)) if (state === 'in' && !includedKeys.has(key)) return []

  const size = sizeRange(option.size)
  const min = Math.max(size.min ?? 0, included.length)
  const max = Math.min(size.max ?? available.length, included.length + free.length)
  const sets: OptionValue[][] = []
  for (let length = min; length <= max; length++) {
    for (const extra of combinations(free, length - included.length, random)) {
      sets.push([...included, ...extra])
      if (sets.length >= MAX_CANDIDATE_SETS) return sets
    }
  }
  return sets
}

/**
 * Subsets of exactly `size` values, in a random order so that taking the first
 * one is an unbiased pick.
 *
 * Past the cap it stops enumerating and draws random subsets instead: the search
 * loses completeness there, which no catalogue spec reaches, and keeping the walk
 * bounded matters more than proving the impossible case impossible.
 */
function combinations(values: OptionValue[], size: number, random: Random): OptionValue[][] {
  if (size < 0 || size > values.length) return []
  if (size === 0) return [[]]
  if (binomial(values.length, size) > MAX_CANDIDATE_SETS) {
    return [...Array(MAX_CANDIDATE_SETS)].map(() => shuffle(values, random).slice(0, size))
  }
  const [first, ...rest] = shuffle(values, random)
  return [...combinations(rest, size - 1, random).map((combination) => [first, ...combination]), ...combinations(rest, size, random)]
}

function binomial(n: number, k: number): number {
  let result = 1
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i
  return Math.round(result)
}

function shuffle<T>(items: T[], random: Random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/* ------------------------------------------------------- identities & teams */

/**
 * Identities that exist at this table size, under this assignment.
 *
 * Same two axes as an option value (§4), and the same reason a form needs it as
 * `availableValues`: offering an identity the assignment would then refuse is a
 * choice the player cannot act on.
 */
export function availableIdentities(spec: OptionsSpecV2, playerCount: number, resolved: ResolvedOptions = {}): OptionValue[] {
  return (spec.identities?.values ?? [])
    .map((value) => (typeof value === 'object' ? value : { value }))
    .filter((value) => inRange(value.playerCount, playerCount) && requirementsHold(value.requires, resolved))
    .map((value) => value.value)
}

/**
 * One identity per player, honouring per-player preferences.
 *
 * The attribution algorithm is `generatePlayersOption`, unchanged — conflict
 * resolution between two players wanting the same identity, and the "different
 * values if possible" fill, are platform behaviour that v2 does not restate (§5).
 * Only its input changes: two callbacks become the two declared axes, `playerCount`
 * (does this identity exist here) and `required` (must someone hold it), which
 * brigands needs kept apart.
 */
export function assignIdentities(
  spec: OptionsSpecV2,
  preferences: (OptionValue | null)[],
  playerCount: number,
  resolved: ResolvedOptions = {}
): { identities: OptionValue[]; issues: OptionsIssue[] } | null {
  if (!spec.identities) return null
  const values = spec.identities.values.map((value) => (typeof value === 'object' ? value : { value }))
  const available = availableIdentities(spec, playerCount, resolved)
  const availableSet = new Set(available.map(optionValueKey))
  const mandatory = values.filter((value) => value.required && availableSet.has(optionValueKey(value.value))).map((value) => value.value)
  const unavailable = values.map((value) => value.value).filter((value) => !availableSet.has(optionValueKey(value)))

  // v1 fills a table larger than its identity list by starting the list over, so
  // two players end up holding the same identity — the one thing an identity may
  // never be. Refuse instead: `validateOptionsSpec` reports it at bundle
  // preparation, and by the time a game is created it is too late to be silent.
  if (available.length < playerCount) {
    return { identities: [], issues: [{ code: 'identity-count', options: [], value: available.length }] }
  }
  if (mandatory.length > playerCount) {
    return { identities: [], issues: [{ code: 'identity-count', options: [], value: mandatory.length }] }
  }

  const choices: (OptionValue | null)[] = [...Array(playerCount)].map((_, index) => preferences[index] ?? null)
  const option: PlayerEnumOption<OptionValue> = {
    // v1 shape, filled with what the algorithm actually reads: the text side is
    // the presentation layer's business and never reaches this code path.
    label: () => '',
    valueSpec: () => ({ label: () => '' }),
    values: available,
    mandatory: () => mandatory,
    unavailable: () => unavailable
  }
  return { identities: generatePlayersOption(choices, option), issues: [] }
}

/**
 * One team per player, balanced.
 *
 * Balance is a platform guarantee under v2, not a rule each game restates: both
 * games using teams today throw from `validate` when the table is uneven. A table
 * size that cannot be split is rejected before we get here (`legalPlayerCounts`),
 * so the only remaining freedom is which player goes where — preferences first,
 * then the emptiest team.
 */
export function assignTeams(spec: OptionsSpecV2, preferences: (OptionValue | null)[], playerCount: number): { teams: OptionValue[]; issues: OptionsIssue[] } {
  if (!spec.teams) return { teams: [], issues: [] }
  const { values, size } = spec.teams
  const perTeam = size ?? playerCount / values.length
  if (!Number.isInteger(perTeam) || perTeam * values.length !== playerCount) {
    return { teams: [], issues: [{ code: 'team-count', options: [] }] }
  }

  const counts = new Map(values.map((team) => [optionValueKey(team), 0]))
  const teams: (OptionValue | null)[] = [...Array(playerCount)].map(() => null)
  for (let index = 0; index < playerCount; index++) {
    const wanted = preferences[index]
    if (wanted === null || wanted === undefined) continue
    const key = optionValueKey(wanted)
    if (!counts.has(key) || counts.get(key)! >= perTeam) continue
    teams[index] = values.find((team) => optionValueKey(team) === key)!
    counts.set(key, counts.get(key)! + 1)
  }
  for (let index = 0; index < playerCount; index++) {
    if (teams[index] !== null) continue
    const team = values.reduce((emptiest, candidate) => (counts.get(optionValueKey(candidate))! < counts.get(optionValueKey(emptiest))! ? candidate : emptiest))
    teams[index] = team
    counts.set(optionValueKey(team), counts.get(optionValueKey(team))! + 1)
  }
  return { teams: teams as OptionValue[], issues: [] }
}
