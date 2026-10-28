import type { CollectionEntry } from 'astro:content'
import type { Locale } from '../i18n/config'
import siteConfig from '../data/site-config'
import { localizedPath } from '../i18n/config'
import { getPostUrl } from './data-utils'

type Post = CollectionEntry<'blog'>

const fencePattern = /^\s*(`{3,}|~{3,})/
const esmPattern = /^(?:import|export)\s/
const headingPattern = /^(#{1,5})(?=\s)/

const labels = {
  'zh-CN': {
    author: '作者',
    published: '发布于',
    updated: '更新于',
    tags: '标签',
    canonical: '原文',
    translation: 'English version',
    index: '全部文章',
  },
  'en': {
    author: 'Author',
    published: 'Published',
    updated: 'Updated',
    tags: 'Tags',
    canonical: 'HTML',
    translation: '中文版本',
    index: 'All posts',
  },
} as const satisfies Record<Locale, Record<string, string>>

export function getPostMarkdownUrl(post: Post) {
  return getPostUrl(post).replace(/\/$/, '.md')
}

export function getPostSummary(post: Post) {
  return post.data.seo?.description ?? post.data.excerpt ?? post.data.description
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

/**
 * 将 MDX 正文转换为可独立阅读的 Markdown：移除 ESM 语句、把站内根路径链接补全为绝对地址，
 * 并按需整体下调标题层级。代码块内的内容保持原样。
 */
function toPortableMarkdown(body: string, siteUrl: URL, headingOffset = 0) {
  const output: string[] = []
  let fence: string | undefined
  let inImportBlock = false

  for (const line of body.split('\n')) {
    const fenceMarker = line.match(fencePattern)?.[1]
    if (fence) {
      output.push(line)
      if (fenceMarker && fenceMarker[0] === fence[0] && fenceMarker.length >= fence.length)
        fence = undefined
      continue
    }
    if (fenceMarker) {
      fence = fenceMarker
      output.push(line)
      continue
    }

    if (inImportBlock) {
      inImportBlock = !/\}\s*from\s*['"]/.test(line)
      continue
    }
    if (esmPattern.test(line)) {
      inImportBlock = /^import\s*\{[^}]*$/.test(line)
      continue
    }

    let transformed = line
      .replaceAll(/\]\((\/(?!\/)[^)\s]*)/g, (_, pathname: string) => `](${new URL(pathname, siteUrl)}`)
      .replaceAll(/(src|href)="(\/(?!\/)[^"]*)"/g, (_, attribute: string, pathname: string) => `${attribute}="${new URL(pathname, siteUrl)}"`)
    if (headingOffset > 0)
      transformed = transformed.replace(headingPattern, hashes => `${hashes}${'#'.repeat(headingOffset)}`)
    output.push(transformed)
  }

  return output.join('\n').replaceAll(/\n{3,}/g, '\n\n').trim()
}

export function renderPostMarkdown(post: Post, options: {
  siteUrl: URL
  translation?: Post | null
  headingLevel?: 1 | 2
}) {
  const { siteUrl, translation, headingLevel = 1 } = options
  const locale = post.data.lang
  const t = labels[locale]
  const absoluteUrl = (pathname: string) => new URL(pathname, siteUrl).toString()
  const { title, author, publishDate, updatedDate, tags } = post.data
  const summary = getPostSummary(post)

  const metadata = [
    `- ${t.author}: ${author}`,
    `- ${t.published}: ${formatDate(publishDate)}`,
    updatedDate ? `- ${t.updated}: ${formatDate(updatedDate)}` : undefined,
    tags.length > 0 ? `- ${t.tags}: ${tags.join(', ')}` : undefined,
    `- ${t.canonical}: ${absoluteUrl(getPostUrl(post))}`,
    translation ? `- ${t.translation}: ${absoluteUrl(getPostMarkdownUrl(translation))}` : undefined,
    `- ${t.index}: ${absoluteUrl(localizedPath(locale, '/llms.txt'))}`,
  ].filter(Boolean)

  return [
    `${'#'.repeat(headingLevel)} ${title}`,
    '',
    ...(summary ? [`> ${summary.replaceAll(/\s+/g, ' ').trim()}`, ''] : []),
    ...metadata,
    '',
    '---',
    '',
    toPortableMarkdown(post.body ?? '', siteUrl, headingLevel - 1),
    '',
  ].join('\n')
}

export function createPostMarkdownResponse(post: Post, translation: Post | null, site?: URL) {
  const siteUrl = site ?? new URL(siteConfig.website ?? 'https://mongorolls.cn')
  return new Response(renderPostMarkdown(post, { siteUrl, translation }), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
