/**
 * 统一图片路径管理工具
 * 提供环境感知的图片路径获取功能
 */

import type { CoverImage, ImagePathOptions } from '../types/image'
import { envConfig } from '../config/env'
import { getCoverPathPrefix, getImageBaseUrl } from '../config/image'

/**
 * 获取封面图片路径
 */
export function getCoverImagePath(postId: string, options?: ImagePathOptions): string {
  const source = options?.source || envConfig.imageSource
  const baseUrl = getImageBaseUrl(source)
  const pathPrefix = getCoverPathPrefix(source)

  const fileName = `${postId}.jpg`

  if (source === 'local') {
    return `${pathPrefix}/${fileName}`
  }
  else {
    return `${baseUrl}${pathPrefix}/${fileName}`
  }
}

/**
 * 获取封面图片路径（带fallback）
 */
export function getCoverImagePathWithFallback(postId: string, options?: ImagePathOptions): string {
  const fallback = options?.fallback || '/logo.png'

  try {
    return getCoverImagePath(postId, options)
  }
  catch (error: any) {
    console.warn(`Failed to get cover image for ${postId}, using fallback: ${fallback}`, error)
    return fallback
  }
}

/**
 * 获取静态资源图片路径
 */
export function getStaticImagePath(imagePath: string, options?: ImagePathOptions): string {
  const source = options?.source || envConfig.imageSource

  if (source === 'local') {
    // 本地静态资源直接使用public路径
    return imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  }
  else {
    // OSS静态资源需要检查是否已经是完整URL
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    const baseUrl = getImageBaseUrl(source)
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
    return `${baseUrl}/img/${cleanPath}`
  }
}

/**
 * 获取Hero图片路径
 */
export function getHeroImagePath(imageName: string, options?: ImagePathOptions): string {
  const source = options?.source || envConfig.imageSource
  const baseUrl = getImageBaseUrl(source)

  if (source === 'local') {
    return `/${imageName}`
  }
  else {
    return `${baseUrl}/img/${imageName}`
  }
}

/**
 * 检查封面图片是否存在（仅用于构建时）
 */
export function getCoverImageInfo(postId: string): CoverImage {
  const fileName = `${postId}.jpg`
  const localPath = `/cover-images/${fileName}`
  const ossPath = `https://mongorolls-images.oss-cn-shenzhen.aliyuncs.com/img/${fileName}`

  return {
    postId,
    fileName,
    localPath,
    ossPath,
    exists: false, // 实际检查需要在构建时进行
  }
}
