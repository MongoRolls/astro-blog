import type { Locale } from '../i18n/config'
import { localizedPath } from '../i18n/config'

export interface Image {
  src: string
  alt?: string
  caption?: string
}

export interface Link {
  text: string
  href: string
  icon?: string
}

export interface Friend {
  avatar: string
  name: string
  description: string
  tags: string[]
  link?: string
  github?: string
}

export interface SiteConfig {
  logo?: Image
  title: string
  website?: string
  subtitle?: string
  description: string
  image?: Image
  headerNavLinks?: Link[]
  socialLinks?: Link[]
  postsPerPage?: number
  friends: Friend[]
  author?: string
  language?: string
  locale?: string
  keywords?: string[]
  themeColor?: string
}

const siteConfig: SiteConfig = {
  title: 'MongoRolls',
  website: 'https://mongorolls.cn',
  subtitle: 'a Frontend Engineer',
  description: 'MongoRolls 的前端技术博客，记录 JavaScript、TypeScript、React、工程化实践与个人思考。',
  author: 'MongoRolls',
  language: 'zh-CN',
  locale: 'zh_CN',
  keywords: ['前端开发', '技术博客', 'JavaScript', 'React', 'Vue', 'Node.js'],
  themeColor: '#425bc5',
  logo: {
    src: '/logo.png',
  },
  image: {
    src: '/logo.png',
    alt: 'MongoRolls 技术博客',
  },
  headerNavLinks: [
    // {
    //     text: 'Home',
    //     href: '/'
    // },
    // {
    //     text: 'Projects',
    //     href: '/projects'
    // },
    {
      text: 'Post',
      href: '/post',
    },
    {
      text: 'Blog',
      href: '/blog',
    },
    {
      text: 'Tags',
      href: '/tags',
    },
    // {
    //     text: 'Friends',
    //     href: '/friends'
    // },
    {
      text: 'About',
      href: '/about',
    },

  ],
  socialLinks: [
    {
      text: 'github',
      href: 'https://github.com/MongoRolls',
    },
    {
      text: 'QQ',
      href: 'http://wpa.qq.com/msgrd?v=3&uin=1467513807&site=qq&menu=yes',
    },
    {
      text: 'RSS',
      href: '/rss.xml',
    },
  ],
  postsPerPage: 6,
  friends: [
    {
      avatar: '/friends/hongshen.png',
      name: '红神',
      description: '莞青CTO',
      tags: ['快手', '小黑盒', '后端'],
      github: 'https://github.com/interca/',
    },
    {
      avatar: '/friends/bantang.png',
      name: '半糖',
      description: '开源大佬',
      tags: ['小米', '百度', '后端'],
      github: 'https://github.com/BanTanger',
    },
    {
      avatar: '/friends/jinyu.png',
      name: '金鱼',
      description: 'ab实验室，ak实验室',
      tags: ['字节', '小鹅通', '后端'],
      github: 'https://github.com/dbinggo',
    },
  ] as Friend[],
}

const localizedMetadata = {
  'zh-CN': {
    subtitle: '一名前端工程师',
    description: 'MongoRolls 的前端技术博客，记录 JavaScript、TypeScript、React、工程化实践与个人思考。',
    language: 'zh-CN',
    locale: 'zh_CN',
    keywords: ['前端开发', '技术博客', 'JavaScript', 'React', 'Vue', 'Node.js'],
    imageAlt: 'MongoRolls 技术博客',
  },
  'en': {
    subtitle: 'a Frontend Engineer',
    description: 'MongoRolls is a frontend engineering blog about JavaScript, TypeScript, React, web tooling, AI, and personal notes.',
    language: 'en',
    locale: 'en_US',
    keywords: ['frontend development', 'engineering blog', 'JavaScript', 'TypeScript', 'React', 'web development'],
    imageAlt: 'MongoRolls frontend engineering blog',
  },
} as const satisfies Record<Locale, {
  subtitle: string
  description: string
  language: string
  locale: string
  keywords: string[]
  imageAlt: string
}>

export function getSiteConfig(locale: Locale): SiteConfig {
  const metadata = localizedMetadata[locale]
  return {
    ...siteConfig,
    subtitle: metadata.subtitle,
    description: metadata.description,
    language: metadata.language,
    locale: metadata.locale,
    keywords: [...metadata.keywords],
    image: siteConfig.image
      ? { ...siteConfig.image, alt: metadata.imageAlt }
      : undefined,
    headerNavLinks: [
      { text: locale === 'zh-CN' ? '文章' : 'Posts', href: localizedPath(locale, '/post/') },
      { text: locale === 'zh-CN' ? '博客' : 'Blog', href: localizedPath(locale, '/blog/') },
      { text: locale === 'zh-CN' ? '标签' : 'Tags', href: localizedPath(locale, '/tags/') },
      { text: locale === 'zh-CN' ? '关于' : 'About', href: localizedPath(locale, '/about/') },
    ],
    socialLinks: siteConfig.socialLinks?.map(link => link.text === 'RSS'
      ? { ...link, href: localizedPath(locale, '/rss.xml') }
      : link),
  }
}

export default siteConfig
