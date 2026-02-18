import { defineConfig, navIcons } from '@tsuki/config'

export default defineConfig({
  site: {
    title: 'Tsuki',
    description: '一个认真写字的地方',
    defaultTheme: 'mauve',
    faviconHref: '/favicon.svg',
  },
  hero: {
    titleHtml: '<span style="letter-spacing: -0.02em;">Tsuki</span>',
    subtitleHtml: '<span>一个认真写字的地方</span>',
    backgroundImage: {
      href: '/background.png',
      positionY: 25,
    },
  },
  nav: [
    { label: '首页', href: '/', icon: navIcons.home },
    { label: '文章', href: '/posts', icon: navIcons.posts },
    { label: '动态', href: '/moments', icon: navIcons.moments },
  ],
  profile: {
    avatar: '/avatar.png',
    avatarLink: '/about',
    name: 'Suki',
    bio: '热爱技术，喜欢分享',
    links: [
      {
        name: 'GitHub',
        icon: 'fa6-brands:github',
        url: 'https://github.com/5uki/Tsuki',
      },
    ],
  },
  announcement: {
    enable: true,
    title: '公告',
    content: '欢迎来到我的博客！这里记录了我的技术学习和生活点滴。',
    link: {
      enable: true,
      text: '了解更多',
      url: '/about',
    },
  },
  stats: {
    enable: true,
  },
})
