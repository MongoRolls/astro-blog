import type { CollectionEntry } from 'astro:content'
import type { Locale } from '../i18n/config'
import { getCollection } from 'astro:content'
import { alternateLocale, defaultLocale, localizedPath } from '../i18n/config'
import { slugify } from './common-utils'

const TAG_TONE_COUNT = 5

export interface PostTagBadge {
  name: string
  id: string
  tone: number
}

function getTagTone(tagId: string) {
  let hash = 0
  for (const char of tagId) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 2147483647
  }
  return hash % TAG_TONE_COUNT
}

export function getPostTagBadges(rawTags?: string[]): PostTagBadge[] {
  const seen = new Set<string>()
  const tags: PostTagBadge[] = []

  for (const rawTag of rawTags ?? []) {
    if (!rawTag)
      continue
    const id = slugify(rawTag)
    if (!id || seen.has(id))
      continue
    seen.add(id)
    tags.push({ name: rawTag, id, tone: getTagTone(id) })
  }

  return tags
}

export function getRelatedPosts(
  currentPost: CollectionEntry<'blog'>,
  allPosts: CollectionEntry<'blog'>[],
  limit = 5,
): CollectionEntry<'blog'>[] {
  const currentTagIds = new Set(getPostTagBadges(currentPost.data.tags).map(tag => tag.id))
  const candidates = allPosts.filter(candidate => candidate.id !== currentPost.id)

  const scored = candidates.map((candidate) => {
    const candidateTags = getPostTagBadges(candidate.data.tags)
    let overlap = 0
    for (const tag of candidateTags) {
      if (currentTagIds.has(tag.id))
        overlap += 1
    }
    return { post: candidate, overlap }
  })

  const matched = scored
    .filter(item => item.overlap > 0)
    .toSorted((a, b) => b.overlap - a.overlap || sortItemsByDateDesc(a.post, b.post))
    .map(item => item.post)

  if (matched.length >= limit)
    return matched.slice(0, limit)

  const matchedIds = new Set(matched.map(item => item.id))
  const fallback = candidates.filter(candidate => !matchedIds.has(candidate.id))
  return [...matched, ...fallback].slice(0, limit)
}

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

export async function getBlogPostStaticPaths(locale: Locale) {
  const now = new Date()
  const [posts, translatedPosts] = await Promise.all([
    getPublishedBlogPosts(locale, now),
    getPublishedBlogPosts(alternateLocale(locale), now),
  ])
  const translations = new Map(translatedPosts.map(post => [getPostTranslationKey(post), post]))
  const postCount = posts.length

  return posts.map((post, index) => ({
    params: { id: getPostSlug(post) },
    props: {
      post,
      translation: translations.get(getPostTranslationKey(post)) ?? null,
      prevPost: index + 1 !== postCount ? posts[index + 1] : null,
      nextPost: index !== 0 ? posts[index - 1] : null,
      relatedPosts: getRelatedPosts(post, posts, 5),
      randomPostUrls: posts.filter(item => item.id !== post.id).map(getPostUrl),
    },
  }))
}

export async function getContentPageStaticPaths(locale: Locale) {
  const [pages, translatedPages] = await Promise.all([
    getPublishedPages(locale),
    getPublishedPages(alternateLocale(locale)),
  ])
  const translations = new Map(translatedPages.map(page => [getPageTranslationKey(page), page]))
  return pages.map(page => ({
    params: { id: getPageSlug(page) },
    props: { page, translation: translations.get(getPageTranslationKey(page)) ?? null },
  }))
}
