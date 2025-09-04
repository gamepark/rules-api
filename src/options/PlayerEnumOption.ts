import { difference } from 'es-toolkit'
import { EnumOption } from './EnumOption'

export type PlayerEnumOption<T = any> = EnumOption<T> & {
  mandatory?: (players: number) => T[]
  unavailable?: (players: number) => T[]
  share?: boolean
  optional?: boolean
}

export type PlayerIdOption<T = any> = PlayerEnumOption<T> & {
  share?: false
  optional?: false
}

export function getPlayersMandatoryValues<T = any>(spec: PlayerEnumOption<T>, players: number): T[] {
  return spec.mandatory ? spec.mandatory(players) : []
}

export function getPlayersAvailableValues<T = any>(spec: PlayerEnumOption<T>, players: number): T[] {
  if (spec.unavailable) {
    const unavailableValues = spec.unavailable(players)
    return spec.values.filter(value => !unavailableValues.includes(value))
  } else {
    return spec.values
  }
}

export function generatePlayersOption<T>(playersChoices: (T | null)[], option: PlayerEnumOption<T>): T[] {
  // Force to pick mandatory values
  const mandatoryValues = getPlayersMandatoryValues(option, playersChoices.length)
  for (const mandatoryValue of mandatoryValues) {
    if (!playersChoices.includes(mandatoryValue)) {
      const freeIndexes = playersChoices.map((choice, i) => choice !== null && mandatoryValues.includes(choice) ? -1 : i).filter(i => i !== -1)
      const index = freeIndexes[Math.floor(Math.random() * freeIndexes.length)]
      playersChoices[index] = mandatoryValue
    }
  }

  // Remove invalid choices
  const availableValues = getPlayersAvailableValues(option, playersChoices.length)
  for (let i = 0; i < playersChoices.length; i++) {
    const choice = playersChoices[i]
    if (choice !== null && !availableValues.includes(choice)) {
      playersChoices[i] = null
    }
    if (choice !== null && !option.share) {
      const sameChoiceIndexes = playersChoices.map((c, i) => c === choice ? i : -1).filter(i => i !== -1)
      if (sameChoiceIndexes.length > 0) {
        const keeper = sameChoiceIndexes[Math.floor(Math.random() * sameChoiceIndexes.length)]
        for (const index of sameChoiceIndexes) {
          if (index !== keeper) {
            playersChoices[index] = null
          }
        }
      }
    }
  }

  if (!option.optional) {
    // Provide missing choices (different values if possible)
    const remainingValues = difference(availableValues, playersChoices)
    for (let i = 0; i < playersChoices.length; i++) {
      if (playersChoices[i] === null) {
        if (remainingValues.length === 0) remainingValues.push(...availableValues)
        playersChoices[i] = remainingValues.splice(Math.floor(Math.random() * remainingValues.length), 1)[0]
      }
    }
  }

  return playersChoices as T[]
}
