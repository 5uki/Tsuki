import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { I18nProvider } from './i18n/context'
import type { Locale } from '@tsuki/i18n'
import './styles/global.css'

const locale = (localStorage.getItem('tsuki.admin.locale') || 'zh') as Locale

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider locale={locale}>
      <App />
    </I18nProvider>
  </React.StrictMode>
)
