import { getCollection } from 'astro:content'
import { getPublishedBlogPosts } from '../utils/data-utils'

export async function GET() {
  const [posts, pages] = await Promise.all([
    getPublishedBlogPosts(),
    getCollection('pages', page => !page.data.draft),
  ])
  const index = [
    ...posts.map(post => ({
      excerpt: post.data.excerpt ?? post.data.description ?? '',
      meta: { title: post.data.title },
      searchText: post.body,
      url: `/blog/${post.id}/`,
    })),
    ...pages.map(page => ({
      excerpt: page.data.seo?.description ?? '',
      meta: { title: page.data.seo?.title ?? page.data.title },
      searchText: page.body,
      url: `/${page.id}/`,
    })),
  ]

  return Response.json(index, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
