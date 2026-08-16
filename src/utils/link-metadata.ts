/**
 * 文章外链站点图标与 URL 规范化。
 * 图标源按国内可达性和广告拦截兼容性排序，不走 google.com/s2。
 */

export function extractDomain(url: string): string {
  return URL.canParse(url) ? new URL(url).hostname : ''
}

export function isValidUrl(url: string): boolean {
  return URL.canParse(url)
}

export function normalizeUrl(url: string): string {
  if (!url)
    return ''

  if (/^https?:\/\//i.test(url))
    return url

  if (/^(?:[\w-]+\.)+[a-z]{2,}(?:[/:?#]|$)/i.test(url))
    return `https://${url}`

  return url
}

export function isExternalLink(url: string, currentDomain = ''): boolean {
  if (!URL.canParse(url))
    return false

  if (!currentDomain)
    return !url.startsWith('/') && !url.startsWith('#')

  return new URL(url).hostname !== currentDomain
}

export function getFaviconCandidates(url: string): string[] {
  const domain = extractDomain(url)
  if (!domain)
    return []

  const encodedUrl = encodeURIComponent(`https://${domain}`)
  return [
    `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodedUrl}&size=32`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://${domain}/favicon.ico`,
  ]
}

export function getFaviconUrl(url: string): string {
  return getFaviconCandidates(url)[0] ?? ''
}
