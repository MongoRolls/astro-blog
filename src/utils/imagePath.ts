/**
 * 统一图片路径管理工具
 * 提供环境感知的图片路径获取功能
 */
import type { ImagePathOptions } from '../types/image'
import { envConfig } from '../config/env'
import { getCoverPathPrefix, getImageBaseUrl } from '../config/image'

function resolveSource(sourceOverride?: ImagePathOptions['source']) {
  return sourceOverride || envConfig.imageSource
}

/**
 * 构建文章封面图片路径
 * @param postId 文章 ID
 * @param options 图片路径选项
 * @returns 封面图片路径
 */
export function buildCoverPath(postId: string, options?: ImagePathOptions) {
  const source = resolveSource(options?.source)

  if (source === 'local') {
    // 开发环境使用统一占位图，避免缺失封面时的 404
    if (envConfig.isDev) {
      return '/cover-images/image.png'
    }
    return '/cover-images/image.png'
    // return `${getCoverPathPrefix('local')}/${postId}.jpg`
  }

  const baseUrl = getImageBaseUrl(source)
  // https://mongorolls-images.oss-cn-shenzhen.aliyuncs.com/img/imageplaceholder.png
  // return `${baseUrl}${getCoverPathPrefix('oss')}/${postId}.jpg`
  return `${baseUrl}${getCoverPathPrefix('oss')}/imageplaceholder.png`
}

/**
 * 获取封面图片路径（无 fallback）
 */
export function getCoverImagePath(postId: string, options?: ImagePathOptions): string {
  return buildCoverPath(postId, options)
}
/**
 * 获取静态资源路径（允许 http(s) 直链）
 */
export function getStaticImagePath(imagePath: string, options?: ImagePathOptions): string {
  if (!imagePath) {
    return ''
  }

  if (imagePath.startsWith('http')) {
    return imagePath
  }

  const source = resolveSource(options?.source)
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`

  if (source === 'local') {
    return normalizedPath
  }

  const baseUrl = getImageBaseUrl(source)
  return `${baseUrl}/img${normalizedPath}`
}

/**
 * Hero 图片与静态资源共享逻辑
 */
export function getHeroImagePath(imageName: string, options?: ImagePathOptions): string {
  return getStaticImagePath(imageName, options)
}
