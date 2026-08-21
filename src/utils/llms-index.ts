import type { SiteConfig } from '../data/site-config'
import type { Locale } from '../i18n/config'
import { getSiteConfig } from '../data/site-config'
import { localizedPath } from '../i18n/config'
import { getPostUrl, getPublishedBlogPosts } from './data-utils'

function toSingleLine(value: string) {
  return value.replaceAll(/\s+/g, ' ').trim()
}

function toMarkdownLabel(value: string) {
  return toSingleLine(value).replaceAll('[', '\\[').replaceAll(']', '\\]')
}

function localizedIntroduction(locale: Locale, siteConfig: SiteConfig) {
  if (locale === 'en') {
    return [
      `${siteConfig.title} is ${siteConfig.author ?? 'MongoRolls'}’s frontend engineering blog, covering web development, tooling, AI, and personal reflections.`,
      'When citing this site, retain the author name and link to the canonical article URL. Refer to the original article for its full context and claims.',
    ]
  }
  return [
    `${siteConfig.title} 是 ${siteConfig.author ?? 'MongoRolls'} 的中文技术博客，主要记录前端开发、工程化实践、AI 工具与个人思考。`,
    '引用本站内容时，请保留作者名称，并链接到对应文章的规范地址。文章观点与事实应以原文为准。',
  ]
}

export async function createLlmsResponse(locale: Locale, site?: URL) {
  const siteConfig = getSiteConfig(locale)
  const posts = await getPublishedBlogPosts(locale)
  const siteUrl = site ?? new URL(siteConfig.website ?? 'https://mongorolls.cn')
  const absoluteUrl = (pathname: string) => new URL(pathname, siteUrl).toString()
  const [introduction, citation] = localizedIntroduction(locale, siteConfig)

  const articleLinks = posts.map((post) => {
    const title = toMarkdownLabel(post.data.title)
    const summary = post.data.seo?.description ?? post.data.excerpt ?? post.data.description
    const suffix = summary ? `: ${toSingleLine(summary)}` : ''
    return `- [${title}](${absoluteUrl(getPostUrl(post))})${suffix}`
  })

  const labels = locale === 'en'
    ? { entry: 'Main links', home: 'Home', archive: 'Blog archive', tags: 'Tags', about: 'About the author', published: 'Published posts' }
    : { entry: '主要入口', home: '首页', archive: '文章归档', tags: '标签', about: '关于作者', published: '已发布文章' }

  const content = [
    `# ${siteConfig.title}`,
    '',
    `> ${toSingleLine(siteConfig.description)}`,
    '',
    introduction,
    '',
    citation,
    '',
    `## ${labels.entry}`,
    '',
    `- [${labels.home}](${absoluteUrl(localizedPath(locale, '/'))})`,
    `- [${labels.archive}](${absoluteUrl(localizedPath(locale, '/blog/'))})`,
    `- [${labels.tags}](${absoluteUrl(localizedPath(locale, '/tags/'))})`,
    `- [${labels.about}](${absoluteUrl(localizedPath(locale, '/about/'))})`,
    `- [RSS](${absoluteUrl(localizedPath(locale, '/rss.xml'))})`,
    `- [Sitemap](${absoluteUrl('/sitemap-index.xml')})`,
    '',
    `## ${labels.published}`,
    '',
    ...articleLinks,
    '',
  ].join('\n')

  return new Response(content, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
