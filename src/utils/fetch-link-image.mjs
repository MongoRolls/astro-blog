import { Buffer } from 'node:buffer'
import http from 'node:http'
import https from 'node:https'
import { useAgent } from 'request-filtering-agent'
import sharp from 'sharp'

// 所有跳转及 CDN 图片都走相同的连接级公网地址检查。
async function readResource(url, maxBytes, accept, signal, redirects = 0) {
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port)
    throw new Error('只读取标准端口上的公开网页和图片')
  const transport = url.protocol === 'https:' ? https : http
  const response = await new Promise((resolve, reject) => {
    const request = transport.get(url, {
      agent: useAgent(url.href),
      headers: { 'Accept': accept, 'Accept-Encoding': 'identity', 'User-Agent': 'AstroBlog-LinkPreview/1.0' },
      signal,
    }, resolve)
    request.on('error', reject)
  })
  try {
    if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location && redirects < 4)
      return readResource(new URL(response.headers.location, url), maxBytes, accept, signal, redirects + 1)
    if (response.statusCode !== 200)
      throw new Error(`HTTP ${response.statusCode}`)
    if (Number(response.headers['content-length']) > maxBytes)
      throw new Error('资源超过大小限制')
    const chunks = []
    let length = 0
    for await (const chunk of response) {
      length += chunk.length
      if (length > maxBytes)
        throw new Error('资源超过大小限制')
      chunks.push(chunk)
    }
    return { data: Buffer.concat(chunks), url }
  }
  finally {
    response.destroy()
  }
}

function socialImage(html) {
  const head = html.split(/<\/head\s*>/i, 1)[0].replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
  const images = new Map()
  for (const [tag] of head.matchAll(/<meta\s(?:[^>"']|"[^"]*"|'[^']*')+>/gi)) {
    const attributes = new Map()
    for (const [, name, double, single, unquoted] of tag.matchAll(/([^\s"'=<>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))
      attributes.set(name.toLowerCase(), double ?? single ?? unquoted)
    const kind = (attributes.get('property') || attributes.get('name'))?.toLowerCase()
    if (kind && !images.has(kind) && attributes.get('content'))
      images.set(kind, attributes.get('content').replaceAll('&amp;', '&'))
  }
  return images.get('og:image:secure_url') || images.get('og:image') || images.get('og:image:url') || images.get('twitter:image') || images.get('twitter:image:src')
}

export async function fetchLinkImage(url) {
  const signal = AbortSignal.timeout(8000)
  const page = await readResource(url, 3_000_000, 'text/html', signal)
  const source = socialImage(page.data.toString('utf8'))
  if (!source)
    return
  const { data } = await readResource(new URL(source, page.url), 6_000_000, 'image/*', signal)
  const photo = sharp(data, { limitInputPixels: 32_000_000 })
  const { format } = await photo.metadata()
  if (!['jpeg', 'png', 'webp', 'avif', 'heif', 'gif'].includes(format))
    return
  return photo.rotate().resize({ width: 736, height: 416, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
}
