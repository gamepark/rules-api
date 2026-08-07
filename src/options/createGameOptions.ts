import { OptionsSpecV2, OptionValue } from './OptionsSpecV2'
import {
  assignIdentities,
  assignTeams,
  OptionsIssue,
  OptionsSelection,
  ResolvedOptions,
  ResolvedOptionValue,
  resolveOptions
} from './OptionsSpecV2Runtime'
import { OptionsValidationError } from './OptionsValidationError'

/**
 * Builds the options a game receives, from its v2 spec alone.
 *
 * The v1 way was to pick a value at random, call the game's `validate`, and retry when it threw. Here
 * the declaration is closed, so `resolveOptions` searches it: no game code runs, no bundle is evaluated,
 * and an impossible selection comes back as the rule that forbids it rather than as an exception raised
 * inside a game.
 *
 * The shape handed to `setup` is the one games already read, down to `options.players` being the table
 * size when the game has no identity or team, and one entry per player otherwise.
 */

/** What a player holds: an identity, a team, or both. Same field names as v1's `players.id` / `players.team`. */
export type PlayerOptions = { id?: OptionValue; team?: OptionValue }

export type GameOptions = { [key: string]: ResolvedOptionValue | number | PlayerOptions[] | undefined }

/**
 * Per-player wishes, one entry per player, `null` meaning "no preference".
 *
 * Already reduced by the caller, because whether a preference counts at all is the caller's decision —
 * a platform has game modes and attribution strategies to weigh, a local game has neither — and the
 * spec says nothing about it.
 */
export type IdentityPreferences = { id?: (OptionValue | null)[]; team?: (OptionValue | null)[] }

/** `random` is injectable so a caller can make the search deterministic. */
export function createGameOptions(
  spec: OptionsSpecV2,
  selection: OptionsSelection,
  playerCount: number,
  preferences: IdentityPreferences = {},
  random?: () => number
): GameOptions {
  const { options, issues } = resolveOptions(spec, selection, playerCount, random ? { random } : {})
  if (issues.length) throw optionsError(issues)
  return { ...options, players: playerOptions(spec, playerCount, options, preferences) }
}

/**
 * `options.players`: the table size for a game with neither identities nor teams, one entry per player
 * otherwise — the exact shape every game's `setup` already reads.
 */
function playerOptions(spec: OptionsSpecV2, playerCount: number, resolved: ResolvedOptions, preferences: IdentityPreferences): number | PlayerOptions[] {
  if (!spec.identities && !spec.teams) return playerCount
  const players: PlayerOptions[] = [...Array(playerCount)].map(() => ({}))
  if (spec.identities) {
    // `resolved` matters: an identity can be gated by an option's value.
    const assignment = assignIdentities(spec, preferences.id ?? [], playerCount, resolved)!
    if (assignment.issues.length) throw optionsError(assignment.issues)
    assignment.identities.forEach((identity, index) => (players[index].id = identity))
  }
  if (spec.teams) {
    const assignment = assignTeams(spec, preferences.team ?? [], playerCount)
    if (assignment.issues.length) throw optionsError(assignment.issues)
    assignment.teams.forEach((team, index) => (players[index].team = team))
  }
  return players
}

/**
 * The first problem, as the error type every caller already handles.
 *
 * A cross rule carries its own i18n key and the options to highlight, which is exactly what
 * `OptionsValidationError` transports — so a game's own message survives the move off `validate`
 * untouched. Anything else throws the issue **code**: it is data a caller can branch on, where a
 * sentence would be presentation, and turning a code into wording is the reader's job, not ours.
 */
function optionsError(issues: OptionsIssue[]): OptionsValidationError {
  const issue = issues.find((candidate) => candidate.message) ?? issues[0]
  return new OptionsValidationError(issue.message ?? issue.code, issue.options)
}
