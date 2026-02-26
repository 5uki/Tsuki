import { defineConfig, navIcons, type TsukiUserConfig } from '@tsuki/config'
import { createT } from '@tsuki/i18n'
import configJson from '../../../../tsuki.config.json'

const navIconMap: Record<string, string> = {
  '/': navIcons.home,
  '/archives': navIcons.archive,
  '/moments': navIcons.moments,
  '/about': navIcons.about,
  '/friends': navIcons.friends,
}

const configJsonTyped = configJson as TsukiUserConfig

const configInput: TsukiUserConfig = {
  ...configJsonTyped,
  nav: (configJsonTyped.nav ?? []).map((link) => ({
    ...link,
    icon: navIconMap[link.href] ?? undefined,
  })),
}

const config = defineConfig(configInput)

export const locale = config.site.locale ?? 'zh'
export const t = createT(locale)
export default config
