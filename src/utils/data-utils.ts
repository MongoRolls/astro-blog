import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'
import { slugify } from './common-utils'

export function sortItemsByDateDesc(itemA: CollectionEntry<'blog'>, itemB: CollectionEntry<'blog'>) {
  return new Date(itemB.data.publishDate).getTime() - new Date(itemA.data.publishDate).getTime()
}

export function isPublishedPost(post: CollectionEntry<'blog'>, now = new Date()) {
  return !post.data.draft && post.data.publishDate.getTime() <= now.getTime()
}

export async function getPublishedBlogPosts(now = new Date()) {
  const posts = await getCollection('blog', post => isPublishedPost(post, now))
  return posts.sort(sortItemsByDateDesc)
}

export function getAllTags(posts: CollectionEntry<'blog'>[]) {
  const tagsById = new Map<string, { name: string, id: string, value: number }>()

  for (const post of posts) {
    const seen = new Set<string>()
    for (const tag of post.data.tags ?? []) {
      if (!tag)
        continue
      const id = slugify(tag)
      if (!id || seen.has(id))
        continue
      seen.add(id)
      const existing = tagsById.get(id)
      if (existing)
        existing.value += 1
      else
        tagsById.set(id, { name: tag, id, value: 1 })
    }
  }

  return [...tagsById.values()]
}

export function getPostsByTag(posts: CollectionEntry<'blog'>[], tagId: string) {
  return posts.filter(post => (post.data.tags ?? []).some(tag => slugify(tag) === tagId))
}
