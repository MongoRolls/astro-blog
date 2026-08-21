import type { CollectionEntry } from 'astro:content'
import type { Locale } from '../i18n/config'
import { getCollection } from 'astro:content'
import { defaultLocale, localizedPath } from '../i18n/config'
import { slugify } from './common-utils'

export function sortItemsByDateDesc(itemA: CollectionEntry<'blog'>, itemB: CollectionEntry<'blog'>) {
  return new Date(itemB.data.publishDate).getTime() - new Date(itemA.data.publishDate).getTime()
}

export function isPublishedPost(post: CollectionEntry<'blog'>, now = new Date()) {
  return !post.data.draft && post.data.publishDate.getTime() <= now.getTime()
}

export async function getPublishedBlogPosts(locale: Locale = defaultLocale, now = new Date()) {
  const posts = await getCollection('blog', post => isPublishedPost(post, now) && post.data.lang === locale)
  return posts.sort(sortItemsByDateDesc)
}

export async function getPublishedPages(locale: Locale = defaultLocale) {
  return getCollection('pages', page => !page.data.draft && page.data.lang === locale)
}

function entryBasename(id: string) {
  return id.split('/').at(-1) ?? id
}

export function getPostSlug(post: CollectionEntry<'blog'>) {
  return post.data.route ?? post.data.slug ?? entryBasename(post.id)
}

export function getPageSlug(page: CollectionEntry<'pages'>) {
  return page.data.route ?? page.data.slug ?? entryBasename(page.id)
}

export function getPostTranslationKey(post: CollectionEntry<'blog'>) {
  return post.data.translationKey ?? getPostSlug(post)
}

export function getPageTranslationKey(page: CollectionEntry<'pages'>) {
  return page.data.translationKey ?? getPageSlug(page)
}

export function getPostUrl(post: CollectionEntry<'blog'>) {
  return localizedPath(post.data.lang, `/blog/${getPostSlug(post)}/`)
}

export function getPageUrl(page: CollectionEntry<'pages'>) {
  return localizedPath(page.data.lang, `/${getPageSlug(page)}/`)
}

export async function getPostTranslation(post: CollectionEntry<'blog'>, locale: Locale) {
  const key = getPostTranslationKey(post)
  const posts = await getPublishedBlogPosts(locale)
  return posts.find(candidate => getPostTranslationKey(candidate) === key)
}

export async function getPageTranslation(page: CollectionEntry<'pages'>, locale: Locale) {
  const key = getPageTranslationKey(page)
  const pages = await getPublishedPages(locale)
  return pages.find(candidate => getPageTranslationKey(candidate) === key)
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
