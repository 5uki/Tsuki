import { DEFAULT_THEME } from '@tsuki/shared/theme'
import type { TsukiConfig } from './types'

/**
 * 内置默认配置
 *
 * 功能概述:
 * 当 `tsuki.config.ts` 未指定某项时使用的默认配置。
 *
 * 设计原则:
 * 1. 提供开箱即用的完整配置
 * 2. 所有配置项都有合理的默认值
 * 3. 用户可以覆盖任何配置项
 * 4. 保持配置的一致性和可预测性
 *
 * 配置项说明:
 * - site: 站点基础信息(标题、描述、主题等)
 * - nav: 导航栏链接配置
 * - hero: 首页顶部展示区域配置
 * - profile: 个人资料卡片配置
 * - announcement: 公告栏配置
 * - stats: 站点统计配置
 *
 * 性能优化点:
 * - 使用常量导出,避免重复创建对象
 * - 配置对象结构扁平,便于合并操作
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
    backgroundImage: undefined,
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
