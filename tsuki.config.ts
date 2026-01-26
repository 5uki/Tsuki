import { defineConfig } from '@tsuki/config'

export default defineConfig({
  site: {
    title: "Suki's Blog",
    description: '一个认真写字的地方',
    defaultTheme: 'violet',
    faviconHref: '/favicon.svg',
  },
  hero: {
    titleHtml: "<span style=\"letter-spacing: -0.02em;\">Suki's Blog</span>",
    subtitleHtml: '<span>一个认真写字的地方</span>',
    backgroundImageHref: '/background.jpg',
  },
  nav: [
    { label: '首页', href: '/' },
    { label: '文章', href: '/posts' },
    { label: '动态', href: '/moments' },
    { label: '标签', href: '/tags' },
    { label: '分组', href: '/groups' },
  ],
})
