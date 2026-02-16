import { defineConfig } from '@tsuki/config'

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
    { label: '首页', href: '/', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>' },
    { label: '文章', href: '/posts', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 13H8"/><path d="M16 17H8"/><path d="M16 13h-2"/></svg>' },
    { label: '动态', href: '/moments', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>' },
    { label: '标签', href: '/tags', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>' },
    { label: '分组', href: '/groups', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/></svg>' },
  ],
  profile: {
    avatar: '/background.png',
    avatarLink: '/about',
    name: 'Suki',
    bio: '热爱技术，喜欢分享',
    links: [
      {
        name: 'GitHub',
        icon: 'fa6-brands:github',
        url: 'https://github.com',
      },
      {
        name: 'Twitter',
        icon: 'fa6-brands:x-twitter',
        url: 'https://twitter.com',
      },
      {
        name: 'Email',
        icon: 'fa6-solid:mail',
        url: 'mailto:example@email.com',
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
