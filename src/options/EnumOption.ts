import { Option } from './Option'

export type EnumOption<T = any> = Option & {
  values: T[]
  valueSpec: (value: T) => Option
}

export function isEnumOption<T = any>(option: Option): option is EnumOption<T> {
  return Array.isArray((option as EnumOption).values)
}
