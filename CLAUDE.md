# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@gamepark/rules-api` is a TypeScript library that provides an API for implementing board game rules on the Game Park platform. It uses a material-oriented approach where game state and moves are structured around game material items (cards, tokens, dice, etc.) and their movements.

## Development Commands

### Build and Test
- `yarn build` - Compile TypeScript to JavaScript (output in `dist/`)
- `yarn test` - Run tests with Vitest
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage report

### Running Single Tests
To run a specific test file:
```bash
yarn test src/tests/MaterialMoney.test.ts
```

To run tests matching a pattern:
```bash
yarn test -t "pattern"
```

## Architecture Overview

### Core Concepts

The library implements three main approaches to building game rules:

1. **Basic Rules API** (`Rules` class) - Minimal API for any board game
2. **Material Rules** (`MaterialRules` class) - Recommended material-oriented approach
3. **Hidden/Secret Material Rules** - Extensions for games with hidden information

### Material-Oriented Architecture

The material approach structures games around **items** that exist at **locations** and are manipulated through **moves**:

```
MaterialGame {
  players: Player[]              // Player identifiers
  items: Record<M, Item[]>       // All game items by type
  rule?: RuleStep<P, R>         // Current rule step
  memory: Record<any, any>       // Free-form state storage
}
```

### Key Classes

**`Rules<Game, Move, PlayerId>`** - Base class for all game implementations
- `isTurnToPlay(playerId)` - Check if player is active
- `getLegalMoves(playerId)` - List legal moves for a player
- `play(move)` - Execute a move and return consequences
- `isOver()` - Check if game is finished
- Supports **delegation pattern** to split rules into smaller parts

**`MaterialRules<Player, MaterialType, LocationType, RuleId>`** - Material-oriented rules
- Extends `Rules` with material-specific features
- `rules: Record<RuleId, MaterialRulesPartCreator>` - Maps rule IDs to rule implementations
- `material(type)` - Get `Material` helper for manipulating items
- `memorize(key, value, player?)` - Store temporary state
- `remind(key, player?)` - Retrieve memorized state
- `locationsStrategies` - Define automatic positioning rules

**`MaterialRulesPart<Player, MaterialType, LocationType, RuleId>`** - Small rule segments
- Implements one specific phase/step of the game
- `beforeItemMove(move)` - Hook before item moves
- `afterItemMove(move)` - Hook after item moves
- `onRuleStart(move)` - Called when this rule begins
- `onRuleEnd(move)` - Called when this rule ends
- `onCustomMove(move)` - Handle custom game-specific moves

**`Material<Player, MaterialType, LocationType>`** - Immutable item manipulation helper
- Fluent API for filtering and moving items
- `.location(type)` - Filter by location
- `.player(id)` - Filter by owner
- `.id(value)` - Filter by item ID
- `.getItems()` - Collect filtered items
- `.moveItem(index, location)` - Create move for single item
- `.moveItems(location)` - Create move for all filtered items

**`GameSetup<Game, Options>`** / **`MaterialGameSetup`** - Initialize game state
- `setup(options)` - Create initial game state from options
- `setupMaterial(options)` - Create material items (override in subclass)
- `start(options)` - Start first rule (override in subclass)
- `playMove(move)` - Execute moves during setup

### Move System

All moves extend `MaterialMove` which includes:
- **ItemMove** - Create, delete, move, roll, shuffle, or select items
- **RuleMove** - Start player turn, start simultaneous rule, end game
- **CustomMove** - Game-specific custom moves
- **LocalMove** - Client-side only moves (UI state)

Moves produce **consequences** - additional moves that execute automatically after the original move.

### Location Strategies

Location strategies maintain consistent item positioning:
- `PositiveSequenceStrategy` - Items arranged in sequence without gaps (e.g., cards in hand)
- `FillGapStrategy` - Automatically fill gaps when items removed (e.g., card rivers)
- `StackingStrategy` - Items stack at same position

Define in `MaterialRules.locationsStrategies: Partial<Record<MaterialType, Partial<Record<LocationType, LocationStrategy>>>>`

### Memory System

Use `memory` for state that doesn't fit in items or rule properties:
- `memorize(key, value, player?)` - Store value
- `remind(key, player?)` - Retrieve value
- `forget(key, player?)` - Delete value

Memory keys are typically numeric enum values.

### Utility Modules

**Grid utilities** (`src/utils/grid.*.util.ts`)
- `grid.util.ts` - Square grid helpers
- `grid.hex.util.ts` - Hexagonal grid coordinate systems (Axial, OddQ, EvenQ, OddR, EvenR)
- `grid.squares.util.ts` - Square grid specific utilities
- Functions for neighbors, distances, coordinate conversions

**Other utilities**
- `adjacent-groups.util.ts` - Find connected groups of items
- `neighbors.util.ts` - Get adjacent positions
- `money.util.ts` - Currency/token calculations
- `random.util.ts` - Random value generation

## Type Parameters Convention

Most classes use consistent generic type parameters:
- `P` / `Player` - Player identifier (number or numeric enum)
- `M` / `MaterialType` - Numeric enum of material types
- `L` / `LocationType` - Numeric enum of location types
- `R` / `RuleId` - Numeric enum of rule step identifiers
- `Id` - Item identifier type (varies per item)

## Testing

Tests use Vitest with Node environment. Test files are excluded from TypeScript compilation (see `tsconfig.json`).

Example test structure:
```typescript
import { describe, expect, it } from 'vitest'

describe('FeatureName', () => {
  it('should do something', () => {
    // test code
  })
})
```

## Delegation Pattern

The framework uses delegation extensively to split complex rules into manageable parts:
- `Rules.delegate()` - Return single delegate
- `Rules.delegates()` - Return array of delegates
- Default behavior calls delegates first, then own implementation
- Used for `isTurnToPlay`, `getLegalMoves`, `play`, `isOver`

## Random and Unpredictable Moves

- **RandomMove** - Moves with unpredictable outcomes (dice rolls, shuffles)
- `randomize(move)` - Server-side randomization before broadcast
- `isUnpredictableMove(move, player)` - Client shouldn't predict outcome
- Roll moves default to 6-sided dice (0-5), override `roll()` for custom dice

## Undo System

- `canUndo(action, consecutiveActions)` - Determine if action can be undone
- Default: cannot undo if player became active or dice rolled
- `moveBlocksUndo(move, player)` - Check if specific move blocks undo
- SelectItem moves can be undone in sequence

## Publishing

Uses Yarn 4.9.4. Package is scoped as `@gamepark/rules-api` with public access. Build runs automatically before `yarn pack`.
