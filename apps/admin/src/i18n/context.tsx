import { createContext, useContext, type ReactNode } from 'react'
import { createT, type TFunction } from '@tsuki/i18n'
import type { Locale } from '@tsuki/i18n'

const I18nContext = createContext<TFunction | null>(null)

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = createT(locale)
  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>
}

export function useT(): TFunction {
  const t = useContext(I18nContext)
  if (!t) throw new Error('useT must be used within I18nProvider')
  return t
}
