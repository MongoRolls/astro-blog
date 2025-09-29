// 导入统一的类型定义
import type { Image } from '../types/image'

export type { Image }

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
  ossWebsite?: string
  subtitle?: string
  description: string
  image?: Image
  headerNavLinks?: Link[]
  socialLinks?: Link[]
  postsPerPage?: number
  projectsPerPage?: number
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
  ossWebsite: 'https://mongorolls-images.oss-cn-shenzhen.aliyuncs.com/',
  subtitle: 'a Frontend Engineer',
  description: 'Blog by MongoRolls',
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
    alt: 'MongoRolls - Astro.js and Tailwind CSS theme',
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
        href: '/about'
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
    }
  ],
  postsPerPage: 6,
  projectsPerPage: 4,
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

export default siteConfig
