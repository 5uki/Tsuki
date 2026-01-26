import type { Theme } from '@tsuki/shared/theme'

/**
 * 导航链接配置
 */
export interface NavLink {
  /** 显示文本，长度 1..32 */
  label: string
  /** 链接地址，必须以 / 或 https:// 开头 */
  href: string
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
 * 首页 Hero 配置（支持 HTML）
 */
export interface HeroConfig {
  /** 第一行标题（HTML 字符串） */
  titleHtml?: string
  /** 第二行副标题（HTML 字符串） */
  subtitleHtml?: string
  /**
   * Hero 背景图（可选）
   * - 站内静态路径：/media/hero.jpg
   * - 外部 URL：https://...
   */
  backgroundImageHref?: string
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
}

/**
 * 用户输入配置（用于深度合并）
 */
export interface TsukiUserConfig {
  site?: Partial<SiteConfig>
  nav?: NavLink[]
  hero?: Partial<HeroConfig>
}
