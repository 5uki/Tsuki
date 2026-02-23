import { defineConfig, navIcons } from '@tsuki/config'
import configJson from '../../../../tsuki.config.json'

const navIconMap: Record<string, string> = {
  '/': navIcons.home,
  '/archives': navIcons.archive,
  '/moments': navIcons.moments,
  '/about': navIcons.about,
  '/friends': navIcons.friends,
}

export default defineConfig({
  ...configJson,
  nav: (configJson.nav ?? []).map((link) => ({
    ...link,
    icon: navIconMap[link.href] ?? undefined,
  })),
})
