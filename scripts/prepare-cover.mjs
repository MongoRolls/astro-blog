/**
 * 按博客封面图规范将本地图片标准化处理为 1200x630 WebP（≤ 150 KB）：
 *   pnpm cover:prepare <input-image> <content-id> [--name cover.webp] [--quality 84] [--site-og]
 *
 * 默认输出到 public/blog/{content-id}/cover.webp（供 pnpm oss:sync 上传到 blog/{content-id}/cover.webp）。
 * 使用 --site-og 时输出到 public/cover-images/og-default.webp。
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const TARGET_WIDTH = 1200
const TARGET_HEIGHT = 630
const MAX_BYTES = 150 * 1024
const QUALITY_FALLBACKS = [84, 78, 72, 66, 60]

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function parseArgs(argv) {
  const positionals = []
  let name = 'cover.webp'
  let quality = 84
  let siteOg = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--site-og') {
      siteOg = true
    }
    else if (arg === '--name') {
      name = argv[++i] || name
    }
    else if (arg === '--quality') {
      quality = Number.parseInt(argv[++i] || '84', 10)
    }
    else if (arg === '-h' || arg === '--help') {
      printUsage()
      process.exit(0)
    }
    else {
      positionals.push(arg)
    }
  }

  return {
    input: positionals[0],
    contentId: positionals[1],
    name,
    quality: Number.isFinite(quality) ? Math.min(95, Math.max(40, quality)) : 84,
    siteOg,
  }
}

function printUsage() {
  console.log(`用法：
  pnpm cover:prepare <本地图片路径> <content-id> [--name cover.webp] [--quality 84]
  pnpm cover:prepare <本地图片路径> --site-og [--quality 84]

示例：
  pnpm cover:prepare ~/Downloads/raw.png 26-08-21-ai-text-watermarking
  pnpm cover:prepare ~/Downloads/og.png --site-og`)
}

async function encodeWebpUnderBudget(inputPath, startQuality) {
  const candidates = [startQuality, ...QUALITY_FALLBACKS.filter(q => q < startQuality)]
  let lastResult = null

  for (const q of candidates) {
    const buffer = await sharp(inputPath)
      .rotate()
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: 'cover',
        position: 'centre',
      })
      .toColorspace('srgb')
      .webp({ quality: q, effort: 6 })
      .toBuffer()

    lastResult = { buffer, quality: q }
    if (buffer.length <= MAX_BYTES)
      return lastResult
  }

  return lastResult
}

async function main() {
  const { input, contentId, name, quality, siteOg } = parseArgs(process.argv.slice(2))

  if (!input || (!siteOg && !contentId)) {
    printUsage()
    process.exitCode = 1
    return
  }

  const resolvedInput = path.resolve(input)
  const outputPath = siteOg
    ? path.join(rootDirectory, 'public/cover-images/og-default.webp')
    : path.join(rootDirectory, 'public/blog', contentId, name)

  const result = await encodeWebpUnderBudget(resolvedInput, quality)
  if (!result)
    throw new Error('图片编码失败')

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, result.buffer)

  const kb = (result.buffer.length / 1024).toFixed(1)
  const relOut = path.relative(rootDirectory, outputPath)
  const status = result.buffer.length <= MAX_BYTES ? 'OK' : 'WARN(>150KB)'
  console.log(`[${status}] ${relOut} (${TARGET_WIDTH}x${TARGET_HEIGHT}, q=${result.quality}, ${kb} KB)`)

  if (!siteOg) {
    console.log(`  OSS key : blog/${contentId}/${name}`)
    console.log(`  frontmatter seo.image.src: '${contentId}/${name}'`)
  }
  else {
    console.log('  OSS key : blog/cover-images/og-default.webp')
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
