import type { Locale } from '../i18n/config'

export type MediaKind = 'game' | 'book' | 'movie'

export interface NowUpdateItem {
  id: string
  emoji: string
  text: Record<Locale, string>
}

export interface MediaItem {
  id: string
  kind: MediaKind
  title: Record<Locale, string>
  cover: string
  coverAlt: Record<Locale, string>
  rating: number
  status?: Record<Locale, string>
  note: Record<Locale, string>
  href?: string
}

export const nowUpdates: readonly NowUpdateItem[] = [
  {
    id: 'ai-tools',
    emoji: '🤖',
    text: {
      'zh-CN': '近期在用 Antigravity，还有 Codex',
      'en': 'Currently using Antigravity and Codex in my daily workflow',
    },
  },
  {
    id: 'chenli-concert',
    emoji: '🎤',
    text: {
      'zh-CN': '准备抢陈粒 2027 年 1 月 30 日的北京演唱会门票',
      'en': 'Getting ready to grab tickets for Chen Li’s Beijing concert on Jan 30, 2027',
    },
  },
  {
    id: 'fitness-wellness',
    emoji: '💪',
    text: {
      'zh-CN': '准备开始健身，顺便养生吃补剂',
      'en': 'Starting a workout routine alongside wellness habits and daily supplements',
    },
  },
  {
    id: 'winter-turtle',
    emoji: '🐢',
    text: {
      'zh-CN': '在研究冬天有暖气的情况下怎么饲养乌龟',
      'en': 'Researching how to care for a pet turtle indoors with winter heating',
    },
  },
]

export const recentBooks: readonly MediaItem[] = [
  {
    id: 'thinking-fast-and-slow',
    kind: 'book',
    title: {
      'zh-CN': '思考，快与慢',
      'en': 'Thinking, Fast and Slow',
    },
    cover: '/about/thinking-fast-and-slow.webp',
    coverAlt: {
      'zh-CN': '《思考，快与慢》书籍封面',
      'en': 'Thinking, Fast and Slow book cover',
    },
    rating: 5,
    status: {
      'zh-CN': '已读',
      'en': 'Read',
    },
    note: {
      'zh-CN': '丹尼尔·卡尼曼的行为经济学经典，用“系统 1”的直觉快思考与“系统 2”的理性慢思考拆解人类判断与认知偏误，常读常新。',
      'en': 'Daniel Kahneman’s classic on fast intuition vs. slow reasoning—a sharp map of cognitive biases and judgment.',
    },
    href: 'https://openlibrary.org/works/OL15992072W/Thinking,_Fast_and_Slow',
  },
  {
    id: 'almanack-of-naval-ravikant',
    kind: 'book',
    title: {
      'zh-CN': '纳瓦尔宝典',
      'en': 'The Almanack of Naval Ravikant',
    },
    cover: '/about/almanack-of-naval-ravikant.webp',
    coverAlt: {
      'zh-CN': '《纳瓦尔宝典》书籍封面',
      'en': 'The Almanack of Naval Ravikant book cover',
    },
    rating: 4.5,
    status: {
      'zh-CN': '在读',
      'en': 'Reading',
    },
    note: {
      'zh-CN': '收录硅谷投资人纳瓦尔关于财富创造与人生幸福的思考笔记，围绕杠杆、专长与长期复利娓娓道来，适合放案头随时翻几页。',
      'en': 'Naval Ravikant’s distilled notes on wealth, leverage, and happiness—a clear handbook worth dipping into anytime.',
    },
    href: 'https://www.navalmanack.com/',
  },
]

export const recentGames: readonly MediaItem[] = [
  {
    id: 'phantom-blade-zero',
    kind: 'game',
    title: {
      'zh-CN': '影之刃零',
      'en': 'Phantom Blade Zero',
    },
    cover: '/about/phantom-blade-zero.webp',
    coverAlt: {
      'zh-CN': '《影之刃零》游戏封面',
      'en': 'Phantom Blade Zero game cover',
    },
    rating: 5,
    status: {
      'zh-CN': '已通关',
      'en': 'Finished',
    },
    note: {
      'zh-CN': '灵游坊打造的暗黑武侠动作游戏，高速冷兵器连招与拆招手感极佳，功夫朋克氛围拉满。刚刚通关主线，打得非常过瘾。',
      'en': 'Dark Wuxia action RPG by S-GAME with sharp blade combos and Kungfupunk flair. Just finished the story—so good.',
    },
    href: 'https://store.steampowered.com/app/4115450/Phantom_Blade_Zero/',
  },
  {
    id: 'probably-stolen',
    kind: 'game',
    title: {
      'zh-CN': '深空当铺',
      'en': 'Probably Stolen',
    },
    cover: '/about/probably-stolen.webp',
    coverAlt: {
      'zh-CN': '《深空当铺：可能是偷的》游戏封面',
      'en': 'Probably Stolen game cover',
    },
    rating: 4,
    status: {
      'zh-CN': '在玩',
      'en': 'Playing',
    },
    note: {
      'zh-CN': '反乌托邦空间站背景的赛博朋克当铺模拟经营。一边鉴定议价、倒卖来路不明的货物，一边在各路势力与高额房租间周旋，上头又耐玩。',
      'en': 'Cyberpunk pawnshop sim on a gritty space station. Haggling over shady goods amidst rival factions is addictive.',
    },
    href: 'https://store.steampowered.com/app/4348910/Probably_Stolen_Cyberpunk_Shopkeeper_Sim/',
  },
]
