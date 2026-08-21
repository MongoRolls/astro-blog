import type { APIContext } from 'astro'
import type { Locale } from '../i18n/config'
import rss from '@astrojs/rss'
import { getSiteConfig } from '../data/site-config'
import { getPostUrl, getPublishedBlogPosts } from './data-utils'

export async function createRss(locale: Locale, context: APIContext) {
  const siteConfig = getSiteConfig(locale)
  const posts = await getPublishedBlogPosts(locale)

  return rss({
    title: `${siteConfig.title}${locale === 'en' ? ' — English' : ''}`,
    description: siteConfig.description,
    site: context.site ?? siteConfig.website ?? 'https://mongorolls.cn',
    customData: `<language>${siteConfig.language}</language>`,
    items: posts.map(item => ({
      title: item.data.title,
      description: item.data.excerpt || item.data.description || (locale === 'en' ? 'No description' : '暂无描述'),
      link: getPostUrl(item),
      pubDate: item.data.publishDate,
      author: item.data.author || siteConfig.author || 'MongoRolls',
    })),
  })
}
