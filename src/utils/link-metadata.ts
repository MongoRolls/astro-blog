/**
 * 从URL中提取域名
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  }
  catch {
    return ''
  }
}

/**
 * 获取网站favicon URL
 */
export function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  }
  catch {
    return ''
  }
}

/**
 * 检查URL是否有效
 */
export function isValidUrl(url: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(url)
    return true
  }
  catch {
    return false
  }
}

/**
 * 规范化URL
 */
export function normalizeUrl(url: string): string {
  if (!url)
    return ''

  // 如果没有协议，默认添加https
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`
  }

  return url
}

/**
 * 获取页面的title
 * @param url 页面URL
 * @returns 页面标题
 */
export async function getPageTitle(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
    const html = await response.text()
    const title = html.match(/<title>(.*?)<\/title>/)?.[1]
    if (title?.includes('Just a moment...')) {
      return new URL(url).host
    }
    return title || 'xxx'
  }
  catch (error) {
    console.error(`Failed to get title for ${url}:`, error)
    return 'xxx'
  }
}

/**
 * 判断是否为外部链接
 */
export function isExternalLink(url: string, currentDomain: string = ''): boolean {
  try {
    const urlObj = new URL(url)
    const linkDomain = urlObj.hostname

    if (!currentDomain) {
      // 如果没有提供当前域名，则检查是否为相对链接
      return !url.startsWith('/') && !url.startsWith('#')
    }

    return linkDomain !== currentDomain
  }
  catch {
    return false
  }
}
