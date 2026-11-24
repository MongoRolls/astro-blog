import type { Locale } from '../i18n/config'

export type CardTone = 'blue' | 'sage' | 'rose' | 'lavender' | 'slate'

export type FriendLinkKind = 'blog' | 'github'

export interface FriendItem {
  id: string
  avatar: string
  tone: CardTone
  name: Record<Locale, string>
  handle: string
  role: Record<Locale, string>
  bio: Record<Locale, string>
  tags: Record<Locale, readonly string[]>
  href: string
  linkKind: FriendLinkKind
}

export interface ReadingBlogItem {
  id: string
  monogram: string
  tone: CardTone
  name: Record<Locale, string>
  domain: string
  href: string
  rss?: string
  tags: Record<Locale, readonly string[]>
  note: Record<Locale, string>
}

export const friendLinks: readonly FriendItem[] = [
  {
    id: 'hongshen',
    avatar: '/friends/hongshen.png',
    tone: 'blue',
    name: {
      'zh-CN': '红神',
      'en': 'Hongshen',
    },
    handle: '@interca',
    role: {
      'zh-CN': '莞青 CTO',
      'en': 'Tech Lead · Backend',
    },
    bio: {
      'zh-CN': '深耕后端服务与高并发工程架构，先后历练于快手、小黑盒，工程直觉敏锐的老朋友。',
      'en': 'Backend engineer experienced in high-concurrency architecture across Kuaishou and Heybox.',
    },
    tags: {
      'zh-CN': ['快手', '小黑盒', '后端'],
      'en': ['Kuaishou', 'Heybox', 'Backend'],
    },
    href: 'https://github.com/interca/',
    linkKind: 'github',
  },
  {
    id: 'bantang',
    avatar: '/friends/bantang.png',
    tone: 'sage',
    name: {
      'zh-CN': '半糖',
      'en': 'BanTanger',
    },
    handle: '@BanTanger',
    role: {
      'zh-CN': '开源大佬',
      'en': 'Open-Source Builder',
    },
    bio: {
      'zh-CN': '活跃于开源社区与底层架构研发，曾就职于小米、百度，擅长把复杂系统问题拆解清楚。',
      'en': 'Active open-source contributor focused on backend infrastructure, with experience at Xiaomi and Baidu.',
    },
    tags: {
      'zh-CN': ['小米', '百度', '后端', '开源'],
      'en': ['Xiaomi', 'Baidu', 'Backend', 'OSS'],
    },
    href: 'https://github.com/BanTanger',
    linkKind: 'github',
  },
  {
    id: 'jinyu',
    avatar: '/friends/jinyu.png',
    tone: 'lavender',
    name: {
      'zh-CN': '金鱼',
      'en': 'Jinyu',
    },
    handle: '@dbinggo',
    role: {
      'zh-CN': 'AB 实验室 · AK 实验室',
      'en': 'AB Lab & AK Lab',
    },
    bio: {
      'zh-CN': '专注后端服务研发与实验平台探索，先后在字节跳动、小鹅通打磨核心业务与底层能力。',
      'en': 'Backend engineer working on experimentation platforms and core services at ByteDance and Xiaoetong.',
    },
    tags: {
      'zh-CN': ['字节跳动', '小鹅通', '后端'],
      'en': ['ByteDance', 'Xiaoetong', 'Backend'],
    },
    href: 'https://github.com/dbinggo',
    linkKind: 'github',
  },
]

export const readingBlogs: readonly ReadingBlogItem[] = [
  {
    id: 'douchi',
    monogram: '豆',
    tone: 'sage',
    name: {
      'zh-CN': '椒盐豆豉',
      'en': 'Douchi’s Blog',
    },
    domain: 'blog.douchi.space',
    href: 'https://blog.douchi.space/',
    rss: 'https://blog.douchi.space/index.xml',
    tags: {
      'zh-CN': ['数字花园', '生活随笔'],
      'en': ['Digital Garden', 'Life Essays'],
    },
    note: {
      'zh-CN': '舒展安静的独立博客，文章列表排版与细水长流的日常记录感很耐看，也是本站列表样式的灵感来源之一。',
      'en': 'A calm, thoughtfully arranged independent blog whose unhurried writing and clean archive layout inspired parts of this site.',
    },
  },
  {
    id: 'tw93',
    monogram: 'TW',
    tone: 'blue',
    name: {
      'zh-CN': 'Tw93 的博客',
      'en': 'Tw93’s Blog',
    },
    domain: 'tw93.fun',
    href: 'https://tw93.fun/',
    rss: 'https://tw93.fun/feed.xml',
    tags: {
      'zh-CN': ['产品工程', '潮流周刊', '开源'],
      'en': ['Product', 'Weekly', 'Open Source'],
    },
    note: {
      'zh-CN': '《潮流周刊》作者，长期记录产品与工程实践，分享 AI 工作流、开源工具、Mac 效率软件与日常思考。',
      'en': 'Product engineer and author of Weekly—writing about building software, AI workflows, open-source tools, and macOS apps.',
    },
  },
  {
    id: 'ruanyifeng',
    monogram: '阮',
    tone: 'slate',
    name: {
      'zh-CN': '阮一峰的网络日志',
      'en': 'Ruan Yifeng’s Weblog',
    },
    domain: 'ruanyifeng.com/blog',
    href: 'https://www.ruanyifeng.com/blog/',
    rss: 'https://www.ruanyifeng.com/blog/atom.xml',
    tags: {
      'zh-CN': ['科技周刊', '中文常青树'],
      'en': ['Tech Weekly', 'Essays'],
    },
    note: {
      'zh-CN': '中文独立博客的长跑典范，每周五更新的《科技爱好者周刊》是常年翻阅的技术与趋势信息窗口。',
      'en': 'A long-running cornerstone of Chinese independent blogging; his Friday Tech Weekly remains a staple read.',
    },
  },
  {
    id: 'simon-willison',
    monogram: 'SW',
    tone: 'lavender',
    name: {
      'zh-CN': 'Simon Willison’s Weblog',
      'en': 'Simon Willison’s Weblog',
    },
    domain: 'simonwillison.net',
    href: 'https://simonwillison.net/',
    rss: 'https://simonwillison.net/atom/everything/',
    tags: {
      'zh-CN': ['AI 工程', 'TIL 笔记'],
      'en': ['AI Engineering', 'TIL'],
    },
    note: {
      'zh-CN': '高密度记录 LLM 工具链、编码 Agent 与一手实验笔记，兼具工程师务实态度与独立博客活力。',
      'en': 'High-signal field notes on LLM tooling, coding agents, and independent web publishing.',
    },
  },
]
