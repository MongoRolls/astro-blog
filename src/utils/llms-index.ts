import type { SiteConfig } from '../data/site-config'
import type { Locale } from '../i18n/config'
import { getSiteConfig } from '../data/site-config'
import { alternateLocale, localizedPath } from '../i18n/config'
import { getPostTranslationKey, getPostUrl, getPublishedBlogPosts } from './data-utils'
import { getPostMarkdownUrl, getPostSummary, renderPostMarkdown } from './post-markdown'

function toSingleLine(value: string) {
  return value.replaceAll(/\s+/g, ' ').trim()
}

function toMarkdownLabel(value: string) {
  return toSingleLine(value).replaceAll('[', '\\[').replaceAll(']', '\\]')
}

function localizedIntroduction(locale: Locale, siteConfig: SiteConfig) {
  if (locale === 'en') {
    return [
      `This is the frontend engineering blog of ${siteConfig.author ?? 'MongoRolls'}, covering web development, tooling, AI, and personal reflections.`,
      'When citing this site, retain the author name and link to the canonical article URL. Refer to the original article for its full context and claims.',
    ]
  }
  return [
    `本站是 ${siteConfig.author ?? 'MongoRolls'} 的中文技术博客，主要记录前端开发、工程化实践、AI 工具与个人思考。`,
    '引用本站内容时，请保留作者名称，并链接到对应文章的规范地址。文章观点与事实应以原文为准。',
  ]
}

function localizedAbout(locale: Locale, siteConfig: SiteConfig) {
  const author = siteConfig.author ?? 'MongoRolls'
  if (locale === 'en') {
    return [
      `${author} is a frontend engineer currently working at NetEase, interested in web tooling, open source, and writing.`,
      'The site is built with Astro, MDX, TypeScript, and Tailwind CSS, uses Pagefind for search and Twikoo (backed by MongoDB) for comments, and is deployed on Vercel. Posts are published in Chinese, with English translations for many of them.',
    ]
  }
  return [
    `${author} 是一名前端工程师，目前就职于网易，关注工程化、开源与个人写作。`,
    '本站基于 Astro、MDX、TypeScript 与 Tailwind CSS 构建，使用 Pagefind 提供站内搜索、Twikoo（MongoDB 存储）提供评论，部署在 Vercel；文章以中文为主，部分提供英文译文。',
  ]
}

const labels = {
  'zh-CN': {
    entry: '主要入口',
    home: '首页',
    posts: '全部文章',
    archive: '文章归档',
    tags: '标签',
    about: '关于作者',
    published: '已发布文章',
    aboutSection: '关于',
    full: '全文版（llms-full.txt）',
    otherLanguage: 'English version (llms.txt)',
    fullIntro: (count: number) => `本文件收录全部 ${count} 篇已发布中文文章的全文，按发布时间倒序排列。摘要索引见`,
  },
  'en': {
    entry: 'Main links',
    home: 'Home',
    posts: 'All posts',
    archive: 'Blog archive',
    tags: 'Tags',
    about: 'About the author',
    published: 'Published posts',
    aboutSection: 'About',
    full: 'Full text (llms-full.txt)',
    otherLanguage: '中文版本 (llms.txt)',
    fullIntro: (count: number) => `This file contains the full text of all ${count} published English posts, newest first. For the summary index, see`,
  },
} as const

function createContext(locale: Locale, site?: URL) {
  const siteConfig = getSiteConfig(locale)
  const siteUrl = site ?? new URL(siteConfig.website ?? 'https://mongorolls.cn')
  const absoluteUrl = (pathname: string) => new URL(pathname, siteUrl).toString()
  const githubUrl = siteConfig.socialLinks?.find(link => link.text === 'github')?.href
  return { siteConfig, siteUrl, absoluteUrl, githubUrl, t: labels[locale] }
}

function textResponse(content: string) {
  return new Response(content, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function createLlmsResponse(locale: Locale, site?: URL) {
  const { siteConfig, absoluteUrl, githubUrl, t } = createContext(locale, site)
  const posts = await getPublishedBlogPosts(locale)
  const [introduction, citation] = localizedIntroduction(locale, siteConfig)

  const articleLinks = posts.map((post) => {
    const title = toMarkdownLabel(post.data.title)
    const summary = getPostSummary(post)
    const suffix = summary ? `: ${toSingleLine(summary)}` : ''
    return `- [${title}](${absoluteUrl(getPostUrl(post))}) ([Markdown](${absoluteUrl(getPostMarkdownUrl(post))}))${suffix}`
  })

  const content = [
    `# ${siteConfig.title}`,
    '',
    `> ${toSingleLine(siteConfig.description)}`,
    '',
    introduction,
    '',
    citation,
    '',
    `## ${t.entry}`,
    '',
    `- [${t.home}](${absoluteUrl(localizedPath(locale, '/'))})`,
    `- [${t.posts}](${absoluteUrl(localizedPath(locale, '/post/'))})`,
    `- [${t.archive}](${absoluteUrl(localizedPath(locale, '/blog/'))})`,
    `- [${t.tags}](${absoluteUrl(localizedPath(locale, '/tags/'))})`,
    `- [${t.about}](${absoluteUrl(localizedPath(locale, '/about/'))})`,
    ...(githubUrl ? [`- [GitHub](${githubUrl})`] : []),
    `- [RSS](${absoluteUrl(localizedPath(locale, '/rss.xml'))})`,
    `- [Sitemap](${absoluteUrl('/sitemap-index.xml')})`,
    '',
    `## ${t.published}`,
    '',
    ...articleLinks,
    '',
    `## ${t.aboutSection}`,
    '',
    localizedAbout(locale, siteConfig).join('\n\n'),
    '',
    '## Optional',
    '',
    `- [${t.full}](${absoluteUrl(localizedPath(locale, '/llms-full.txt'))})`,
    `- [${t.otherLanguage}](${absoluteUrl(localizedPath(alternateLocale(locale), '/llms.txt'))})`,
    '',
  ].join('\n')

  return textResponse(content)
}

export async function createLlmsFullResponse(locale: Locale, site?: URL) {
  const { siteConfig, siteUrl, absoluteUrl, githubUrl, t } = createContext(locale, site)
  const [posts, translatedPosts] = await Promise.all([
    getPublishedBlogPosts(locale),
    getPublishedBlogPosts(alternateLocale(locale)),
  ])
  const translations = new Map(translatedPosts.map(post => [getPostTranslationKey(post), post]))
  const [introduction, citation] = localizedIntroduction(locale, siteConfig)

  const articles = posts.map(post => renderPostMarkdown(post, {
    siteUrl,
    translation: translations.get(getPostTranslationKey(post)) ?? null,
    headingLevel: 2,
  }).trim())

  const content = [
    `# ${siteConfig.title}`,
    '',
    `> ${toSingleLine(siteConfig.description)}`,
    '',
    introduction,
    '',
    citation,
    '',
    `## ${t.aboutSection}`,
    '',
    localizedAbout(locale, siteConfig).join('\n\n'),
    '',
    `- [${t.home}](${absoluteUrl(localizedPath(locale, '/'))})`,
    `- [${t.about}](${absoluteUrl(localizedPath(locale, '/about/'))})`,
    ...(githubUrl ? [`- [GitHub](${githubUrl})`] : []),
    `- [RSS](${absoluteUrl(localizedPath(locale, '/rss.xml'))})`,
    '',
    `${t.fullIntro(posts.length)} ${absoluteUrl(localizedPath(locale, '/llms.txt'))}`,
    '',
    '---',
    '',
    articles.join('\n\n---\n\n'),
    '',
  ].join('\n')

  return textResponse(content)
}
