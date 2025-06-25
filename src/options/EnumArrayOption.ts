import { EnumOption, isEnumOption } from './EnumOption'
import { Option } from './Option'

export type EnumArrayOption<T = any> = EnumOption<T> & {
  size: number
}

export function isEnumArrayOption<T = any>(option: Option): option is EnumArrayOption<T> {
  return isEnumOption(option) && typeof (option as any).size === 'number'
}
