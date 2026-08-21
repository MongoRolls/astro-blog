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
]

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

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, 'utf8')
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

console.log(`Smoke check passed: ${htmlFiles.length} HTML files, ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
