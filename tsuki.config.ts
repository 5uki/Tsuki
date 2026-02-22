import { defineConfig, navIcons } from '@tsuki/config'

export default defineConfig({
  site: {
    title: '你的博客名',
    url: 'https://example.com',
    description: '在这里记录你的思考与创作。',
    defaultTheme: 'mauve',
    faviconHref: './contents/favicon.svg',
  },
  hero: {
    title: '欢迎来到我的博客',
    subtitle: '这是一个可快速定制的博客模板。',
    backgroundImages: [
      { href: './contents/banners/1.png', positionX: 32, positionY: 25 },
      { href: './contents/banners/2.png', positionX: 32, positionY: 25 },
      { href: './contents/banners/3.png', positionX: 32, positionY: 25 },
    ],
  },
  nav: [
    { label: '首页', href: '/', icon: navIcons.home },
    { label: '归档', href: '/archives', icon: navIcons.archive },
    { label: '动态', href: '/moments', icon: navIcons.moments },
    { label: '关于', href: '/about', icon: navIcons.about },
    { label: '友链', href: '/friends', icon: navIcons.friends },
  ],
  profile: {
    avatar: './contents/avatar.webp',
    avatarLink: '/about',
    name: '你的名字',
    bio: '一句简短的自我介绍。',
    links: [
      {
        name: 'GitHub',
        icon: 'fa6-brands:github',
        url: 'https://github.com/yourname',
      },
    ],
  },
  announcement: {
    enable: true,
    title: '模板公告',
    content: '你可以在 tsuki.config.ts 中修改这里的文案与链接。',
    link: {
      enable: true,
      text: '查看关于页',
      url: '/about',
    },
  },
  stats: {
    enable: true,
  },
  friends: [],
})
