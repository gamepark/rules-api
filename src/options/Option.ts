import { TFunction } from './TFunction'

export type Option = {
  label: (t: TFunction) => string
  help?: (t: TFunction) => string
  warn?: (t: TFunction) => string
  subscriberRequired?: boolean
  competitiveDisabled?: boolean
  solo?: boolean
  hide?: (players: number) => boolean
}
