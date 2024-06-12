import { EnumOption } from './EnumOption'
import { Option } from './Option'
import { PlayerEnumOption } from './PlayerEnumOption'

export type OptionSpecOf<T> = [T] extends [boolean] ? Option : EnumOption<T>
export type PlayerOptionSpecOf<T> = [T] extends [boolean] ? Option : PlayerEnumOption<T>
