/**
 * 巡检已发布博客文章的封面图与本地暂存图片是否符合规范：
 *   pnpm cover:audit [--strict]
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const TARGET_WIDTH = 1200
const TARGET_HEIGHT = 630
const MAX_BYTES = 150 * 1024

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const blogDirectory = path.join(rootDirectory, 'src/content/blog')
const stagedBlogDirectory = path.join(rootDirectory, 'public/blog')
const strict = process.argv.includes('--strict')

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(fullPath) : [fullPath]
  }))
  return files.flat().sort()
}

function unquote(value = '') {
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\'')))
    return trimmed.slice(1, -1).trim()
  return trimmed
}

function parseFrontmatter(content) {
  const lines = content.split(/\r?\n/)
  if (lines[0]?.trim() !== '---')
    return {}
  const endIndex = lines.indexOf('---', 1)
  if (endIndex === -1)
    return {}
  const fmLines = lines.slice(1, endIndex)

  const fields = {
    title: '',
    draft: false,
    lang: 'zh-CN',
    slug: '',
    route: '',
    translationKey: '',
    image: '',
    seoImageSrc: '',
    seoImageAlt: '',
  }

  let section = ''
  let subSection = ''

  for (const line of fmLines) {
    if (!line.trim() || line.trim().startsWith('#'))
      continue
    const indent = line.length - line.trimStart().length
    const trimmed = line.trim()
    const colon = trimmed.indexOf(':')
    if (colon <= 0)
      continue
    const key = trimmed.slice(0, colon).trim()
    const value = unquote(trimmed.slice(colon + 1))

    if (indent === 0) {
      section = key
      subSection = ''
      if (key === 'title')
        fields.title = value
      else if (key === 'draft')
        fields.draft = value === 'true'
      else if (key === 'lang' && value)
        fields.lang = value
      else if (key === 'slug')
        fields.slug = value
      else if (key === 'route')
        fields.route = value
      else if (key === 'translationKey')
        fields.translationKey = value
      else if (key === 'image')
        fields.image = value
    }
    else if (section === 'seo' && indent === 2) {
      subSection = key
    }
    else if (section === 'seo' && subSection === 'image' && indent >= 4) {
      if (key === 'src')
        fields.seoImageSrc = value
      else if (key === 'alt')
        fields.seoImageAlt = value
    }
  }

  return fields
}

function normalizeCoverForCompare(src) {
  return src.replace(/^https:\/\/mongorolls-images\.oss-cn-shenzhen\.aliyuncs\.com\/blog\//, '')
}

async function auditPosts() {
  const files = (await walk(blogDirectory)).filter(file => /\.(?:md|mdx)$/.test(file))
  const posts = []

  for (const file of files) {
    const content = await readFile(file, 'utf8')
    const meta = parseFrontmatter(content)
    if (meta.draft)
      continue
    const rel = path.relative(blogDirectory, file)
    const basename = path.basename(file).replace(/\.(?:md|mdx)$/, '')
    const slug = meta.route || meta.slug || basename
    const translationKey = meta.translationKey || slug
    posts.push({
      file: rel,
      basename,
      translationKey,
      lang: meta.lang,
      title: meta.title,
      coverSrc: meta.seoImageSrc || meta.image,
      coverAlt: meta.seoImageAlt,
      usesLegacyTopImage: !meta.seoImageSrc && Boolean(meta.image),
    })
  }

  const errors = []
  const warnings = []
  const byCover = new Map()
  const byTranslation = new Map()

  for (const post of posts) {
    const group = byTranslation.get(post.translationKey) ?? []
    group.push(post)
    byTranslation.set(post.translationKey, group)

    if (!post.coverSrc) {
      warnings.push(`缺少封面: ${post.file}`)
      continue
    }

    if (post.coverSrc.includes('imageplaceholder'))
      errors.push(`禁止写入占位图: ${post.file} -> ${post.coverSrc}`)

    if (post.coverSrc.includes('public/blog'))
      errors.push(`禁止引用本地 public/blog 路径: ${post.file} -> ${post.coverSrc}`)

    if (post.coverSrc.includes('/img/'))
      warnings.push(`仍使用旧 /img/ 路径: ${post.file} -> ${post.coverSrc}`)

    if (!post.coverAlt)
      errors.push(`缺少 seo.image.alt: ${post.file}`)

    if (post.usesLegacyTopImage)
      warnings.push(`建议改用 seo.image 字段: ${post.file}`)

    const normalized = normalizeCoverForCompare(post.coverSrc)
    const owners = byCover.get(normalized) ?? new Set()
    owners.add(post.translationKey)
    byCover.set(normalized, owners)
  }

  for (const [cover, keys] of byCover.entries()) {
    if (keys.size > 1)
      errors.push(`多篇独立文章重复共用同一封面 (${cover}): ${[...keys].join(', ')}`)
  }

  for (const [key, pair] of byTranslation.entries()) {
    if (pair.length < 2)
      continue
    const covers = new Set(pair.map(item => normalizeCoverForCompare(item.coverSrc)))
    if (covers.size > 1)
      errors.push(`双语文章封面不一致 (${key}): ${pair.map(item => `${item.file}=${item.coverSrc || '无'}`).join(' | ')}`)
  }

  return { posts, errors, warnings }
}

async function auditStagedCovers() {
  const files = (await walk(stagedBlogDirectory)).filter(file => /cover.*\.webp$/i.test(file))
  const ogDefault = path.join(rootDirectory, 'public/cover-images/og-default.webp')
  const targets = [...files, ogDefault]
  const errors = []
  const checked = []

  for (const file of targets) {
    try {
      const metadata = await sharp(file).metadata()
      const size = (await readFile(file)).length
      const rel = path.relative(rootDirectory, file)
      checked.push({ rel, width: metadata.width, height: metadata.height, size })
      if (metadata.width !== TARGET_WIDTH || metadata.height !== TARGET_HEIGHT)
        errors.push(`尺寸不合规 (${metadata.width}x${metadata.height} ≠ ${TARGET_WIDTH}x${TARGET_HEIGHT}): ${rel}`)
      if (size > MAX_BYTES)
        errors.push(`体积超限 (${(size / 1024).toFixed(1)} KB > 150 KB): ${rel}`)
    }
    catch {
      if (file === ogDefault)
        errors.push('缺少站点默认 OG 图: public/cover-images/og-default.webp')
    }
  }

  return { checked, errors }
}

async function main() {
  const postAudit = await auditPosts()
  const stagedAudit = await auditStagedCovers()

  const errors = [...postAudit.errors, ...stagedAudit.errors]
  const warnings = [...postAudit.warnings]

  const coveredCount = postAudit.posts.filter(post => Boolean(post.coverSrc)).length
  console.log(`已发布文章封面巡检：${coveredCount}/${postAudit.posts.length} 篇已配置封面（含中英文）`)
  console.log(`本地已校验 WebP 封面：${stagedAudit.checked.length} 张`)

  if (warnings.length > 0) {
    console.log('\n提示 / 待优化项：')
    for (const warning of warnings)
      console.log(`  [WARN] ${warning}`)
  }

  if (errors.length > 0) {
    console.log('\n不合规项：')
    for (const error of errors)
      console.log(`  [ERR]  ${error}`)
  }

  if (errors.length > 0 || (strict && warnings.length > 0))
    process.exitCode = 1
  else
    console.log('\n封面规范巡检通过。')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
