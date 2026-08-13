import rss from '@astrojs/rss'
import siteConfig from '../data/site-config.ts'
import { getPublishedBlogPosts } from '../utils/data-utils.ts'

export async function GET(context) {
  const posts = await getPublishedBlogPosts()
  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site,
    customData: '<language>zh-CN</language>',
    items: posts.map(item => ({
      title: item.data.title,
      description: item.data.excerpt || item.data.description || '暂无描述',
      link: `/blog/${item.id}/`,
      pubDate: item.data.publishDate,
      author: item.data.author || siteConfig.author || 'MongoRolls',
    })),
  })
}
