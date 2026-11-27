import { createHash } from 'node:crypto'

// 页面片段共用分享图，查询参数可能指向不同内容。
export function linkImageFilename(url) {
  const page = new URL(url)
  page.hash = ''
  const label = (page.hostname + page.pathname).replace(/[^a-z0-9.-]+/gi, '-').replace(/-$/, '').slice(0, 70)
  const digest = createHash('sha256').update(page.href).digest('hex').slice(0, 16)
  return `${label}-${digest}.webp`
}
