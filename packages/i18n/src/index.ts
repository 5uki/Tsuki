import { zh } from './locales/zh'
import { en } from './locales/en'
import type { Locale, TranslationDict, TranslationKey } from './types'

const dictionaries: Record<Locale, TranslationDict> = { zh, en }

export function createT(locale: Locale) {
  const dict = dictionaries[locale]
  return function t(key: TranslationKey, params?: Record<string, string | number>): string {
    let str: string = dict[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{${k}}`, String(v))
      }
    }
    return str
  }
}

export type { Locale, TranslationDict, TranslationKey }
export type TFunction = ReturnType<typeof createT>
