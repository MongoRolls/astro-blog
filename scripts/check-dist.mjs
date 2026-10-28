import assert from 'node:assert/strict'
import { access, readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const distDirectory = path.resolve('dist')
const maximumDistSize = 10 * 1024 * 1024
const requiredFiles = [
  'index.html',
  'about/index.html',
  'blog/index.html',
  'post/index.html',
  'rss.xml',
  'sitemap-index.xml',
  'pagefind/pagefind.js',
  '404.html',
  'tags/index.html',
  'en/index.html',
  'en/about/index.html',
  'en/blog/index.html',
  'en/blog/26-08-21-ai-text-watermarking/index.html',
  'en/post/index.html',
  'en/tags/index.html',
  'en/style/index.html',
  'en/rss.xml',
  'en/llms.txt',
  'en/search-index.json',
  'robots.txt',
  'llms.txt',
  'llms-full.txt',
  'en/llms-full.txt',
  'blog/26-08-21-ai-text-watermarking.md',
  'en/blog/26-08-21-ai-text-watermarking.md',
]
const siteOrigin = 'https://mongorolls.cn'

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(entryPath) : [entryPath]
  }))
  return files.flat()
}

function resolvePublicReference(reference, decode = false) {
  const pathname = reference.split(/[?#]/, 1)[0]
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//'))
    return undefined

  const relativePath = decode ? decodeURIComponent(pathname.slice(1)) : pathname.slice(1)
  if (!relativePath)
    return path.join(distDirectory, 'index.html')
  if (path.extname(relativePath))
    return path.join(distDirectory, relativePath)
  return path.join(distDirectory, relativePath, 'index.html')
}

await Promise.all(requiredFiles.map(file => access(path.join(distDirectory, file))))

const files = await walk(distDirectory)
const totalSize = (await Promise.all(files.map(async file => (await stat(file)).size)))
  .reduce((sum, size) => sum + size, 0)

if (totalSize > maximumDistSize) {
  throw new Error(`dist 体积 ${(totalSize / 1024 / 1024).toFixed(2)} MB，超过 10 MB 预算`)
}

const htmlFiles = files.filter(file => file.endsWith('.html'))
const missingReferences = new Set()
let markdownAlternateCount = 0

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, 'utf8')
  for (const [, href] of html.matchAll(/<link rel="alternate" type="text\/markdown"[^>]*href="([^"]+)"/g)) {
    markdownAlternateCount++
    const target = href.startsWith(siteOrigin) ? resolvePublicReference(href.slice(siteOrigin.length), true) : undefined
    if (!target)
      missingReferences.add(`${path.relative(distDirectory, htmlFile)} -> ${href}`)
    else
      await access(target).catch(() => missingReferences.add(`${path.relative(distDirectory, htmlFile)} -> ${href}`))
  }
  const references = html.matchAll(/(?:href|src)=["']([^"']+)["']/g)
  for (const [, reference] of references) {
    const targets = [
      resolvePublicReference(reference),
      resolvePublicReference(reference, true),
    ].filter(Boolean)
    if (targets.length === 0)
      continue
    try {
      await Promise.any(targets.map(target => access(target)))
    }
    catch {
      missingReferences.add(`${path.relative(distDirectory, htmlFile)} -> ${reference}`)
    }
  }
}

if (missingReferences.size > 0) {
  throw new Error(`发现失效的站内链接或资源：\n${[...missingReferences].join('\n')}`)
}

const [chineseHome, englishHome, chinesePost, englishPost, chineseSearch, englishSearch, englishRss] = await Promise.all([
  readFile(path.join(distDirectory, 'index.html'), 'utf8'),
  readFile(path.join(distDirectory, 'en/index.html'), 'utf8'),
  readFile(path.join(distDirectory, 'blog/26-08-21-ai-text-watermarking/index.html'), 'utf8'),
  readFile(path.join(distDirectory, 'en/blog/26-08-21-ai-text-watermarking/index.html'), 'utf8'),
  readFile(path.join(distDirectory, 'search-index.json'), 'utf8').then(JSON.parse),
  readFile(path.join(distDirectory, 'en/search-index.json'), 'utf8').then(JSON.parse),
  readFile(path.join(distDirectory, 'en/rss.xml'), 'utf8'),
])

assert.match(chineseHome, /<html lang="zh-CN"/)
assert.match(englishHome, /<html lang="en"/)
assert.match(chineseHome, /hreflang="en" href="https:\/\/mongorolls\.cn\/en\/"/)
assert.match(englishHome, /hreflang="zh-CN" href="https:\/\/mongorolls\.cn\/"/)
assert.match(chinesePost, /hreflang="en" href="https:\/\/mongorolls\.cn\/en\/blog\/26-08-21-ai-text-watermarking\/"/)
assert.match(englishPost, /hreflang="zh-CN" href="https:\/\/mongorolls\.cn\/blog\/26-08-21-ai-text-watermarking\/"/)
assert.ok(chineseSearch.every(item => !item.url.startsWith('/en/')), '中文搜索索引混入英文 URL')
assert.ok(englishSearch.length > 0 && englishSearch.every(item => item.url.startsWith('/en/')), '英文搜索索引缺失或混入中文 URL')
assert.match(englishRss, /<language>en<\/language>/)

const [robots, chineseLlms, chineseLlmsFull, englishLlmsFull, chineseMarkdown, demoMarkdown] = await Promise.all([
  readFile(path.join(distDirectory, 'robots.txt'), 'utf8'),
  readFile(path.join(distDirectory, 'llms.txt'), 'utf8'),
  readFile(path.join(distDirectory, 'llms-full.txt'), 'utf8'),
  readFile(path.join(distDirectory, 'en/llms-full.txt'), 'utf8'),
  readFile(path.join(distDirectory, 'blog/26-08-21-ai-text-watermarking.md'), 'utf8'),
  readFile(path.join(distDirectory, 'blog/25-06-27-demo.md'), 'utf8'),
])
const markdownFiles = files.filter(file => file.endsWith('.md'))

assert.match(robots, /^Sitemap: https:\/\/mongorolls\.cn\/sitemap-index\.xml$/m)
assert.match(robots, /User-agent: OAI-SearchBot\n(?:User-agent: .+\n)*Allow: \//)
assert.match(robots, /User-agent: GPTBot\n(?:User-agent: .+\n)*Disallow: \/\n/)
assert.match(chinesePost, /<link rel="alternate" type="text\/markdown"[^>]*href="https:\/\/mongorolls\.cn\/blog\/26-08-21-ai-text-watermarking\.md"/)
assert.match(englishPost, /<link rel="alternate" type="text\/markdown"[^>]*href="https:\/\/mongorolls\.cn\/en\/blog\/26-08-21-ai-text-watermarking\.md"/)
assert.doesNotMatch(chineseHome, /type="text\/markdown"/, '非文章页不应声明 Markdown 版本')
assert.equal(markdownAlternateCount, markdownFiles.length, '文章 Markdown 版本数量与 head 声明不一致')
assert.match(chineseMarkdown, /^# AI 文本水印是怎么藏进普通文字里的\n/)
assert.match(chineseMarkdown, /https:\/\/mongorolls\.cn\/blog\/26-08-21-ai-text-watermarking\//)
assert.doesNotMatch(demoMarkdown, /^import /m, 'Markdown 版本残留 MDX import')
assert.match(chineseLlms, /\(https:\/\/mongorolls\.cn\/llms-full\.txt\)/)
assert.match(chineseLlmsFull, /^## AI 文本水印是怎么藏进普通文字里的$/m)
assert.match(englishLlmsFull, /^## How AI Text Watermarks Hide in Plain Text$/m)

console.log(`Smoke check passed: ${htmlFiles.length} HTML files, ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
