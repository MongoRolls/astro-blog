/**
 * 按 .codex/AGENTS.md「图片与环境」把本地图片上传到 OSS：
 *   blog/{文章 id 或分类}/{文件名}
 *
 * 密钥写入根目录 .env 后：pnpm oss:sync:dry / pnpm oss:sync
 */
import { createHmac } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dryRun = process.argv.includes('--dry-run')
const force = process.argv.includes('--force')

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

await loadDotEnv(path.join(rootDirectory, '.env'))

const accessKeyId = process.env.OSS_ACCESS_KEY_ID
const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
if (!dryRun) {
  requiredEnv('OSS_ACCESS_KEY_ID', accessKeyId)
  requiredEnv('OSS_ACCESS_KEY_SECRET', accessKeySecret)
}
const bucket = process.env.OSS_BUCKET || 'mongorolls-images'
const region = process.env.OSS_REGION || 'oss-cn-shenzhen'
const projectPrefix = trimSlashes(process.env.OSS_PREFIX || 'blog')
const publicBase = `https://${bucket}.${region}.aliyuncs.com`

const stats = {
  uploaded: 0,
  skipped: 0,
  failed: 0,
}

const localUploads = await collectLocalUploads()

console.log(dryRun ? 'dry-run：只打印，不写入 OSS' : '开始同步 OSS')
console.log(`目标前缀 ${publicBase}/${projectPrefix}/{文章或分类}/{文件}`)

await uploadLocalAssets(localUploads)
if (dryRun)
  printPlannedUrls(localUploads)
else
  await verifyDestinations(localUploads)

if (stats.failed > 0)
  process.exitCode = 1

console.log(`完成：上传 ${stats.uploaded}，跳过 ${stats.skipped}，失败 ${stats.failed}`)

async function uploadLocalAssets(uploads) {
  console.log('\n上传本地文件')
  for (const item of uploads)
    await putObject(item.key, item.filePath, item.contentType)
}

function printPlannedUrls(uploads) {
  console.log('\ndry-run 计划地址：')
  for (const item of uploads)
    console.log(`  ${objectUrl(item.key)}`)
}

async function verifyDestinations(uploads) {
  console.log('\nHEAD 校验')
  for (const item of uploads) {
    const ok = await objectExists(item.key)
    const url = objectUrl(item.key)
    if (ok) {
      console.log(`  200  ${url}`)
    }
    else {
      console.log(`  404  ${url}`)
      stats.failed++
    }
  }
}

async function collectLocalUploads() {
  return [
    ...await collectDirectoryUploads(path.join(rootDirectory, 'public/cover-images'), ['cover-images']),
    ...await collectDirectoryUploads(path.join(rootDirectory, 'public/friends'), ['friends']),
    ...await collectDirectoryUploads(path.join(rootDirectory, 'public/tech'), ['tech']),
    ...await collectFileUpload(path.join(rootDirectory, 'public/logo.png'), ['site', 'logo.png']),
    ...await collectFileUpload(path.join(rootDirectory, 'public/favicon.ico'), ['site', 'favicon.ico']),
    ...await collectFileUpload(path.join(rootDirectory, 'src/assets/blog-cover.webp'), ['site', 'blog-cover.webp']),
    ...await collectLocalBlogUploads(),
  ]
}

async function collectLocalBlogUploads() {
  const blogRoot = path.join(rootDirectory, 'public/blog')
  const entries = await readdir(blogRoot, { withFileTypes: true }).catch(() => [])
  const uploads = []
  for (const entry of entries) {
    if (!entry.isDirectory())
      continue
    uploads.push(...await collectDirectoryUploads(path.join(blogRoot, entry.name), [entry.name]))
  }
  return uploads
}

async function collectDirectoryUploads(directory, keySegments) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
  const uploads = []
  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith('.'))
      continue
    const filePath = path.join(directory, entry.name)
    const ext = path.extname(entry.name).toLowerCase()
    if (!MIME_TYPES[ext])
      continue
    uploads.push({
      filePath,
      key: joinKey(projectPrefix, ...keySegments, sanitizeFileName(entry.name)),
      contentType: MIME_TYPES[ext],
    })
  }
  return uploads
}

async function collectFileUpload(filePath, keySegments) {
  try {
    await stat(filePath)
  }
  catch {
    return []
  }
  const ext = path.extname(filePath).toLowerCase()
  return [{
    filePath,
    key: joinKey(projectPrefix, ...keySegments),
    contentType: MIME_TYPES[ext] || 'application/octet-stream',
  }]
}

async function putObject(key, filePath, contentType) {
  if (dryRun) {
    console.log(`  upload ${path.relative(rootDirectory, filePath)} → ${key}`)
    stats.uploaded++
    return
  }
  if (!force && await objectExists(key)) {
    console.log(`  已存在，跳过 ${key}`)
    stats.skipped++
    return
  }
  const url = objectUrl(key)
  const body = await readFile(filePath)
  const response = await ossRequest({
    method: 'PUT',
    key,
    contentType,
    body,
    headers: {
      'x-oss-object-acl': 'public-read',
    },
  })
  if (response.ok) {
    console.log(`  uploaded ${url}`)
    stats.uploaded++
    return
  }
  console.log(`  上传失败 ${response.status} ${key}`)
  console.log(`    ${await response.text()}`)
  stats.failed++
}

async function objectExists(key) {
  const response = await ossRequest({ method: 'HEAD', key })
  return response.status === 200
}

async function ossRequest({ method, key, headers = {}, contentType = '', body }) {
  const date = new Date().toUTCString()
  const requestHeaders = {
    Date: date,
    ...headers,
  }
  if (contentType)
    requestHeaders['Content-Type'] = contentType

  const canonicalOssHeaders = Object.entries(requestHeaders)
    .filter(([name]) => name.toLowerCase().startsWith('x-oss-'))
    .map(([name, value]) => [name.toLowerCase(), String(value).trim()])
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}:${value}\n`)
    .join('')

  const resource = `/${bucket}/${key}`
  const stringToSign = `${method}\n\n${contentType}\n${date}\n${canonicalOssHeaders}${resource}`
  const signature = createHmac('sha1', accessKeySecret).update(stringToSign).digest('base64')
  requestHeaders.Authorization = `OSS ${accessKeyId}:${signature}`

  return fetch(objectUrl(key), { method, headers: requestHeaders, body })
}

function objectUrl(key) {
  return `${publicBase}/${encodePath(key)}`
}

function encodePath(key) {
  return key.split('/').map(encodeURIComponent).join('/')
}

function joinKey(...segments) {
  return segments.map(trimSlashes).filter(Boolean).join('/')
}

function trimSlashes(value) {
  return String(value).replace(/^\/+|\/+$/g, '')
}

function sanitizeFileName(name) {
  return name.replace(/\s+/g, '-')
}

function requiredEnv(name, value) {
  if (value)
    return value
  throw new Error(`${name} 未设置。规范见 .codex/AGENTS.md「图片与环境」，密钥写入仓库根目录 .env`)
}

async function loadDotEnv(filePath) {
  let content
  try {
    content = await readFile(filePath, 'utf8')
  }
  catch {
    return
  }
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#'))
      continue
    const separator = line.indexOf('=')
    if (separator <= 0)
      continue
    const name = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\'')))
      value = value.slice(1, -1)
    if (process.env[name] === undefined)
      process.env[name] = value
  }
}
