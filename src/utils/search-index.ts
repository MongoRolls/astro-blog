import type { Locale } from '../i18n/config'
import { getPageUrl, getPostUrl, getPublishedBlogPosts, getPublishedPages } from './data-utils'

export async function buildSearchIndex(locale: Locale) {
  const [posts, pages] = await Promise.all([
    getPublishedBlogPosts(locale),
    getPublishedPages(locale),
  ])

  return [
    ...posts.map(post => ({
      excerpt: post.data.excerpt ?? post.data.description ?? '',
      meta: { title: post.data.title },
      searchText: post.body,
      url: getPostUrl(post),
    })),
    ...pages.map(page => ({
      excerpt: page.data.seo?.description ?? '',
      meta: { title: page.data.seo?.title ?? page.data.title },
      searchText: page.body,
      url: getPageUrl(page),
    })),
  ]
}
