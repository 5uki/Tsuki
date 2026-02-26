import { defineConfig, navIcons } from '@tsuki/config'
import type { TsukiUserConfig } from '@tsuki/config'
import { createT } from '@tsuki/i18n'
import configJson from '../../../../tsuki.config.json'

const navIconMap: Record<string, string> = {
  '/': navIcons.home,
  '/archives': navIcons.archive,
  '/moments': navIcons.moments,
  '/about': navIcons.about,
  '/friends': navIcons.friends,
}

const typedConfigJson = configJson as TsukiUserConfig

const config = defineConfig({
  ...typedConfigJson,
  nav: (typedConfigJson.nav ?? []).map((link) => ({
    ...link,
    icon: navIconMap[link.href] ?? undefined,
  })),
})

export const locale = config.site.locale ?? 'zh'
export const t = createT(locale)
export default config
