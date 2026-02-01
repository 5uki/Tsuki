import { DEFAULT_THEME } from '@tsuki/shared/theme'
import type { TsukiConfig } from './types'

/**
 * 内置默认配置
 *
 * 当 `tsuki.config.ts` 未指定某项时使用
 */
export const DEFAULT_CONFIG: TsukiConfig = {
  site: {
    title: 'Tsuki Blog',
    description: 'A blog powered by Tsuki',
    defaultTheme: DEFAULT_THEME,
    faviconHref: '/favicon.svg',
  },
  nav: [
    { label: '首页', href: '/' },
    { label: '文章', href: '/posts' },
    { label: '动态', href: '/moments' },
    { label: '标签', href: '/tags' },
    { label: '分组', href: '/groups' },
  ],
  hero: {
    titleHtml: undefined,
    subtitleHtml: undefined,
    backgroundImageHref: undefined,
  },
  profile: {
    avatar: undefined,
    avatarLink: undefined,
    name: 'Tsuki',
    bio: undefined,
    links: [],
  },
  announcement: {
    enable: false,
    title: '公告',
    content: '',
    link: {
      enable: false,
      text: '查看详情',
      url: '',
    },
  },
  stats: {
    enable: true,
  },
}
