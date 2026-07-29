import { Option } from './Option'

export type EnumOption<T = any> = Option & {
  values: T[]
  valueSpec: (value: T) => Option
  /**
   * @deprecated Moved to the platform database — see `Option.subscriberRequired`.
   * The options policy addresses the value by `String(value)` and resolves it
   * back through `values`, so renumbering an enum is detected instead of
   * silently repointing the competitive value.
   */
  competitiveValue?: T
}

export function isEnumOption<T = any>(option: Option): option is EnumOption<T> {
  return Array.isArray((option as EnumOption).values)
}
