import type { Theme } from '@tsuki/shared/theme'

/**
 * 社交链接配置
 */
export interface SocialLink {
  /** Link label */
  name: string
  /** Icon: builtin name, inline SVG string, or image URL */
  icon: string
  /** Link href */
  url: string
}

/**
 * 个人资料配置
 */
export interface ProfileConfig {
  /** 头像地址（支持本地路径或 URL） */
  avatar?: string
  /** 头像跳转链接（可选） */
  avatarLink?: string
  /** 名称 */
  name: string
  /** 个人简介 */
  bio?: string
  /** 社交链接列表 */
  links?: SocialLink[]
}

/**
 * 公告配置
 */
export interface AnnouncementConfig {
  /** 是否启用 */
  enable?: boolean
  /** 公告标题 */
  title?: string
  /** 公告内容（支持 HTML） */
  content?: string
  /** 公告链接配置 */
  link?: {
    /** 是否启用 */
    enable?: boolean
    /** 链接文本 */
    text?: string
    /** 链接地址 */
    url?: string
  }
}

/**
 * 站点统计配置
 */
export interface StatsConfig {
  /** 是否启用 */
  enable?: boolean
}

/**
 * 导航链接配置
 */
export interface NavLink {
  /** 显示文本，长度 1..32 */
  label: string
  /** 链接地址，必须以 / 或 https:// 开头 */
  href: string
  /** 可选图标：内联 SVG 字符串 */
  icon?: string
}

/**
 * 站点基础配置
 */
export interface SiteConfig {
  /** 站点标题，长度 1..32 */
  title: string
  /** 站点描述，长度 0..160 */
  description?: string
  /** 默认主题 */
  defaultTheme?: Theme
  /**
   * 标签页图标（favicon）地址
   * - 支持站内静态路径（如 /favicon.svg、/media/favicon.png）
   * - 支持外部 URL（如 https://example.com/favicon.ico）
   */
  faviconHref?: string
}

/**
 * 背景图配置
 */
export interface BackgroundImageConfig {
  /**
   * 图片地址
   * - 站内静态路径：/media/hero.jpg
   * - 外部 URL：https://...
   */
  href: string
  /**
   * 垂直焦点位置（0-100）
   * - 0 = 显示图片顶部
   * - 50 = 居中（默认）
   * - 100 = 显示图片底部
   */
  positionY?: number
}

/**
 * 首页 Hero 配置（支持 HTML）
 */
export interface HeroConfig {
  /** 第一行标题（HTML 字符串） */
  titleHtml?: string
  /** 第二行副标题（HTML 字符串） */
  subtitleHtml?: string
  /** Hero 背景图（可选） */
  backgroundImage?: BackgroundImageConfig
}

/**
 * Tsuki 配置文件结构
 */
export interface TsukiConfig {
  /** 站点基础配置 */
  site: SiteConfig
  /** 导航栏链接，0..10 项 */
  nav?: NavLink[]
  /** 首页 Hero 配置 */
  hero?: HeroConfig
  /** 个人资料配置 */
  profile?: ProfileConfig
  /** 公告配置 */
  announcement?: AnnouncementConfig
  /** 站点统计配置 */
  stats?: StatsConfig
}

/**
 * 用户输入配置（用于深度合并）
 */
export interface TsukiUserConfig {
  site?: Partial<SiteConfig>
  nav?: NavLink[]
  hero?: Partial<HeroConfig>
  profile?: Partial<ProfileConfig>
  announcement?: Partial<AnnouncementConfig>
  stats?: Partial<StatsConfig>
}
