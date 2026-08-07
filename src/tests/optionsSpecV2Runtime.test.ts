import { assignIdentities, assignTeams, availableValues, isOptionAvailable, legalPlayerCounts, optionOrder, OptionsSelection, OptionsSpecV2, optionValueSpecs, resolveOptions, validateOptions } from '../options'
import { describe, expect, test } from 'vitest'

/**
 * The specs below are the v2 form of rules real games used to hand-write in `validate` — Captain Flip's
 * forbidden map/board pair, It's a Wonderful World's empire sides, Kitsu's teams. Testing against those
 * rather than invented shapes is what makes these tests say something: each one is a constraint a game
 * used to enforce with code, and the point of v2 is that it is now declared and enforced here.
 */

const spec = (partial: Partial<OptionsSpecV2>): OptionsSpecV2 => ({ specVersion: 2, players: { min: 2, max: 4 }, ...partial })

/** Deterministic sequence, so a failure is reproducible rather than a flake. */
function seeded(seed = 1): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648
    return state / 2147483648
  }
}

/** Resolve many times: the interesting claim is that *every* draw is legal. */
function resolveMany(target: OptionsSpecV2, selection: OptionsSelection, playerCount: number, draws = 40) {
  const random = seeded()
  return [...Array(draws)].map(() => resolveOptions(target, selection, playerCount, { random }))
}

describe('reading a spec', () => {
  test('a boolean option offers both values unless it says otherwise', () => {
    expect(optionValueSpecs({ kind: 'boolean' })).toEqual([{ value: false }, { value: true }])
    expect(optionValueSpecs({ kind: 'boolean', values: [{ value: false, playerCount: { max: 5 } }, true] })).toEqual([
      { value: false, playerCount: { max: 5 } },
      { value: true }
    ])
  })

  test('an option exists only inside its player-count range', () => {
    const option = { kind: 'enum' as const, playerCount: { min: 3 }, values: [1, 2] }
    expect(isOptionAvailable(option, 2, {})).toBe(false)
    expect(isOptionAvailable(option, 3, {})).toBe(true)
  })

  test('an option exists only while its requirements hold', () => {
    const option = { kind: 'boolean' as const, requires: [{ option: 'expansion', values: [true] }] }
    expect(isOptionAvailable(option, 2, {})).toBe(false)
    expect(isOptionAvailable(option, 2, { expansion: false })).toBe(false)
    expect(isOptionAvailable(option, 2, { expansion: true })).toBe(true)
  })

  test('a value can disappear on its own, without taking the option with it', () => {
    const option = { kind: 'enum' as const, values: [1, { value: 2, playerCount: { min: 4 } }, 3] }
    expect(availableValues(option, 2, {})).toEqual([1, 3])
    expect(availableValues(option, 4, {})).toEqual([1, 2, 3])
  })

  test('a term over an option with no value never holds', () => {
    const option = { kind: 'enum' as const, values: [{ value: 1, requires: [{ option: 'mode', values: ['coop'] }] }, 2] }
    expect(availableValues(option, 2, {})).toEqual([2])
    expect(availableValues(option, 2, { mode: 'coop' })).toEqual([1, 2])
  })

  test('a set option is matched by any of its values', () => {
    const option = { kind: 'boolean' as const, requires: [{ option: 'gods', values: ['zeus'] }] }
    expect(isOptionAvailable(option, 2, { gods: ['odin', 'ra'] })).toBe(false)
    expect(isOptionAvailable(option, 2, { gods: ['odin', 'zeus'] })).toBe(true)
  })
})

describe('legal table sizes', () => {
  test('are the game range when nothing narrows it', () => {
    expect(legalPlayerCounts(spec({ players: { min: 1, max: 4 } }))).toEqual([1, 2, 3, 4])
  })

  // zenith: 2 teams, 2 or 4 players — today thrown from `validate`.
  test('drop the sizes that cannot be split into equal teams', () => {
    expect(legalPlayerCounts(spec({ players: { min: 2, max: 5 }, teams: { values: ['red', 'blue'] } }))).toEqual([2, 4])
  })

  // kitsu: teams of two.
  test('honour a declared team size', () => {
    expect(legalPlayerCounts(spec({ players: { min: 2, max: 8 }, teams: { values: ['red', 'blue'], size: 2 } }))).toEqual([4, 8])
  })
})

describe('option order', () => {
  test('puts an option after everything it depends on', () => {
    const target = spec({
      options: {
        variant: { kind: 'boolean', requires: [{ option: 'expansion', values: [true] }] },
        expansion: { kind: 'boolean' },
        map: { kind: 'enum', values: [{ value: 1, requires: [{ option: 'variant', values: [true] }] }, 2] }
      }
    })
    expect(optionOrder(target)).toEqual(['expansion', 'variant', 'map'])
  })

  test('falls back to declaration order rather than hanging on a cycle', () => {
    const target = spec({
      options: {
        a: { kind: 'boolean', requires: [{ option: 'b', values: [true] }] },
        b: { kind: 'boolean', requires: [{ option: 'a', values: [true] }] }
      }
    })
    expect(optionOrder(target)).toEqual(['a', 'b'])
  })
})

describe('validating resolved options', () => {
  const target = spec({
    options: {
      beginner: { kind: 'boolean' },
      board: { kind: 'enum', values: ['S', 'M', { value: 'L', playerCount: { min: 4 } }] },
      gods: { kind: 'enum-set', values: ['zeus', 'odin', 'ra', 'thor'], size: 2 }
    },
    rules: [
      {
        type: 'forbidden-combination',
        when: [
          { option: 'beginner', values: [true] },
          { option: 'board', values: ['S'] }
        ],
        message: 'no-small-beginner'
      }
    ]
  })

  const valid = { beginner: false, board: 'M', gods: ['zeus', 'odin'] }

  test('accepts a legal combination', () => {
    expect(validateOptions(target, valid, 2)).toEqual([])
  })

  test('reports an option with no value', () => {
    expect(validateOptions(target, { board: 'M', gods: ['zeus', 'odin'] }, 2)).toEqual([{ code: 'option-missing', options: ['beginner'] }])
  })

  test('reports a value the table size does not offer', () => {
    expect(validateOptions(target, { ...valid, board: 'L' }, 2)).toEqual([{ code: 'illegal-value', options: ['board'], value: 'L' }])
    expect(validateOptions(target, { ...valid, board: 'L' }, 4)).toEqual([])
  })

  test('reports a set of the wrong size, and a repeated value', () => {
    expect(validateOptions(target, { ...valid, gods: ['zeus'] }, 2)).toEqual([{ code: 'enum-set-size', options: ['gods'], value: ['zeus'] }])
    expect(validateOptions(target, { ...valid, gods: ['zeus', 'zeus'] }, 2)).toEqual([{ code: 'duplicate-value', options: ['gods'], value: ['zeus', 'zeus'] }])
  })

  test('reports a value that is not declared at all', () => {
    expect(validateOptions(target, { ...valid, board: 'XL' }, 2)).toEqual([{ code: 'illegal-value', options: ['board'], value: 'XL' }])
  })

  test('reports an option the spec never declared', () => {
    expect(validateOptions(target, { ...valid, legacy: true }, 2)).toEqual([{ code: 'unknown-option', options: ['legacy'], value: true }])
  })

  test('reports a value carried by an option that does not exist here', () => {
    const conditional = spec({ options: { solo: { kind: 'boolean', playerCount: { max: 1 } } } })
    expect(validateOptions(conditional, { solo: true }, 2)).toEqual([{ code: 'option-unavailable', options: ['solo'], value: true }])
  })

  test('reports a forbidden combination with its message and its fields', () => {
    expect(validateOptions(target, { ...valid, beginner: true, board: 'S' }, 2)).toEqual([
      { code: 'forbidden-combination', options: ['beginner', 'board'], message: 'no-small-beginner' }
    ])
  })

  test('reports an impossible table size', () => {
    expect(validateOptions(target, valid, 7).map((issue) => issue.code)).toContain('player-count')
  })

  test('reports every problem at once, rather than the first', () => {
    const issues = validateOptions(target, { beginner: true, board: 'S', gods: ['zeus'] }, 2)
    expect(issues.map((issue) => issue.code)).toEqual(['enum-set-size', 'forbidden-combination'])
  })
})

describe('resolving a selection', () => {
  test('honours a fixed value', () => {
    const target = spec({ options: { board: { kind: 'enum', values: ['S', 'M', 'L'] } } })
    for (const { options, issues } of resolveMany(target, { board: 'M' }, 2)) {
      expect(issues).toEqual([])
      expect(options.board).toBe('M')
    }
  })

  test('picks inside the offered subset when several values are acceptable', () => {
    const target = spec({ options: { board: { kind: 'enum', values: ['S', 'M', 'L'] } } })
    const picked = new Set(resolveMany(target, { board: ['S', 'L'] }, 2).map(({ options }) => options.board))
    expect(picked).toEqual(new Set(['S', 'L']))
  })

  test('an empty selection means any legal value', () => {
    const target = spec({ options: { beginner: { kind: 'boolean' } } })
    const picked = new Set(resolveMany(target, {}, 2).map(({ options }) => options.beginner))
    expect(picked).toEqual(new Set([false, true]))
  })

  test('never returns a value the table size forbids', () => {
    const target = spec({ options: { board: { kind: 'enum', values: ['S', 'M', { value: 'L', playerCount: { min: 4 } }] } } })
    for (const { options, issues } of resolveMany(target, {}, 2)) {
      expect(issues).toEqual([])
      expect(options.board).not.toBe('L')
    }
  })

  test('leaves out an option whose requirement is not met, instead of inventing a value', () => {
    const target = spec({
      options: { expansion: { kind: 'boolean' }, expansionMode: { kind: 'enum', values: [1, 2], requires: [{ option: 'expansion', values: [true] }] } }
    })
    for (const { options, issues } of resolveMany(target, { expansion: false }, 2)) {
      expect(issues).toEqual([])
      expect(options).toEqual({ expansion: false })
    }
    for (const { options } of resolveMany(target, { expansion: true }, 2)) {
      expect(options.expansionMode).toBeDefined()
    }
  })

  // faraway: `validate` throws when 6 players play without the first expansion.
  test('faraway — six players force the expansion, because false does not exist there', () => {
    const faraway = spec({
      players: { min: 2, max: 6 },
      options: { expansion1: { kind: 'boolean', values: [{ value: false, playerCount: { max: 5 } }, true] }, starrySkies: { kind: 'boolean' } }
    })
    for (const { options, issues } of resolveMany(faraway, {}, 6)) {
      expect(issues).toEqual([])
      expect(options.expansion1).toBe(true)
    }
    const atFive = new Set(resolveMany(faraway, {}, 5).map(({ options }) => options.expansion1))
    expect(atFive).toEqual(new Set([false, true]))
  })

  // solstis: `validate` throws on beginner + firefly.
  test('solstis — a forced beginner mode pushes the firefly out', () => {
    const solstis = spec({
      players: { min: 2, max: 2 },
      options: { beginner: { kind: 'boolean' }, firefly: { kind: 'boolean' } },
      rules: [
        {
          type: 'forbidden-combination',
          when: [
            { option: 'beginner', values: [true] },
            { option: 'firefly', values: [true] }
          ],
          message: 'firefly-no-beginner'
        }
      ]
    })
    for (const { options, issues } of resolveMany(solstis, { beginner: true }, 2)) {
      expect(issues).toEqual([])
      expect(options).toEqual({ beginner: true, firefly: false })
    }
  })

  test('solstis — asking for both comes back as the rule, not as a thrown error', () => {
    const solstis = spec({
      players: { min: 2, max: 2 },
      options: { beginner: { kind: 'boolean' }, firefly: { kind: 'boolean' } },
      rules: [
        {
          type: 'forbidden-combination',
          when: [
            { option: 'beginner', values: [true] },
            { option: 'firefly', values: [true] }
          ],
          message: 'firefly-no-beginner'
        }
      ]
    })
    const { options, issues } = resolveOptions(solstis, { beginner: true, firefly: true }, 2, { random: seeded() })
    expect(options).toEqual({})
    expect(issues).toEqual([{ code: 'forbidden-combination', options: ['beginner', 'firefly'], message: 'firefly-no-beginner' }])
  })

  // a-feast-for-odin: `validate` requires at least one occupation deck.
  test('a-feast-for-odin — "at least one deck" holds on every draw', () => {
    const odin = spec({
      options: { deckA: { kind: 'boolean' }, deckB: { kind: 'boolean' }, deckC: { kind: 'boolean' } },
      rules: [
        {
          type: 'forbidden-combination',
          when: [
            { option: 'deckA', values: [false] },
            { option: 'deckB', values: [false] },
            { option: 'deckC', values: [false] }
          ],
          message: 'deck.required'
        }
      ]
    })
    const results = resolveMany(odin, {}, 2)
    for (const { options, issues } of results) {
      expect(issues).toEqual([])
      expect(options.deckA || options.deckB || options.deckC).toBe(true)
    }
    // Two decks refused leaves exactly one possible answer.
    for (const { options } of resolveMany(odin, { deckA: false, deckB: false }, 2)) expect(options.deckC).toBe(true)
  })

  // captain-flip: the Base treasure map forbids four of the expansion boards.
  test('captain-flip — a forbidden pair is avoided by backtracking across two enums', () => {
    const captainFlip = spec({
      options: {
        board: { kind: 'enum', values: ['A', 'F', 'G', 'H', 'I'] },
        treasureMap: { kind: 'enum', values: ['Base', 'Storm'] }
      },
      rules: [
        {
          type: 'forbidden-combination',
          when: [
            { option: 'treasureMap', values: ['Base'] },
            { option: 'board', values: ['F', 'G', 'H', 'I'] }
          ],
          message: 'base-map.forbidden'
        }
      ]
    })
    for (const { options, issues } of resolveMany(captainFlip, { treasureMap: 'Base' }, 2)) {
      expect(issues).toEqual([])
      expect(options.board).toBe('A')
    }
    // The other direction: a board only the Storm map allows must select it.
    for (const { options } of resolveMany(captainFlip, { board: 'H' }, 2)) expect(options.treasureMap).toBe('Storm')
  })

  // mythologies: pick exactly four divinity packs out of the declared list.
  test('mythologies — an enum-set honours in, out and size', () => {
    const mythologies = spec({
      options: { mythologies: { kind: 'enum-set', values: ['greek', 'norse', 'egyptian', 'celtic', 'aztec', 'japanese'], size: 4 } }
    })
    for (const { options, issues } of resolveMany(mythologies, { mythologies: { greek: 'in', norse: 'in', aztec: 'out' } }, 2)) {
      expect(issues).toEqual([])
      const picked = options.mythologies as string[]
      expect(picked).toHaveLength(4)
      expect(picked).toContain('greek')
      expect(picked).toContain('norse')
      expect(picked).not.toContain('aztec')
      expect(new Set(picked).size).toBe(4)
    }
  })

  /**
   * The two directions are separate codes because the two messages the form
   * already shows say different things — too many ticked, or too many refused.
   */
  test('an enum-set asked for more values than it picks says so', () => {
    const mythologies = spec({ options: { packs: { kind: 'enum-set', values: ['a', 'b', 'c', 'd'], size: 2 } } })
    const { issues } = resolveOptions(mythologies, { packs: { a: 'in', b: 'in', c: 'in' } }, 2, { random: seeded() })
    expect(issues.map((issue) => issue.code)).toContain('enum-set-too-many')
  })

  test('an enum-set with too many values refused says so too', () => {
    const mythologies = spec({ options: { packs: { kind: 'enum-set', values: ['a', 'b', 'c', 'd'], size: 3 } } })
    const { issues } = resolveOptions(mythologies, { packs: { a: 'out', b: 'out' } }, 2, { random: seeded() })
    expect(issues.map((issue) => issue.code)).toContain('enum-set-too-few')
  })

  test('an enum-set with a size range picks inside it', () => {
    const target = spec({ options: { packs: { kind: 'enum-set', values: ['a', 'b', 'c', 'd'], size: { min: 1, max: 3 } } } })
    const lengths = new Set(resolveMany(target, {}, 2).map(({ options }) => (options.packs as string[]).length))
    expect([...lengths].every((length) => length >= 1 && length <= 3)).toBe(true)
    expect(lengths.size).toBeGreaterThan(1)
  })

  test('a resolved combination always passes validation', () => {
    const target = spec({
      players: { min: 2, max: 4 },
      options: {
        beginner: { kind: 'boolean' },
        board: { kind: 'enum', values: ['S', 'M', { value: 'L', playerCount: { min: 4 } }] },
        gods: { kind: 'enum-set', values: ['zeus', 'odin', 'ra', 'thor'], size: 2 },
        variant: { kind: 'enum', values: [1, 2], requires: [{ option: 'beginner', values: [false] }] }
      },
      rules: [
        {
          type: 'forbidden-combination',
          when: [
            { option: 'board', values: ['S'] },
            { option: 'gods', values: ['thor'] }
          ],
          message: 'no-thor-small'
        }
      ]
    })
    for (const playerCount of legalPlayerCounts(target)) {
      for (const { options, issues } of resolveMany(target, {}, playerCount)) {
        expect(issues).toEqual([])
        expect(validateOptions(target, options, playerCount)).toEqual([])
      }
    }
  })
})

describe('identities', () => {
  const identities = (values: any[]) => spec({ identities: { values } })
  const assign = (target: OptionsSpecV2, preferences: any[], playerCount: number) => assignIdentities(target, preferences, playerCount)!.identities

  test('gives every player a different one', () => {
    const assigned = assign(identities([1, 2, 3, 4]), [null, null, null], 3)
    expect(assigned).toHaveLength(3)
    expect(new Set(assigned).size).toBe(3)
  })

  test('honours a player preference', () => {
    for (let draw = 0; draw < 10; draw++) {
      expect(assign(identities([1, 2, 3, 4]), [3, null], 2)[0]).toBe(3)
    }
  })

  test('never hands out an identity the table size does not offer', () => {
    const target = identities([1, 2, 3, { value: 4, playerCount: { min: 4 } }])
    for (let draw = 0; draw < 10; draw++) {
      expect(assign(target, [null, null], 2)).not.toContain(4)
    }
  })

  test('drops a preference for an identity that does not exist here', () => {
    const target = identities([1, 2, 3, { value: 4, playerCount: { min: 4 } }])
    const assigned = assign(target, [4, null], 2)
    expect(assigned).not.toContain(4)
    expect(new Set(assigned).size).toBe(2)
  })

  // brigands: the Prince exists from 3 players, and is compulsory once it does.
  test('brigands — available and required are two different statements', () => {
    const brigands = identities([1, 2, { value: 'prince', playerCount: { min: 3 }, required: true }, 4])
    for (let draw = 0; draw < 20; draw++) {
      expect(assign(brigands, [null, null], 2)).not.toContain('prince')
      expect(assign(brigands, [null, null, null], 3)).toContain('prince')
    }
  })

  test('a required identity survives player preferences that ignore it', () => {
    const brigands = identities([1, 2, { value: 'prince', playerCount: { min: 3 }, required: true }, 4])
    for (let draw = 0; draw < 20; draw++) {
      expect(assign(brigands, [1, 2, 4], 3)).toContain('prince')
    }
  })

  /**
   * v1 wraps around its own list here and hands the same identity to two players.
   * An identity is the link between a user and a player, so that is a broken
   * game, not a degraded one — and the spec gate reports it long before this.
   */
  test('refuses a table it has too few identities for, rather than repeating one', () => {
    const assignment = assignIdentities(identities([1, 2]), [null, null, null], 3)!
    expect(assignment.identities).toEqual([])
    expect(assignment.issues).toEqual([{ code: 'identity-count', options: [], value: 2 }])
  })

  test('refuses to seat more required identities than there are players', () => {
    const target = identities([
      { value: 1, required: true },
      { value: 2, required: true },
      { value: 3, required: true }
    ])
    expect(assignIdentities(target, [null, null], 2)!.issues).toEqual([{ code: 'identity-count', options: [], value: 3 }])
  })

  test('a game with no identities has none to assign', () => {
    expect(assignIdentities(spec({}), [null, null], 2)).toBeNull()
  })
})

describe('teams', () => {
  const zenith = spec({ players: { min: 2, max: 4 }, teams: { values: ['red', 'blue'] } })

  test('splits the table equally', () => {
    const { teams, issues } = assignTeams(zenith, [null, null, null, null], 4)
    expect(issues).toEqual([])
    expect(teams.filter((team) => team === 'red')).toHaveLength(2)
    expect(teams.filter((team) => team === 'blue')).toHaveLength(2)
  })

  test('honours preferences up to the size of a team', () => {
    const { teams } = assignTeams(zenith, ['red', 'red', 'red', null], 4)
    expect(teams[0]).toBe('red')
    expect(teams[1]).toBe('red')
    // The third player wanted a full team and is balanced out instead.
    expect(teams[2]).toBe('blue')
    expect(teams[3]).toBe('blue')
  })

  test('ignores a preference for a team that does not exist', () => {
    const { teams } = assignTeams(zenith, ['green', null], 2)
    expect(new Set(teams)).toEqual(new Set(['red', 'blue']))
  })

  test('refuses a table it cannot split', () => {
    expect(assignTeams(zenith, [null, null, null], 3).issues).toEqual([{ code: 'team-count', options: [] }])
  })

  // kitsu: teams of two.
  test('honours a declared team size', () => {
    const kitsu = spec({ players: { min: 4, max: 8 }, teams: { values: ['red', 'blue'], size: 2 } })
    const { teams, issues } = assignTeams(kitsu, [null, null, null, null], 4)
    expect(issues).toEqual([])
    expect(teams.filter((team) => team === 'red')).toHaveLength(2)
  })

  test('a game with no teams has none to assign', () => {
    expect(assignTeams(spec({}), [null, null], 2)).toEqual({ teams: [], issues: [] })
  })
})
