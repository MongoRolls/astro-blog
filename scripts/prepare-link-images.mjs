/**
 * 可选：将指定页面的分享图固定在仓库中，优先于自动生成的缩略图。
 * pnpm link:image https://github.com/openai/codex https://www.typeless.com/
 */
import { randomUUID } from 'node:crypto'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { fetchLinkImage } from '../src/utils/fetch-link-image.mjs'
import { linkImageFilename } from '../src/utils/link-image-filename.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const imageDir = path.join(root, 'src/assets/link-previews')
const urls = process.argv.slice(2)
if (!urls.length)
  throw new Error('用法：pnpm link:image <公开网页的 HTTPS URL> […]')

await mkdir(imageDir, { recursive: true })

for (const href of urls) {
  try {
    const url = new URL(href)
    url.hash = ''
    const thumbnail = await fetchLinkImage(url)
    if (!thumbnail)
      throw new Error('页面没有可用的分享图')
    const destination = path.join(imageDir, linkImageFilename(url))
    const temporary = `${destination}.${randomUUID()}.tmp`
    try {
      await writeFile(temporary, thumbnail)
      await rename(temporary, destination)
    }
    finally {
      await rm(temporary, { force: true })
    }
    console.log(`${url.href} → ${path.relative(root, destination)}`)
  }
  catch (error) {
    console.warn(`${href}: ${error.message}`)
    process.exitCode = 1
  }
}
