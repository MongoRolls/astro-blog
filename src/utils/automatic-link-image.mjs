import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { fetchLinkImage } from './fetch-link-image.mjs'
import { linkImageFilename } from './link-image-filename.mjs'

const week = 7 * 24 * 60 * 60 * 1000
const pending = new Map()
const waiting = []
let working = 0

async function limited(work) {
  if (working < 6)
    working++
  else
    await new Promise(resolve => waiting.push(resolve))
  try {
    return await work()
  }
  finally {
    const next = waiting.shift()
    if (next)
      next()
    else
      working--
  }
}

async function cachedThumbnail(page, file) {
  let previous
  try {
    previous = await readFile(file)
    if (Date.now() - (await stat(file)).mtimeMs < week)
      return previous
  }
  catch (error) {
    if (error.code !== 'ENOENT')
      throw error
  }

  let thumbnail
  try {
    thumbnail = await fetchLinkImage(page)
  }
  catch {
    return previous
  }
  if (!thumbnail)
    return previous
  const temp = new URL(`${file.href}.${randomUUID()}.tmp`)
  try {
    await mkdir(new URL('.', file), { recursive: true })
    await writeFile(temp, thumbnail)
    await rename(temp, file)
  }
  finally {
    await rm(temp, { force: true })
  }
  return thumbnail
}

export async function automaticLinkImage(url, { cacheDir, outDir, dev }) {
  const page = new URL(url)
  page.hash = ''
  if (!['https:', 'http:'].includes(page.protocol) || page.username || page.password || page.port)
    return
  const name = linkImageFilename(page)
  const file = new URL(`link-previews/${name}`, cacheDir)
  const key = `${file.href}|${outDir}|${dev}`
  const existing = pending.get(key)
  if (existing && existing.expires > Date.now())
    return existing.result

  const result = limited(async () => {
    const image = await cachedThumbnail(page, file)
    if (!image)
      return
    if (dev)
      return `/@fs${file.pathname}`

    const hash = createHash('sha256').update(image).digest('hex').slice(0, 20)
    const filename = `${hash}.webp`
    const directory = new URL('link-previews/', outDir)
    await mkdir(directory, { recursive: true })
    await writeFile(new URL(filename, directory), image)
    return `/link-previews/${filename}`
  })
  // 同一 URL 的片段和不同语言共用一次请求；开发时失败也会自动重试。
  pending.set(key, { result, expires: Date.now() + (dev ? 10 * 60 * 1000 : Infinity) })
  return result
}
