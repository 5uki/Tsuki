/**
 * 共享图标常量（基于 Iconify 图标库）
 * 组件和配置通过图标名称引用，渲染时统一使用 astro-icon。
 */

export const navIcons = {
  home: 'material-symbols:home-outline-rounded',
  posts: 'material-symbols:article-outline-rounded',
  moments: 'material-symbols:auto-stories-outline-rounded',
  tags: 'material-symbols:tag-rounded',
  groups: 'material-symbols:folder-outline-rounded',
  about: 'material-symbols:person-outline-rounded',
  friends: 'material-symbols:group-outline-rounded',
  archive: 'material-symbols:inventory-2-outline-rounded',
} as const

export const socialIcons = {
  github: 'material-symbols:code-rounded',
  twitter: 'material-symbols:alternate-email-rounded',
  mail: 'material-symbols:mail-outline-rounded',
} as const

export const uiIcons = {
  search: 'material-symbols:search-rounded',
  palette: 'material-symbols:format-paint-rounded',
  menu: 'material-symbols:menu-rounded',
  githubLogin: 'material-symbols:code-rounded',
  idCard: 'material-symbols:badge-outline-rounded',
  plus: 'material-symbols:add-rounded',
  info: 'material-symbols:info-outline-rounded',
  list: 'material-symbols:format-list-bulleted-rounded',
  home: 'material-symbols:home-outline-rounded',
  chevronUp: 'material-symbols:keyboard-arrow-up-rounded',
  wechat: 'material-symbols:chat-bubble-outline-rounded',
  copy: 'material-symbols:content-copy-outline-rounded',
} as const

/**
 * 图标名称映射表（用于配置中的别名）
 */
export const iconRegistry: Record<string, string> = {
  'fa6-brands:github': socialIcons.github,
  'fa6-brands:x-twitter': socialIcons.twitter,
  'fa6-solid:mail': socialIcons.mail,
  'fa6-brands:telegram': 'material-symbols:send-outline-rounded',
  'fa6-brands:qq': 'material-symbols:forum-outline-rounded',
  'fa6-brands:weibo': 'material-symbols:chat-outline-rounded',
  'fa6-brands:wechat': 'material-symbols:chat-bubble-outline-rounded',
  home: navIcons.home,
  posts: navIcons.posts,
  moments: navIcons.moments,
  tags: navIcons.tags,
  groups: navIcons.groups,
  about: navIcons.about,
  friends: navIcons.friends,
  archive: navIcons.archive,
}
